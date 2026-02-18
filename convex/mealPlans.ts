import { ConvexError, v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { mutation, query, QueryCtx } from "./_generated/server";
import { canAccessRecipe, isHouseholdMember } from "./households";
import { getCurrentUser, getCurrentUserOrThrow } from "./users";

// ============================================================================
// HELPERS
// ============================================================================

function startOfDayMs(ms: number): number {
  const d = new Date(ms);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

export async function canAccessMealPlan(
  ctx: QueryCtx,
  userId: Id<"users">,
  plan: { userId: Id<"users">; householdId?: Id<"households"> }
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
  plan: { userId: Id<"users"> }
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

    const entries = await ctx.db
      .query("mealPlanEntries")
      .withIndex("by_meal_plan", (q) => q.eq("mealPlanId", args.mealPlanId))
      .collect();

    const entriesWithRecipes = await Promise.all(
      entries.map(async (entry) => {
        const recipe = await ctx.db.get(entry.recipeId);
        if (!recipe) return { ...entry, recipe: null };
        const image = recipe.image
          ? await ctx.storage.getUrl(recipe.image)
          : null;
        return {
          ...entry,
          recipe: {
            _id: recipe._id,
            title: recipe.title,
            image,
            ingredients: recipe.ingredients,
          },
        };
      })
    );

    return {
      ...plan,
      entries: entriesWithRecipes.sort(
        (a, b) => a.date - b.date || (a.order ?? 0) - (b.order ?? 0)
      ),
      isOwner: plan.userId === user._id,
    };
  },
});

/**
 * Get the user's "current" meal plan: one where endDate >= today, most recent, that user owns or that is shared with a household they're in.
 */
export const getCurrentMealPlan = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const today = startOfDayMs(Date.now());

    // Plans owned by user with endDate >= today
    const ownedPlans = await ctx.db
      .query("mealPlans")
      .withIndex("by_user_and_endDate", (q) =>
        q.eq("userId", user._id).gte("endDate", today)
      )
      .order("desc")
      .collect();

    // Plans shared with user's households
    const memberships = await ctx.db
      .query("householdMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
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

    // Combine and sort by endDate desc, take most recent
    const seenIds = new Set<Id<"mealPlans">>();
    const allPlans = [...ownedPlans, ...sharedPlans].filter((p) => {
      if (seenIds.has(p._id)) return false;
      seenIds.add(p._id);
      return true;
    });
    allPlans.sort((a, b) => b.endDate - a.endDate);
    const current = allPlans[0] ?? null;
    if (!current) return null;

    const entries = await ctx.db
      .query("mealPlanEntries")
      .withIndex("by_meal_plan", (q) => q.eq("mealPlanId", current._id))
      .collect();

    const entriesWithRecipes = await Promise.all(
      entries.map(async (entry) => {
        const recipe = await ctx.db.get(entry.recipeId);
        if (!recipe) return { ...entry, recipe: null };
        const image = recipe.image
          ? await ctx.storage.getUrl(recipe.image)
          : null;
        return {
          ...entry,
          recipe: {
            _id: recipe._id,
            title: recipe.title,
            image,
            ingredients: recipe.ingredients,
          },
        };
      })
    );

    return {
      ...current,
      entries: entriesWithRecipes.sort(
        (a, b) => a.date - b.date || (a.order ?? 0) - (b.order ?? 0)
      ),
      isOwner: current.userId === user._id,
    };
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
          q.eq("householdId", m.householdId)
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

/**
 * Create a new meal plan. endDate defaults to 7 days from today if not provided.
 */
export const createMealPlan = mutation({
  args: {
    endDate: v.optional(v.number()),
    startDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const now = Date.now();
    const today = startOfDayMs(now);
    const defaultEnd = startOfDayMs(now + 7 * 24 * 60 * 60 * 1000);
    const endDate = args.endDate ?? defaultEnd;
    if (endDate < today) {
      throw new ConvexError("End date must be today or in the future");
    }
    const startDate = args.startDate;
    if (startDate !== undefined && startDate > endDate) {
      throw new ConvexError("Start date must be on or before the plan end date");
    }

    const planId = await ctx.db.insert("mealPlans", {
      userId: user._id,
      endDate,
      startDate: args.startDate,
      updatedAt: now,
      isGenerated: false,
    });
    return { planId };
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
    if (
      plan.startDate !== undefined &&
      normalizedEnd < plan.startDate
    ) {
      throw new ConvexError(
        "End date must be on or after the plan start date"
      );
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
 * Stop sharing meal plan with household. Owner only.
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
    const dateStart = startOfDayMs(args.date);
    if (
      plan.startDate !== undefined &&
      dateStart < plan.startDate
    ) {
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
    const updates: {
      date?: number;
      recipeId?: Id<"recipes">;
      mealLabel?: string;
      order?: number;
    } = {};
    if (args.date !== undefined) {
      const dateStart = startOfDayMs(args.date);
      if (
        plan.startDate !== undefined &&
        dateStart < plan.startDate
      ) {
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
      updates.recipeId = args.recipeId;
    }
    if (args.mealLabel !== undefined) updates.mealLabel = args.mealLabel;
    if (args.order !== undefined) updates.order = args.order;
    await ctx.db.patch(args.entryId, updates);
    await ctx.db.patch(entry.mealPlanId, { updatedAt: Date.now() });
    return { success: true };
  },
});

/**
 * Remove an entry. Owner only.
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
