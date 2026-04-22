import { ConvexError, v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { mutation, query, QueryCtx } from "./_generated/server";
import {
  canAccessRecipe,
  isHouseholdMember,
  resolveDefaultHouseholdIdForSharing,
} from "./households";
import {
  canCreateMultipleMealPlans,
  canUseAdvancedMealPlanControls,
  canUseLeftoverIngredients,
  LEFTOVER_INGREDIENTS_MAX,
  MAX_DAYS_IN_MEAL_PLAN,
  RECENTLY_SUGGESTED_DAYS,
} from "./lib/constants";
import {
  collectLeftoverMatchIds,
  collectLeftoverMatchKeys,
  lineMatchesLeftoverPhrase,
  normaliseLeftoverPhrasesList,
} from "./lib/leftoverIngredients";
import type { PoolRecipe } from "./mealPlanGenerator";
import {
  buildPool,
  getBehaviourStatsForActor,
  getRecentlySuggested,
  selectRecipes,
} from "./mealPlanGenerator";
import {
  getActorForPlan,
  incrementRemoved,
  incrementSuggested,
  incrementSwapped,
} from "./recipeBehaviourStats";
import { getCurrentUser, getCurrentUserOrThrow } from "./users";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function phraseDisplayLabel(normalised: string): string {
  return normalised
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function prepareLeftoverInputs(
  rawIds: Id<"ingredients">[] | undefined,
  rawPhrases: string[] | undefined,
): {
  ids: Id<"ingredients">[] | undefined;
  phrases: string[] | undefined;
  totalCount: number;
  wantsLeftovers: boolean;
} {
  const ids = rawIds?.filter(Boolean).length
    ? ([...new Set(rawIds.filter(Boolean))] as Id<"ingredients">[])
    : [];
  const phrases = normaliseLeftoverPhrasesList(rawPhrases);
  const totalCount = ids.length + phrases.length;
  if (totalCount > LEFTOVER_INGREDIENTS_MAX) {
    throw new ConvexError(
      `At most ${LEFTOVER_INGREDIENTS_MAX} leftover ingredients`,
    );
  }
  return {
    ids: ids.length ? ids : undefined,
    phrases: phrases.length ? phrases : undefined,
    totalCount,
    wantsLeftovers: totalCount > 0,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function startOfDayMs(ms: number): number {
  const d = new Date(ms);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

function resolveMealPlanWindow(args: {
  startDate?: number;
  dayCount?: number;
  subscriptionTier: string | undefined;
}): { startDate: number; endDate: number; dayCount: number } {
  const nowStart = startOfDayMs(Date.now());
  const isEntitledToAdvancedControls = canUseAdvancedMealPlanControls(
    args.subscriptionTier,
  );

  // Server-side source of truth: if advanced controls are not allowed, silently
  // coerce to standard weekly defaults regardless of client payload.
  const requestedStart = isEntitledToAdvancedControls
    ? args.startDate
      ? startOfDayMs(args.startDate)
      : nowStart
    : nowStart;
  const requestedDayCount = isEntitledToAdvancedControls
    ? (args.dayCount ?? MAX_DAYS_IN_MEAL_PLAN)
    : MAX_DAYS_IN_MEAL_PLAN;

  if (requestedDayCount < 1 || requestedDayCount > MAX_DAYS_IN_MEAL_PLAN) {
    throw new ConvexError(
      `dayCount must be between 1 and ${MAX_DAYS_IN_MEAL_PLAN}`,
    );
  }

  const endDate = startOfDayMs(
    requestedStart + (requestedDayCount - 1) * ONE_DAY_MS,
  );
  return {
    startDate: requestedStart,
    endDate,
    dayCount: requestedDayCount,
  };
}

async function assertCanCreateAnotherPlanForUser(
  ctx: QueryCtx,
  userId: Id<"users">,
  subscriptionTier: string | undefined,
): Promise<void> {
  if (canCreateMultipleMealPlans(subscriptionTier)) return;
  const today = startOfDayMs(Date.now());
  const activeOwnedPlans = await ctx.db
    .query("mealPlans")
    .withIndex("by_user_and_endDate", (q) =>
      q.eq("userId", userId).gte("endDate", today),
    )
    .collect();
  const hasExisting = activeOwnedPlans.some((plan) => !plan.replacedByPlanId);
  if (hasExisting) {
    throw new ConvexError("PREMIUM_REQUIRED_MULTIPLE_MEAL_PLANS");
  }
}

/** Client may omit local day; use UTC “today” start for index bounds and overlap checks. */
function resolveLocalDayRefMs(localDayStartMs?: number): number {
  return localDayStartMs !== undefined
    ? localDayStartMs
    : startOfDayMs(Date.now());
}

/**
 * Start of the plan window for overlap math (UTC day starts). Matches how spans are
 * derived from stored `startDate`, else earliest entry date, else `endDate`.
 */
function effectivePlanStartMs(
  plan: Doc<"mealPlans">,
  entryMinDate: number | null,
): number {
  return plan.startDate ?? entryMinDate ?? plan.endDate;
}

type PlanWithEntryStats = {
  plan: Doc<"mealPlans">;
  entryCount: number;
  entryMinDate: number | null;
  entryMaxDate: number | null;
  isOwner: boolean;
};

/**
 * Whether the user's local calendar day [localDayStartMs, +1 day) overlaps the
 * plan window [planStart, planEndExclusive). Plan dates are UTC day starts;
 * localDayStartMs is the client's startOfLocalDayMs(now).
 */
function planOverlapsLocalCalendarDay(
  plan: Doc<"mealPlans">,
  entryMinDate: number | null,
  localDayStartMs: number,
): boolean {
  const planStart = effectivePlanStartMs(plan, entryMinDate);
  const planEndExclusive = plan.endDate + ONE_DAY_MS;
  const localEndExclusive = localDayStartMs + ONE_DAY_MS;
  return localDayStartMs < planEndExclusive && localEndExclusive > planStart;
}

/** Whether any part of the user's local "today" still falls inside the plan. */
function planStillActiveForLocalDay(
  plan: Doc<"mealPlans">,
  localDayStartMs: number,
  entryMinDate: number | null,
): boolean {
  const planStart = effectivePlanStartMs(plan, entryMinDate);
  const planEndExclusive = plan.endDate + ONE_DAY_MS;
  const localEndExclusive = localDayStartMs + ONE_DAY_MS;
  return localDayStartMs < planEndExclusive && localEndExclusive > planStart;
}

/**
 * Meal plans the user can see (index + dedupe) that are not superseded.
 * Overlap with “today” is applied after loading entry stats — see `planStillActiveForLocalDay`.
 */
async function collectCandidateMealPlansForUser(
  ctx: QueryCtx,
  userId: Id<"users">,
  localDayStartMs?: number,
): Promise<Doc<"mealPlans">[]> {
  const refLocalStart = resolveLocalDayRefMs(localDayStartMs);
  const indexGteEndDate = startOfDayMs(
    refLocalStart - (MAX_DAYS_IN_MEAL_PLAN + 3) * ONE_DAY_MS,
  );

  const ownedPlans = await ctx.db
    .query("mealPlans")
    .withIndex("by_user_and_endDate", (q) =>
      q.eq("userId", userId).gte("endDate", indexGteEndDate),
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
      .withIndex("by_household_and_endDate", (q) =>
        q.eq("householdId", householdId).gte("endDate", indexGteEndDate),
      )
      .order("desc")
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

function pickPreferredPlanDoc(
  summaries: PlanWithEntryStats[],
  localDayStartMs: number | undefined,
): Doc<"mealPlans"> | null {
  if (summaries.length === 0) return null;
  if (localDayStartMs !== undefined) {
    const finalisedCovering = summaries.filter(
      (s) =>
        s.plan.isFinalised === true &&
        planOverlapsLocalCalendarDay(s.plan, s.entryMinDate, localDayStartMs),
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

function buildLeftoverMatchPayload(
  ingredients: Doc<"recipes">["ingredients"],
  leftoverDocs: Doc<"ingredients">[],
  phraseList: string[],
): Array<
  | { kind: "canonical"; ingredientId: Id<"ingredients">; label: string }
  | { kind: "phrase"; label: string }
> {
  const rows: Array<
    | { kind: "canonical"; ingredientId: Id<"ingredients">; label: string }
    | { kind: "phrase"; label: string }
  > = [];
  if (leftoverDocs.length > 0) {
    const matchedIds = collectLeftoverMatchIds(
      ingredients,
      leftoverDocs.map((d) => d._id),
      leftoverDocs,
    );
    for (const id of matchedIds) {
      const doc = leftoverDocs.find((d) => d._id === id);
      const label = (
        doc?.displayName?.trim() ||
        doc?.name ||
        "Ingredient"
      ).trim();
      rows.push({ kind: "canonical", ingredientId: id, label });
    }
  }
  for (const ph of phraseList) {
    let hit = false;
    for (const line of ingredients ?? []) {
      if (lineMatchesLeftoverPhrase(line.name, ph)) {
        hit = true;
        break;
      }
    }
    if (hit) {
      rows.push({ kind: "phrase", label: phraseDisplayLabel(ph) });
    }
  }
  return rows;
}

async function buildEntriesWithRecipes(
  ctx: QueryCtx,
  mealPlanId: Id<"mealPlans">,
  leftoverIngredientIds?: Id<"ingredients">[],
  leftoverIngredientPhrases?: string[],
) {
  let leftoverDocs: Doc<"ingredients">[] = [];
  if (leftoverIngredientIds?.length) {
    const got = await Promise.all(
      leftoverIngredientIds.map((id) => ctx.db.get(id)),
    );
    leftoverDocs = got.filter((d): d is Doc<"ingredients"> => d != null);
  }
  const phraseList = normaliseLeftoverPhrasesList(leftoverIngredientPhrases);

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

      const leftoverMatches =
        (leftoverDocs.length > 0 || phraseList.length > 0) && recipe.ingredients
          ? buildLeftoverMatchPayload(
              recipe.ingredients,
              leftoverDocs,
              phraseList,
            )
          : undefined;

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
          ...(leftoverMatches && leftoverMatches.length > 0
            ? { leftoverMatches }
            : {}),
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

    const entries = await buildEntriesWithRecipes(
      ctx,
      args.mealPlanId,
      plan.leftoverIngredientIds,
      plan.leftoverIngredientPhrases,
    );

    return {
      ...plan,
      entries,
      isOwner: plan.userId === user._id,
    };
  },
});

/**
 * Get the user's "current" meal plan for dashboard / default UX: non-superseded
 * plans that still overlap the user's local calendar day. Prefers a finalised
 * plan whose span overlaps `localDayStartMs` (client: startOfLocalDayMs(now));
 * otherwise the most recently updated active plan.
 */
export const getCurrentMealPlan = query({
  args: {
    /** Start of "today" in the viewer's local timezone (ms). */
    localDayStartMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const refLocalStart = resolveLocalDayRefMs(args.localDayStartMs);
    const candidates = await collectCandidateMealPlansForUser(
      ctx,
      user._id,
      args.localDayStartMs,
    );
    if (candidates.length === 0) return null;

    const summaries = await loadPlanSummariesWithEntryStats(
      ctx,
      candidates,
      user._id,
    );
    const activeSummaries = summaries.filter((s) =>
      planStillActiveForLocalDay(s.plan, refLocalStart, s.entryMinDate),
    );
    if (activeSummaries.length === 0) return null;

    const current = pickPreferredPlanDoc(activeSummaries, args.localDayStartMs);
    if (!current) return null;

    const entries = await buildEntriesWithRecipes(
      ctx,
      current._id,
      current.leftoverIngredientIds,
      current.leftoverIngredientPhrases,
    );

    return {
      ...current,
      entries,
      isOwner: current.userId === user._id,
    };
  },
});

/**
 * Active meal plans (not superseded, overlap viewer's local day) for picker UI.
 */
export const getActiveMealPlanSummaries = query({
  args: {
    localDayStartMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const refLocalStart = resolveLocalDayRefMs(args.localDayStartMs);
    const candidates = await collectCandidateMealPlansForUser(
      ctx,
      user._id,
      args.localDayStartMs,
    );
    if (candidates.length === 0) return [];

    const summaries = await loadPlanSummariesWithEntryStats(
      ctx,
      candidates,
      user._id,
    );
    const activeSummaries = summaries.filter((s) =>
      planStillActiveForLocalDay(s.plan, refLocalStart, s.entryMinDate),
    );
    if (activeSummaries.length === 0) return [];

    activeSummaries.sort(
      (a, b) => (b.plan.updatedAt ?? 0) - (a.plan.updatedAt ?? 0),
    );

    return activeSummaries.map((s) => ({
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

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Generate a new weekly meal plan using the intelligent selection algorithm.
 * Spec 6.1, 6.2, 6.5: creates plan, selects MAX_DAYS_IN_MEAL_PLAN recipes (pool + constraints + behavioural scoring), inserts entries, increments suggestedCount for each.
 */
export const generateWeeklyPlan = mutation({
  args: {
    /** When omitted: shared if the user belongs to exactly one household; otherwise the new plan is private until they share or pass this field. */
    householdId: v.optional(v.id("households")),
    /** Optional: boost recipes that use these canonical ingredients (premium / beta). */
    leftoverIngredientIds: v.optional(v.array(v.id("ingredients"))),
    /** Optional: free-text leftovers (fuzzy-matched to recipe lines). */
    leftoverIngredientPhrases: v.optional(v.array(v.string())),
    startDate: v.optional(v.number()),
    dayCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const now = Date.now();
    const { startDate, endDate, dayCount } = resolveMealPlanWindow({
      startDate: args.startDate,
      dayCount: args.dayCount,
      subscriptionTier: user.subscriptionTier,
    });
    await assertCanCreateAnotherPlanForUser(
      ctx,
      user._id,
      user.subscriptionTier,
    );

    const shareHouseholdId = await resolveDefaultHouseholdIdForSharing(
      ctx,
      user._id,
      args.householdId,
    );

    const leftover = prepareLeftoverInputs(
      args.leftoverIngredientIds?.filter(Boolean) as
        | Id<"ingredients">[]
        | undefined,
      args.leftoverIngredientPhrases,
    );
    const wantsLeftovers = leftover.wantsLeftovers;
    if (wantsLeftovers && !canUseLeftoverIngredients(user.subscriptionTier)) {
      throw new ConvexError("PREMIUM_REQUIRED_LEFTOVER_INGREDIENTS");
    }

    const generationSeed = `gen-${now}-${Math.random().toString(36).slice(2, 11)}`;

    const actorType = "user";
    const actorId = user._id;

    const pool = await buildPool(ctx, user._id, shareHouseholdId ?? null, {
      leftoverTargetIds: wantsLeftovers ? leftover.ids : undefined,
      leftoverTargetPhrases: wantsLeftovers ? leftover.phrases : undefined,
    });
    const recentlySuggested = await getRecentlySuggested(
      ctx,
      actorType,
      actorId,
      RECENTLY_SUGGESTED_DAYS,
    );
    const actorStats = await getBehaviourStatsForActor(ctx, actorType, actorId);

    const selectedIds = selectRecipes(
      pool,
      dayCount,
      actorStats,
      generationSeed,
      recentlySuggested,
      [],
    );

    if (selectedIds.length === 0) {
      throw new ConvexError("No recipes available to generate meal plan");
    }

    let bestMatchInPool = 0;
    if (wantsLeftovers) {
      for (const p of pool) {
        bestMatchInPool = Math.max(bestMatchInPool, p.leftoverMatchCount ?? 0);
      }
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
      ...(wantsLeftovers && leftover.ids
        ? { leftoverIngredientIds: leftover.ids }
        : {}),
      ...(wantsLeftovers && leftover.phrases
        ? { leftoverIngredientPhrases: leftover.phrases }
        : {}),
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
    return {
      planId,
      ...(wantsLeftovers
        ? {
            leftoverMatchSummary: {
              targetCount: leftover.totalCount,
              bestMatchInPool,
              hasAnyMatch: bestMatchInPool > 0,
            },
          }
        : {}),
    };
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
    startDate: v.optional(v.number()),
    dayCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const now = Date.now();
    const { startDate, endDate } = resolveMealPlanWindow({
      startDate: args.startDate,
      dayCount: args.dayCount,
      subscriptionTier: user.subscriptionTier,
    });
    await assertCanCreateAnotherPlanForUser(
      ctx,
      user._id,
      user.subscriptionTier,
    );

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
  args: {
    previousPlanId: v.id("mealPlans"),
    leftoverIngredientIds: v.optional(v.array(v.id("ingredients"))),
    leftoverIngredientPhrases: v.optional(v.array(v.string())),
  },
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

    const leftover = prepareLeftoverInputs(
      args.leftoverIngredientIds?.filter(Boolean) as
        | Id<"ingredients">[]
        | undefined,
      args.leftoverIngredientPhrases,
    );
    const wantsLeftovers = leftover.wantsLeftovers;
    if (wantsLeftovers && !canUseLeftoverIngredients(user.subscriptionTier)) {
      throw new ConvexError("PREMIUM_REQUIRED_LEFTOVER_INGREDIENTS");
    }

    let leftoverDocs: Doc<"ingredients">[] = [];
    if (wantsLeftovers && leftover.ids?.length) {
      const got = await Promise.all(leftover.ids.map((id) => ctx.db.get(id)));
      leftoverDocs = got.filter((d): d is Doc<"ingredients"> => d != null);
    }
    const normalisedPhraseTargets = normaliseLeftoverPhrasesList(
      leftover.phrases,
    );

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
      ...(wantsLeftovers && leftover.ids
        ? { leftoverIngredientIds: leftover.ids }
        : {}),
      ...(wantsLeftovers && leftover.phrases
        ? { leftoverIngredientPhrases: leftover.phrases }
        : {}),
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
    let bestMatchInPool = 0;
    if (toSelect > 0) {
      const pool = await buildPool(
        ctx,
        previousPlan.userId,
        previousPlan.householdId ?? null,
        {
          leftoverTargetIds: wantsLeftovers ? leftover.ids : undefined,
          leftoverTargetPhrases: wantsLeftovers ? leftover.phrases : undefined,
        },
      );
      if (wantsLeftovers) {
        for (const p of pool) {
          bestMatchInPool = Math.max(
            bestMatchInPool,
            p.leftoverMatchCount ?? 0,
          );
        }
      }
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
        if (!recipe) continue;
        const base: PoolRecipe = {
          _id: recipe._id,
          primaryProtein: recipe.primaryProtein,
          complexityTier: recipe.complexityTier,
          cuisine: recipe.cuisine,
          editorialBias: recipe.editorialBias,
          isSystem: recipe.source === "system",
        };
        if (leftoverDocs.length > 0 || normalisedPhraseTargets.length > 0) {
          const leftoverMatchKeys = collectLeftoverMatchKeys(
            recipe.ingredients,
            leftoverDocs.map((d) => d._id),
            leftoverDocs,
            normalisedPhraseTargets,
          );
          lockedPoolRecipes.push({
            ...base,
            leftoverTargetCount:
              leftoverDocs.length + normalisedPhraseTargets.length,
            leftoverMatchCount: leftoverMatchKeys.length,
            leftoverMatchKeys,
          });
        } else {
          lockedPoolRecipes.push(base);
        }
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
    return {
      planId: newPlanId,
      ...(wantsLeftovers
        ? {
            leftoverMatchSummary: {
              targetCount: leftover.totalCount,
              bestMatchInPool,
              hasAnyMatch: bestMatchInPool > 0,
            },
          }
        : {}),
    };
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
