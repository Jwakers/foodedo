import { ConvexError, v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { mutation, query, QueryCtx } from "./_generated/server";
import {
  canAccessRecipe,
  isHouseholdMember,
  resolveDefaultHouseholdIdForSharing,
} from "./households";
import {
  MAX_DAYS_IN_MEAL_PLAN,
  RECENTLY_SUGGESTED_DAYS,
} from "./lib/constants";
import {
  buildPool,
  getBehaviourStatsForActor,
  getRecentlySuggested,
  selectRecipes,
} from "./mealPlanGenerator";
import type { PoolRecipe } from "./mealPlanGenerator";
import {
  getActorForPlan,
  incrementRemoved,
  incrementSuggested,
  incrementSwapped,
} from "./recipeBehaviourStats";
import { getCurrentUser, getCurrentUserOrThrow } from "./users";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// ============================================================================
// HELPERS
// ============================================================================

function startOfDayMs(ms: number): number {
  const d = new Date(ms);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

/** UTC calendar day as YYYY-MM-DD (matches stored plan start/end boundaries). */
function utcDayKeyFromMs(ms: number): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type PlanWithEntryStats = {
  plan: Doc<"mealPlans">;
  entryCount: number;
  entryMinDate: number | null;
  entryMaxDate: number | null;
  isOwner: boolean;
};

async function collectActivePlansForUser(
  ctx: QueryCtx,
  userId: Id<"users">,
): Promise<Doc<"mealPlans">[]> {
  const today = startOfDayMs(Date.now());

  const ownedPlans = await ctx.db
    .query("mealPlans")
    .withIndex("by_user_and_endDate", (q) =>
      q.eq("userId", userId).gte("endDate", today),
    )
    .order("desc")
    .collect();

  const memberships = await ctx.db
    .query("householdMembers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  const householdIds = memberships.map((m) => m.householdId);

  const sharedPlans: Doc<"mealPlans">[] = [];
  for (const householdId of householdIds) {
    const plans = await ctx.db
      .query("mealPlans")
      .withIndex("by_household", (q) => q.eq("householdId", householdId))
      .filter((q) => q.gte(q.field("endDate"), today))
      .collect();
    sharedPlans.push(...plans);
  }

  const seenIds = new Set<Id<"mealPlans">>();
  const allPlans = [...ownedPlans, ...sharedPlans].filter((p) => {
    if (seenIds.has(p._id)) return false;
    seenIds.add(p._id);
    return true;
  });

  return allPlans.filter((p) => p.replacedByPlanId === undefined);
}

async function loadPlanSummariesWithEntryStats(
  ctx: QueryCtx,
  plans: Doc<"mealPlans">[],
  userId: Id<"users">,
): Promise<PlanWithEntryStats[]> {
  const out: PlanWithEntryStats[] = [];
  for (const p of plans) {
    const entries = await ctx.db
      .query("mealPlanEntries")
      .withIndex("by_meal_plan", (q) => q.eq("mealPlanId", p._id))
      .collect();
    const dates = entries.map((e) => e.date);
    out.push({
      plan: p,
      entryCount: entries.length,
      entryMinDate: dates.length > 0 ? Math.min(...dates) : null,
      entryMaxDate: dates.length > 0 ? Math.max(...dates) : null,
      isOwner: p.userId === userId,
    });
  }
  return out;
}

function planCoversLocalDateKey(
  plan: Doc<"mealPlans">,
  entryMinDate: number | null,
  entryMaxDate: number | null,
  localDateKey: string,
): boolean {
  const startKey =
    plan.startDate !== undefined
      ? utcDayKeyFromMs(plan.startDate)
      : entryMinDate !== null
        ? utcDayKeyFromMs(entryMinDate)
        : null;
  const endKey =
    plan.endDate !== undefined
      ? utcDayKeyFromMs(plan.endDate)
      : entryMaxDate !== null
        ? utcDayKeyFromMs(entryMaxDate)
        : null;
  if (startKey === null || endKey === null) return false;
  return localDateKey >= startKey && localDateKey <= endKey;
}

function pickPreferredPlanDoc(
  summaries: PlanWithEntryStats[],
  localDateKey: string | undefined,
): Doc<"mealPlans"> | null {
  if (summaries.length === 0) return null;
  if (localDateKey) {
    const finalisedCovering = summaries.filter(
      (s) =>
        s.plan.isFinalised === true &&
        planCoversLocalDateKey(
          s.plan,
          s.entryMinDate,
          s.entryMaxDate,
          localDateKey,
        ),
    );
    if (finalisedCovering.length > 0) {
      finalisedCovering.sort(
        (a, b) => (b.plan.updatedAt ?? 0) - (a.plan.updatedAt ?? 0),
      );
      return finalisedCovering[0]!.plan;
    }
  }
  const sorted = [...summaries].sort(
    (a, b) => (b.plan.updatedAt ?? 0) - (a.plan.updatedAt ?? 0),
  );
  return sorted[0]!.plan;
}

async function buildEntriesWithRecipes(
  ctx: QueryCtx,
  mealPlanId: Id<"mealPlans">,
) {
  const entries = await ctx.db
    .query("mealPlanEntries")
    .withIndex("by_meal_plan", (q) => q.eq("mealPlanId", mealPlanId))
    .collect();

  const entriesWithRecipes = await Promise.all(
    entries.map(async (entry) => {
      const recipe = await ctx.db.get(entry.recipeId);
      if (!recipe) return { ...entry, recipe: null };
      const image = recipe.image
        ? await ctx.storage.getUrl(recipe.image)
        : null;
      const totalTimeMinutes =
        recipe.totalTimeMinutes ??
        (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
      return {
        ...entry,
        recipe: {
          _id: recipe._id,
          title: recipe.title,
          image,
          ingredients: recipe.ingredients,
          prepTime: recipe.prepTime ?? 0,
          cookTime: recipe.cookTime,
          totalTimeMinutes,
          nutrition: recipe.nutrition,
          category: recipe.category,
          primaryProtein: recipe.primaryProtein,
        },
      };
    }),
  );

  return entriesWithRecipes.sort(
    (a, b) => a.date - b.date || (a.order ?? 0) - (b.order ?? 0),
  );
}

export async function canAccessMealPlan(
  ctx: QueryCtx,
  userId: Id<"users">,
  plan: { userId: Id<"users">; householdId?: Id<"households"> },
): Promise<boolean> {
  if (plan.userId === userId) return true;
  if (plan.householdId) {
    return await isHouseholdMember(ctx, userId, plan.householdId);
  }
  return false;
}

export async function isMealPlanOwner(
  _ctx: QueryCtx,
  userId: Id<"users">,
  plan: { userId: Id<"users"> },
): Promise<boolean> {
  return plan.userId === userId;
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get a meal plan by ID with entries and recipe details. Allowed if user is owner or plan is shared with their household.
 */
export const getMealPlan = query({
  args: { mealPlanId: v.id("mealPlans") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const plan = await ctx.db.get(args.mealPlanId);
    if (!plan) return null;

    const allowed = await canAccessMealPlan(ctx, user._id, plan);
    if (!allowed) return null;

    const entries = await buildEntriesWithRecipes(ctx, args.mealPlanId);

    return {
      ...plan,
      entries,
      isOwner: plan.userId === user._id,
    };
  },
});

/**
 * Get the user's "current" meal plan for dashboard / default UX: non-superseded
 * plans with endDate >= today. Prefers a finalised plan whose UTC date range
 * covers `localDateKey` (YYYY-MM-DD in the user's local calendar); otherwise the
 * most recently updated active plan.
 */
export const getCurrentMealPlan = query({
  args: {
    localDateKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const activePlans = await collectActivePlansForUser(ctx, user._id);
    if (activePlans.length === 0) return null;

    const summaries = await loadPlanSummariesWithEntryStats(
      ctx,
      activePlans,
      user._id,
    );
    const current = pickPreferredPlanDoc(summaries, args.localDateKey);
    if (!current) return null;

    const entries = await buildEntriesWithRecipes(ctx, current._id);

    return {
      ...current,
      entries,
      isOwner: current.userId === user._id,
    };
  },
});

/**
 * Active meal plans (not superseded, endDate >= today) for picker UI.
 */
export const getActiveMealPlanSummaries = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const activePlans = await collectActivePlansForUser(ctx, user._id);
    if (activePlans.length === 0) return [];

    const summaries = await loadPlanSummariesWithEntryStats(
      ctx,
      activePlans,
      user._id,
    );
    summaries.sort(
      (a, b) => (b.plan.updatedAt ?? 0) - (a.plan.updatedAt ?? 0),
    );

    return summaries.map((s) => ({
      _id: s.plan._id,
      startDate: s.plan.startDate,
      endDate: s.plan.endDate,
      isFinalised: s.plan.isFinalised === true,
      updatedAt: s.plan.updatedAt,
      isOwner: s.isOwner,
      householdId: s.plan.householdId,
      entryCount: s.entryCount,
      entryMinDate: s.entryMinDate,
      entryMaxDate: s.entryMaxDate,
    }));
  },
});

/**
 * Get list of user's meal plans (owned + shared) for "past plans" or duplicate-week.
 */
export const getMealPlansForUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const owned = await ctx.db
      .query("mealPlans")
      .withIndex("by_user_and_endDate", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    const memberships = await ctx.db
      .query("householdMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const shared: Doc<"mealPlans">[] = [];
    for (const m of memberships) {
      const plans = await ctx.db
        .query("mealPlans")
        .withIndex("by_household_and_endDate", (q) =>
          q.eq("householdId", m.householdId),
        )
        .order("desc")
        .collect();
      shared.push(...plans);
    }

    const seenIds = new Set<Id<"mealPlans">>();
    const combined = [...owned, ...shared].filter((p) => {
      if (seenIds.has(p._id)) return false;
      seenIds.add(p._id);
      return true;
    });
    combined.sort((a, b) => b.endDate - a.endDate);
    return combined.slice(0, 20);
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

// QA / migration: meal plans created before default household sharing may still
// have no householdId; share via shareMealPlanWithHousehold or backfill
// householdId for rows where the owner has a single household.

/**
 * Create a new meal plan. endDate defaults to MAX_DAYS_IN_MEAL_PLAN days from today if not provided.
 */
export const createMealPlan = mutation({
  args: {
    endDate: v.optional(v.number()),
    startDate: v.optional(v.number()),
    isGenerated: v.optional(v.boolean()),
    generatedAt: v.optional(v.number()),
    generationSeed: v.optional(v.string()),
    /** When omitted: shared if the user belongs to exactly one household; otherwise the plan is not shared until they use Share or pass this field. */
    householdId: v.optional(v.id("households")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const now = Date.now();
    const today = startOfDayMs(now);
    const defaultEnd = startOfDayMs(now + MAX_DAYS_IN_MEAL_PLAN * ONE_DAY_MS);
    const endDate = args.endDate ?? defaultEnd;
    if (endDate < today) {
      throw new ConvexError("End date must be today or in the future");
    }
    const startDate = args.startDate;
    if (startDate !== undefined && startDate > endDate) {
      throw new ConvexError(
        "Start date must be on or before the plan end date",
      );
    }

    const shareHouseholdId = await resolveDefaultHouseholdIdForSharing(
      ctx,
      user._id,
      args.householdId,
    );

    const planId = await ctx.db.insert("mealPlans", {
      userId: user._id,
      endDate,
      startDate: args.startDate,
      updatedAt: now,
      isGenerated: args.isGenerated ?? false,
      generatedAt: args.generatedAt,
      generationSeed: args.generationSeed,
      ...(shareHouseholdId !== undefined && { householdId: shareHouseholdId }),
    });
    return { planId };
  },
});

/**
 * Generate a new weekly meal plan using the intelligent selection algorithm.
 * Spec 6.1, 6.2, 6.5: creates plan, selects MAX_DAYS_IN_MEAL_PLAN recipes (pool + constraints + behavioural scoring), inserts entries, increments suggestedCount for each.
 */
export const generateWeeklyPlan = mutation({
  args: {
    /** When omitted: shared if the user belongs to exactly one household; otherwise the new plan is private until they share or pass this field. */
    householdId: v.optional(v.id("households")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const now = Date.now();
    const startDate = startOfDayMs(now);
    const endDate = startOfDayMs(now + MAX_DAYS_IN_MEAL_PLAN * ONE_DAY_MS);

    const shareHouseholdId = await resolveDefaultHouseholdIdForSharing(
      ctx,
      user._id,
      args.householdId,
    );

    const generationSeed = `gen-${now}-${Math.random().toString(36).slice(2, 11)}`;

    const actorType = "user";
    const actorId = user._id;

    const pool = await buildPool(ctx, user._id, shareHouseholdId ?? null);
    const recentlySuggested = await getRecentlySuggested(
      ctx,
      actorType,
      actorId,
      RECENTLY_SUGGESTED_DAYS,
    );
    const actorStats = await getBehaviourStatsForActor(ctx, actorType, actorId);

    const selectedIds = selectRecipes(
      pool,
      MAX_DAYS_IN_MEAL_PLAN,
      actorStats,
      generationSeed,
      recentlySuggested,
      [],
    );

    if (selectedIds.length === 0) {
      throw new ConvexError("No recipes available to generate meal plan");
    }

    const planId = await ctx.db.insert("mealPlans", {
      userId: user._id,
      endDate,
      startDate,
      updatedAt: now,
      isGenerated: true,
      generationSeed,
      generationVersion: 1,
      generatedAt: now,
      ...(shareHouseholdId !== undefined && { householdId: shareHouseholdId }),
    });

    for (let i = 0; i < selectedIds.length; i++) {
      const recipeId = selectedIds[i];
      const dateStart = startOfDayMs(startDate + i * ONE_DAY_MS);
      await ctx.db.insert("mealPlanEntries", {
        mealPlanId: planId,
        date: dateStart,
        recipeId,
        order: i,
      });
      await incrementSuggested(ctx, recipeId, actorType, actorId);
    }

    await ctx.db.patch(planId, { updatedAt: Date.now() });
    return { planId };
  },
});

/**
 * Create a weekly meal plan with no entries: same date window and household
 * sharing as generateWeeklyPlan, for users who want to pick every meal manually.
 */
export const createBlankWeeklyPlan = mutation({
  args: {
    /** When omitted: shared if the user belongs to exactly one household; otherwise the new plan is private until they share or pass this field. */
    householdId: v.optional(v.id("households")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const now = Date.now();
    const startDate = startOfDayMs(now);
    const endDate = startOfDayMs(now + MAX_DAYS_IN_MEAL_PLAN * ONE_DAY_MS);

    const shareHouseholdId = await resolveDefaultHouseholdIdForSharing(
      ctx,
      user._id,
      args.householdId,
    );

    const planId = await ctx.db.insert("mealPlans", {
      userId: user._id,
      endDate,
      startDate,
      updatedAt: now,
      isGenerated: false,
      ...(shareHouseholdId !== undefined && { householdId: shareHouseholdId }),
    });

    return { planId };
  },
});

/**
 * Regenerate week: create new plan, copy locked entries (no suggestedCount bump), fill rest with algorithm. Spec 6.2 Option B.
 */
export const regenerateWeeklyPlan = mutation({
  args: { previousPlanId: v.id("mealPlans") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const previousPlan = await ctx.db.get(args.previousPlanId);
    if (!previousPlan) throw new ConvexError("Meal plan not found");
    if (previousPlan.userId !== user._id) {
      throw new ConvexError("Only the plan owner can regenerate");
    }
    if (previousPlan.isFinalised) {
      throw new ConvexError("Cannot regenerate a finalised plan");
    }

    const entries = await ctx.db
      .query("mealPlanEntries")
      .withIndex("by_meal_plan", (q) => q.eq("mealPlanId", args.previousPlanId))
      .collect();

    const locked = entries.filter((e) => e.isLocked === true);
    const lockedSorted = [...locked].sort(
      (a, b) => (a.order ?? 999) - (b.order ?? 999),
    );

    const now = Date.now();
    const startDate = startOfDayMs(now);
    const endDate = startOfDayMs(now + MAX_DAYS_IN_MEAL_PLAN * ONE_DAY_MS);
    const generationSeed = `gen-${now}-${Math.random().toString(36).slice(2, 11)}`;

    const newPlanId = await ctx.db.insert("mealPlans", {
      userId: user._id,
      endDate,
      startDate,
      updatedAt: now,
      isGenerated: true,
      generationSeed,
      generationVersion: 1,
      generatedAt: now,
      householdId: previousPlan.householdId,
    });

    const actor = getActorForPlan(previousPlan);
    const actorType = actor.actorType;
    const actorId = actor.actorId;

    for (const entry of lockedSorted) {
      const order = entry.order ?? 0;
      const dateStart = startOfDayMs(startDate + order * ONE_DAY_MS);
      await ctx.db.insert("mealPlanEntries", {
        mealPlanId: newPlanId,
        date: dateStart,
        recipeId: entry.recipeId,
        order,
        isLocked: true,
      });
    }

    const lockedOrders = new Set(lockedSorted.map((e) => e.order ?? 0));
    const availableOrders = Array.from(
      { length: MAX_DAYS_IN_MEAL_PLAN },
      (_, i) => i,
    ).filter((o) => !lockedOrders.has(o));
    const toSelect = availableOrders.length;
    if (toSelect > 0) {
      const pool = await buildPool(
        ctx,
        previousPlan.userId,
        previousPlan.householdId ?? null,
      );
      const recentlySuggested = await getRecentlySuggested(
        ctx,
        actorType,
        actorId,
        RECENTLY_SUGGESTED_DAYS,
      );
      const actorStats = await getBehaviourStatsForActor(
        ctx,
        actorType,
        actorId,
      );

      const lockedPoolRecipes: PoolRecipe[] = [];
      for (const entry of lockedSorted) {
        const recipe = await ctx.db.get(entry.recipeId);
        if (recipe)
          lockedPoolRecipes.push({
            _id: recipe._id,
            primaryProtein: recipe.primaryProtein,
            complexityTier: recipe.complexityTier,
            cuisine: recipe.cuisine,
            editorialBias: recipe.editorialBias,
            isSystem: recipe.source === "system",
          });
      }

      const newIds = selectRecipes(
        pool,
        toSelect,
        actorStats,
        generationSeed,
        recentlySuggested,
        lockedPoolRecipes,
      );

      for (let i = 0; i < newIds.length; i++) {
        const recipeId = newIds[i];
        const order = availableOrders[i];
        const dateStart = startOfDayMs(startDate + order * ONE_DAY_MS);
        await ctx.db.insert("mealPlanEntries", {
          mealPlanId: newPlanId,
          date: dateStart,
          recipeId,
          order,
        });
        await incrementSuggested(ctx, recipeId, actorType, actorId);
      }
    }

    await ctx.db.patch(args.previousPlanId, {
      replacedByPlanId: newPlanId,
      updatedAt: Date.now(),
    });

    const listsToUpdate = await ctx.db
      .query("shoppingLists")
      .withIndex("by_meal_plan", (q) => q.eq("mealPlanId", args.previousPlanId))
      .collect();
    for (const list of listsToUpdate) {
      await ctx.db.patch(list._id, { mealPlanId: newPlanId });
    }

    await ctx.db.patch(newPlanId, { updatedAt: Date.now() });
    return { planId: newPlanId };
  },
});

/**
 * Update a meal plan's end date. Owner only.
 */
export const updateMealPlanEndDate = mutation({
  args: {
    mealPlanId: v.id("mealPlans"),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const plan = await ctx.db.get(args.mealPlanId);
    if (!plan) throw new ConvexError("Meal plan not found");
    if (plan.userId !== user._id) {
      throw new ConvexError("You can only update your own meal plans");
    }
    const normalizedEnd = startOfDayMs(args.endDate);
    const today = startOfDayMs(Date.now());
    if (normalizedEnd < today) {
      throw new ConvexError("End date must be today or in the future");
    }
    if (plan.startDate !== undefined && normalizedEnd < plan.startDate) {
      throw new ConvexError("End date must be on or after the plan start date");
    }
    await ctx.db.patch(args.mealPlanId, {
      endDate: normalizedEnd,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

/**
 * Share meal plan with a household. Caller must be owner and household member.
 */
export const shareMealPlanWithHousehold = mutation({
  args: {
    mealPlanId: v.id("mealPlans"),
    householdId: v.id("households"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const plan = await ctx.db.get(args.mealPlanId);
    if (!plan) throw new ConvexError("Meal plan not found");
    if (plan.userId !== user._id) {
      throw new ConvexError("You can only share your own meal plans");
    }
    const isMember = await isHouseholdMember(ctx, user._id, args.householdId);
    if (!isMember) {
      throw new ConvexError("You must be a member of the household to share");
    }
    await ctx.db.patch(args.mealPlanId, {
      householdId: args.householdId,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

/**
 * Opt out of household sharing for this meal plan. Owner only.
 * Household members lose access to the plan and to shopping lists that were only visible via plan access
 * (lists still linked by `householdId` on the shopping list row remain visible to the household).
 */
export const unshareMealPlan = mutation({
  args: { mealPlanId: v.id("mealPlans") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const plan = await ctx.db.get(args.mealPlanId);
    if (!plan) throw new ConvexError("Meal plan not found");
    if (plan.userId !== user._id) {
      throw new ConvexError("You can only unshare your own meal plans");
    }
    await ctx.db.patch(args.mealPlanId, {
      householdId: undefined,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

/**
 * Add an entry to a meal plan. Owner only. Date must be <= plan endDate; user must have access to recipe.
 */
export const addEntry = mutation({
  args: {
    mealPlanId: v.id("mealPlans"),
    date: v.number(),
    recipeId: v.id("recipes"),
    mealLabel: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const plan = await ctx.db.get(args.mealPlanId);
    if (!plan) throw new ConvexError("Meal plan not found");
    if (plan.userId !== user._id) {
      throw new ConvexError("Only the plan owner can add meals");
    }
    if (plan.isFinalised) {
      throw new ConvexError("Cannot add meals to a finalised plan");
    }
    const dateStart = startOfDayMs(args.date);
    if (plan.startDate !== undefined && dateStart < plan.startDate) {
      throw new ConvexError("Date must be on or after the plan start date");
    }
    if (dateStart > plan.endDate) {
      throw new ConvexError("Date must be on or before the plan end date");
    }
    const { canAccess } = await canAccessRecipe(ctx, user._id, args.recipeId);
    if (!canAccess) {
      throw new ConvexError("You do not have access to this recipe");
    }
    const recipeDoc = await ctx.db.get(args.recipeId);
    if (!recipeDoc) throw new ConvexError("Recipe not found");

    await ctx.db.insert("mealPlanEntries", {
      mealPlanId: args.mealPlanId,
      date: dateStart,
      recipeId: args.recipeId,
      mealLabel: args.mealLabel,
      order: args.order,
    });
    await ctx.db.patch(args.mealPlanId, { updatedAt: Date.now() });
    return { success: true };
  },
});

/**
 * Update an entry (date, recipe, label). Owner only.
 */
export const updateEntry = mutation({
  args: {
    entryId: v.id("mealPlanEntries"),
    date: v.optional(v.number()),
    recipeId: v.optional(v.id("recipes")),
    mealLabel: v.optional(v.string()),
    order: v.optional(v.number()),
    isLocked: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const entry = await ctx.db.get(args.entryId);
    if (!entry) throw new ConvexError("Entry not found");
    const plan = await ctx.db.get(entry.mealPlanId);
    if (!plan) throw new ConvexError("Meal plan not found");
    if (plan.userId !== user._id) {
      throw new ConvexError("Only the plan owner can update meals");
    }
    if (plan.isFinalised) {
      if (args.recipeId !== undefined || args.isLocked !== undefined) {
        throw new ConvexError(
          "Cannot change recipe or lock state on a finalised plan; you can only move meals between days",
        );
      }
    }
    const updates: {
      date?: number;
      recipeId?: Id<"recipes">;
      mealLabel?: string;
      order?: number;
      isLocked?: boolean;
    } = {};
    if (args.date !== undefined) {
      const dateStart = startOfDayMs(args.date);
      if (plan.startDate !== undefined && dateStart < plan.startDate) {
        throw new ConvexError("Date must be on or after the plan start date");
      }
      if (dateStart > plan.endDate) {
        throw new ConvexError("Date must be on or before the plan end date");
      }
      updates.date = dateStart;
    }
    if (args.recipeId !== undefined) {
      const recipeDoc = await ctx.db.get(args.recipeId);
      if (!recipeDoc) throw new ConvexError("Recipe not found");
      const { canAccess } = await canAccessRecipe(ctx, user._id, args.recipeId);
      if (!canAccess) {
        throw new ConvexError("You do not have access to this recipe");
      }
      // Spec 4.3: swap — increment swappedCount for old recipe, suggestedCount for new (actor from plan)
      if (args.recipeId !== entry.recipeId) {
        const actor = getActorForPlan(plan);
        await incrementSwapped(
          ctx,
          entry.recipeId,
          actor.actorType,
          actor.actorId,
        );
        await incrementSuggested(
          ctx,
          args.recipeId,
          actor.actorType,
          actor.actorId,
        );
      }
      updates.recipeId = args.recipeId;
    }
    if (args.mealLabel !== undefined) updates.mealLabel = args.mealLabel;
    if (args.order !== undefined) updates.order = args.order;
    if (args.isLocked !== undefined) updates.isLocked = args.isLocked;
    await ctx.db.patch(args.entryId, updates);
    await ctx.db.patch(entry.mealPlanId, { updatedAt: Date.now() });
    return { success: true };
  },
});

/**
 * Finalise a meal plan: no more add/remove/swap/regenerate; only moving meals between days is allowed.
 */
export const finaliseMealPlan = mutation({
  args: { mealPlanId: v.id("mealPlans") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const plan = await ctx.db.get(args.mealPlanId);
    if (!plan) throw new ConvexError("Meal plan not found");
    if (plan.userId !== user._id) {
      throw new ConvexError("Only the plan owner can finalise the plan");
    }
    if (plan.isFinalised) {
      throw new ConvexError("Plan is already finalised");
    }
    await ctx.db.patch(args.mealPlanId, {
      isFinalised: true,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

/**
 * Remove an entry. Owner only.
 * Spec 4.3: increment removedCount for the recipe (actor from plan).
 */
export const removeEntry = mutation({
  args: { entryId: v.id("mealPlanEntries") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const entry = await ctx.db.get(args.entryId);
    if (!entry) throw new ConvexError("Entry not found");
    const plan = await ctx.db.get(entry.mealPlanId);
    if (!plan) throw new ConvexError("Meal plan not found");
    if (plan.userId !== user._id) {
      throw new ConvexError("Only the plan owner can remove meals");
    }
    if (plan.isFinalised) {
      throw new ConvexError("Cannot remove meals from a finalised plan");
    }
    const actor = getActorForPlan(plan);
    await incrementRemoved(ctx, entry.recipeId, actor.actorType, actor.actorId);
    await ctx.db.delete(args.entryId);
    await ctx.db.patch(entry.mealPlanId, { updatedAt: Date.now() });
    return { success: true };
  },
});

/**
 * Delete a meal plan and all its entries. Owner only.
 */
export const deleteMealPlan = mutation({
  args: { mealPlanId: v.id("mealPlans") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const plan = await ctx.db.get(args.mealPlanId);
    if (!plan) throw new ConvexError("Meal plan not found");
    if (plan.userId !== user._id) {
      throw new ConvexError("You can only delete your own meal plans");
    }
    const entries = await ctx.db
      .query("mealPlanEntries")
      .withIndex("by_meal_plan", (q) => q.eq("mealPlanId", args.mealPlanId))
      .collect();
    for (const entry of entries) {
      await ctx.db.delete(entry._id);
    }
    await ctx.db.delete(args.mealPlanId);
    return { success: true };
  },
});
