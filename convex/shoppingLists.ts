import { ConvexError, v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import {
  internalMutation,
  mutation,
  query,
  QueryCtx,
} from "./_generated/server";
import { isHouseholdMember } from "./households";
import { canAccessMealPlan } from "./mealPlans";
import { normaliseNameForGrouping } from "./lib/ingredientGrouping";
import { combineAmounts } from "./lib/unitConversion";
import {
  getCurrentUser,
  getCurrentUserOrThrow,
  getUserSubscription,
} from "./users";

// ============================================================================
// ACCESS HELPER
// ============================================================================

/**
 * User can access a shopping list if they own it or have access to its linked meal plan.
 */
export async function canAccessShoppingList(
  ctx: QueryCtx,
  userId: Id<"users">,
  list: Doc<"shoppingLists">
): Promise<boolean> {
  if (list.userId === userId) return true;
  if (list.mealPlanId) {
    const plan = await ctx.db.get(list.mealPlanId);
    if (!plan) return false;
    return await canAccessMealPlan(ctx, userId, plan);
  }
  return false;
}

/**
 * User can modify or perform destructive actions on a shopping list only if they own it.
 * Use this for delete, finalise, complete, and unfinalise; use canAccessShoppingList for view/edit items.
 */
function canModifyShoppingList(
  userId: Id<"users">,
  list: Doc<"shoppingLists">
): boolean {
  return list.userId === userId;
}

// ============================================================================
// HELPERS (ingredient aggregation for meal plan → shopping list)
// ============================================================================

type RecipeIngredient = Doc<"recipes">["ingredients"] extends (infer I)[] | undefined
  ? I
  : never;

function getAggregationKey(ing: RecipeIngredient): string {
  if (ing?.ingredientId) {
    return ing.ingredientId;
  }
  return normaliseNameForGrouping(ing?.name ?? "") || "unnamed";
}

function aggregateIngredientsFromRecipes(
  recipes: {
    _id: Id<"recipes">;
    ingredients?: Doc<"recipes">["ingredients"];
  }[]
): {
  name: string;
  amount: number | string | null;
  unit?: string;
  preparation?: string;
  ingredientId?: Id<"ingredients">;
  amountEntries: Array<{ amount: number | string | null; unit?: string }>;
  recipeIds: Id<"recipes">[];
}[] {
  const combined = new Map<
    string,
    {
      name: string;
      unit?: string;
      preparation?: string;
      amount: number | string | null;
      ingredientId?: Id<"ingredients">;
      amountEntries: Array<{ amount: number | string | null; unit?: string }>;
      recipeIds: Set<Id<"recipes">>;
    }
  >();

  for (const recipe of recipes) {
    const ingredients = recipe.ingredients ?? [];
    for (const ingredient of ingredients) {
      if (!ingredient?.name) continue;
      const key = getAggregationKey(ingredient);
      const rawAmount = ingredient.amount;
      let amountValue: number | null = null;
      let storedAmount: number | string | null = null;
      if (rawAmount === undefined || rawAmount === null) {
        storedAmount = null;
      } else if (typeof rawAmount === "number") {
        amountValue = Number.isFinite(rawAmount) ? rawAmount : null;
        storedAmount = amountValue;
      } else {
        const trimmedAmount = String(rawAmount).trim();
        if (trimmedAmount === "") {
          storedAmount = null;
        } else {
          amountValue = Number(trimmedAmount);
          storedAmount = Number.isFinite(amountValue) ? amountValue : trimmedAmount;
        }
      }

      const entry = { amount: storedAmount, unit: ingredient.unit };
      const existing = combined.get(key);
      if (!existing) {
        const recipeIds = new Set<Id<"recipes">>([recipe._id]);
        combined.set(key, {
          name: ingredient.name,
          unit: ingredient.unit,
          preparation: ingredient.preparation,
          amount: storedAmount,
          ingredientId: ingredient.ingredientId,
          amountEntries: [entry],
          recipeIds,
        });
        continue;
      }
      existing.recipeIds.add(recipe._id);
      existing.amountEntries.push(entry);
      const entries = existing.amountEntries;
      const aggregated = entries.slice(1).reduce<{
        amount: number | string | null;
        unit?: string;
      }>(
        (acc, e) => combineAmounts(acc.amount, acc.unit, e.amount, e.unit),
        { amount: entries[0]!.amount, unit: entries[0]!.unit }
      );
      existing.amount = aggregated.amount ?? null;
      existing.unit = aggregated.unit;
    }
  }

  return Array.from(combined.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item) => ({
      name: item.name,
      amount: item.amount,
      unit: item.unit,
      preparation: item.preparation,
      ingredientId: item.ingredientId,
      amountEntries: item.amountEntries,
      recipeIds: Array.from(item.recipeIds),
    }));
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Return meal plan IDs the user can access (owned or shared with their households).
 * Used to fetch only those lists via by_meal_plan index instead of scanning all lists.
 */
async function getAccessibleMealPlanIds(
  ctx: QueryCtx,
  userId: Id<"users">
): Promise<Id<"mealPlans">[]> {
  const owned = await ctx.db
    .query("mealPlans")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  const memberships = await ctx.db
    .query("householdMembers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  const seen = new Set(owned.map((p) => p._id));
  const ids: Id<"mealPlans">[] = [...owned.map((p) => p._id)];
  for (const m of memberships) {
    const shared = await ctx.db
      .query("mealPlans")
      .withIndex("by_household", (q) => q.eq("householdId", m.householdId))
      .collect();
    for (const p of shared) {
      if (!seen.has(p._id)) {
        seen.add(p._id);
        ids.push(p._id);
      }
    }
  }
  return ids;
}

/**
 * Get all draft/active shopping lists the current user can access (owned or via linked meal plan), ordered by recency.
 */
export const getAccessibleShoppingLists = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    // Own lists (draft or active)
    const ownLists = await ctx.db
      .query("shoppingLists")
      .withIndex("by_user_and_status", (q) => q.eq("userId", user._id))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "draft"),
          q.eq(q.field("status"), "active")
        )
      )
      .collect();

    // Lists linked to meal plans the user can access (bounded by accessible plans, not all lists)
    const accessiblePlanIds = await getAccessibleMealPlanIds(ctx, user._id);
    const linkedLists: Doc<"shoppingLists">[] = [];
    const seen = new Set(ownLists.map((l) => l._id));
    for (const planId of accessiblePlanIds) {
      const lists = await ctx.db
        .query("shoppingLists")
        .withIndex("by_meal_plan", (q) => q.eq("mealPlanId", planId))
        .collect();
      for (const list of lists) {
        if (seen.has(list._id)) continue;
        if (list.status !== "draft" && list.status !== "active") continue;
        seen.add(list._id);
        linkedLists.push(list);
      }
    }

    const accessible = [...ownLists, ...linkedLists];
    accessible.sort((a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0));
    return accessible;
  },
});

/**
 * Get a single shopping list by ID with items. Returns null if not found or no access.
 */
export const getShoppingListById = query({
  args: { listId: v.id("shoppingLists") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const list = await ctx.db.get(args.listId);
    if (!list) return null;

    const allowed = await canAccessShoppingList(ctx, user._id, list);
    if (!allowed) return null;

    const items = await ctx.db
      .query("shoppingListItems")
      .withIndex("by_shopping_list", (q) => q.eq("shoppingListId", args.listId))
      .collect();

    const sortedItems = items.sort((a, b) => a.order - b.order);
    return { ...list, items: sortedItems };
  },
});

/**
 * Get draft/active shopping lists linked to a meal plan that the current user can access.
 */
export const getShoppingListsByMealPlan = query({
  args: { mealPlanId: v.id("mealPlans") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const plan = await ctx.db.get(args.mealPlanId);
    if (!plan) return [];
    const allowed = await canAccessMealPlan(ctx, user._id, plan);
    if (!allowed) return [];

    const lists = await ctx.db
      .query("shoppingLists")
      .withIndex("by_meal_plan", (q) => q.eq("mealPlanId", args.mealPlanId))
      .collect();

    return lists.filter((l) => l.status === "draft" || l.status === "active");
  },
});

/**
 * Get the user's default active/draft shopping list (most recent accessible one).
 */
export const getActiveShoppingList = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const ownLists = await ctx.db
      .query("shoppingLists")
      .withIndex("by_user_and_status", (q) => q.eq("userId", user._id))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "draft"),
          q.eq(q.field("status"), "active")
        )
      )
      .collect();

    const accessiblePlanIds = await getAccessibleMealPlanIds(ctx, user._id);
    const seen = new Set(ownLists.map((l) => l._id));
    const linkedLists: Doc<"shoppingLists">[] = [];
    for (const planId of accessiblePlanIds) {
      const lists = await ctx.db
        .query("shoppingLists")
        .withIndex("by_meal_plan", (q) => q.eq("mealPlanId", planId))
        .collect();
      for (const list of lists) {
        if (seen.has(list._id)) continue;
        if (list.status !== "draft" && list.status !== "active") continue;
        seen.add(list._id);
        linkedLists.push(list);
      }
    }

    const accessible = [...ownLists, ...linkedLists];
    accessible.sort((a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0));
    const first = accessible[0];
    if (!first) return null;

    const items = await ctx.db
      .query("shoppingListItems")
      .withIndex("by_shopping_list", (q) => q.eq("shoppingListId", first._id))
      .collect();

    return {
      ...first,
      items: items.sort((a, b) => a.order - b.order),
    };
  },
});

/**
 * Get all active shopping lists for the current user (for limit checking)
 */
export const getAllActiveShoppingLists = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const activeLists = await ctx.db
      .query("shoppingLists")
      .withIndex("by_user_and_status", (q) =>
        q.eq("userId", user._id).eq("status", "active")
      )
      .collect();

    return activeLists;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new shopping list in draft mode
 */
const amountEntryValidator = v.object({
  amount: v.union(v.number(), v.string(), v.null()),
  unit: v.optional(v.string()),
});

export const createShoppingList = mutation({
  args: {
    items: v.array(
      v.object({
        name: v.string(),
        amount: v.union(v.number(), v.string(), v.null()),
        unit: v.optional(v.string()),
        preparation: v.optional(v.string()),
        ingredientId: v.optional(v.id("ingredients")),
        amountEntries: v.optional(v.array(amountEntryValidator)),
        recipeIds: v.optional(v.array(v.id("recipes"))),
      })
    ),
    chalkboardItemIds: v.array(v.id("chalkboardItems")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const subscription = await getUserSubscription(user, ctx);

    const activeLists = await ctx.db
      .query("shoppingLists")
      .withIndex("by_user_and_status", (q) =>
        q.eq("userId", user._id).eq("status", "active")
      )
      .collect();

    if (
      subscription.maxActiveShoppingLists !== -1 &&
      activeLists.length >= subscription.maxActiveShoppingLists
    ) {
      throw new ConvexError(
        `You've reached the limit of ${subscription.maxActiveShoppingLists} active shopping lists. Complete or delete an existing list to create a new one.`
      );
    }

    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    // Create the shopping list
    const listId = await ctx.db.insert("shoppingLists", {
      userId: user._id,
      status: "draft",
      expiresAt: now + oneWeek,
      chalkboardItemIds: args.chalkboardItemIds,
    });

    // Create all items
    await Promise.all(
      args.items.map((item, i) => {
        const entries = item.amountEntries ?? [
          { amount: item.amount, unit: item.unit },
        ];
        const first = entries[0];
        return ctx.db.insert("shoppingListItems", {
          shoppingListId: listId,
          name: item.name,
          amount: first?.amount ?? item.amount,
          unit: first?.unit ?? item.unit,
          preparation: item.preparation,
          checked: false,
          order: i,
          ingredientId: item.ingredientId,
          amountEntries: entries,
          ...(item.recipeIds != null && item.recipeIds.length > 0 && { recipeIds: item.recipeIds }),
        });
      })
    );

    return { listId };
  },
});

/**
 * Create a shopping list from a meal plan. User must have access to the plan (owner or shared household).
 */
export const createShoppingListFromMealPlan = mutation({
  args: {
    mealPlanId: v.id("mealPlans"),
    chalkboardItemIds: v.array(v.id("chalkboardItems")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const plan = await ctx.db.get(args.mealPlanId);
    if (!plan) throw new ConvexError("Meal plan not found");
    const allowed = await canAccessMealPlan(ctx, user._id, plan);
    if (!allowed) {
      throw new ConvexError("You do not have access to this meal plan");
    }

    const entries = await ctx.db
      .query("mealPlanEntries")
      .withIndex("by_meal_plan", (q) => q.eq("mealPlanId", args.mealPlanId))
      .collect();

    const recipeIds = [...new Set(entries.map((e) => e.recipeId))];
    const recipes = await Promise.all(recipeIds.map((id) => ctx.db.get(id)));
    const validRecipes = recipes.filter(
      (r): r is NonNullable<typeof r> => r != null
    );
    const items = aggregateIngredientsFromRecipes(validRecipes);

    const subscription = await getUserSubscription(user, ctx);
    const activeLists = await ctx.db
      .query("shoppingLists")
      .withIndex("by_user_and_status", (q) =>
        q.eq("userId", user._id).eq("status", "active")
      )
      .collect();
    if (
      subscription.maxActiveShoppingLists !== -1 &&
      activeLists.length >= subscription.maxActiveShoppingLists
    ) {
      throw new ConvexError(
        `You've reached the limit of ${subscription.maxActiveShoppingLists} active shopping lists. Complete or delete an existing list to create a new one.`
      );
    }

    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const listId = await ctx.db.insert("shoppingLists", {
      userId: user._id,
      status: "draft",
      expiresAt: now + oneWeek,
      chalkboardItemIds: args.chalkboardItemIds,
      mealPlanId: args.mealPlanId,
    });

    await Promise.all(
      items.map((item, i) => {
        const entries = item.amountEntries ?? [
          { amount: item.amount, unit: item.unit },
        ];
        const first = entries[0];
        return ctx.db.insert("shoppingListItems", {
          shoppingListId: listId,
          name: item.name,
          amount: first?.amount ?? item.amount,
          unit: first?.unit ?? item.unit,
          preparation: item.preparation,
          checked: false,
          order: i,
          ingredientId: item.ingredientId,
          amountEntries: entries,
          recipeIds: item.recipeIds,
        });
      })
    );

    return { listId };
  },
});

/**
 * Update items in a draft shopping list
 */
export const updateItems = mutation({
  args: {
    listId: v.id("shoppingLists"),
    items: v.array(
      v.object({
        id: v.optional(v.id("shoppingListItems")), // Existing item ID
        name: v.string(),
        amount: v.union(v.number(), v.string(), v.null()),
        unit: v.optional(v.string()),
        preparation: v.optional(v.string()),
        ingredientId: v.optional(v.id("ingredients")),
        amountEntries: v.optional(
          v.array(
            v.object({
              amount: v.union(v.number(), v.string(), v.null()),
              unit: v.optional(v.string()),
            })
          )
        ),
        recipeIds: v.optional(v.array(v.id("recipes"))),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const list = await ctx.db.get(args.listId);
    if (!list) {
      throw new ConvexError("Shopping list not found");
    }

    const allowed = await canAccessShoppingList(ctx, user._id, list);
    if (!allowed) {
      throw new ConvexError("You do not have access to this shopping list");
    }

    if (list.status !== "draft") {
      throw new ConvexError("Can only update items in draft mode");
    }

    // Get existing items
    const existingItems = await ctx.db
      .query("shoppingListItems")
      .withIndex("by_shopping_list", (q) => q.eq("shoppingListId", args.listId))
      .collect();

    const existingIds = new Set(existingItems.map((item) => item._id));
    const updatedIds = new Set(
      args.items.map((item) => item.id).filter((id) => id !== undefined)
    );

    // Delete items that are no longer in the list
    for (const item of existingItems) {
      if (!updatedIds.has(item._id)) {
        await ctx.db.delete(item._id);
      }
    }

    // Update or create items
    await Promise.all(
      args.items.map((item, i) => {
        const amountEntries =
          item.amountEntries ?? (item.amount != null || item.unit
            ? [{ amount: item.amount, unit: item.unit }]
            : undefined);
        if (item.id && existingIds.has(item.id)) {
          // Update existing item
          return ctx.db.patch(item.id, {
            name: item.name,
            amount: item.amount,
            unit: item.unit,
            preparation: item.preparation,
            order: i,
            ingredientId: item.ingredientId,
            ...(amountEntries !== undefined && { amountEntries }),
            ...(item.recipeIds !== undefined && { recipeIds: item.recipeIds }),
          });
        } else {
          // Create new item
          return ctx.db.insert("shoppingListItems", {
            shoppingListId: args.listId,
            name: item.name,
            amount: item.amount,
            unit: item.unit,
            preparation: item.preparation,
            checked: false,
            order: i,
            ingredientId: item.ingredientId,
            ...(amountEntries !== undefined && { amountEntries }),
            ...(item.recipeIds != null &&
              item.recipeIds.length > 0 && { recipeIds: item.recipeIds }),
          });
        }
      })
    );

    return { success: true };
  },
});

/**
 * Toggle an item's checked status
 */
export const toggleItemChecked = mutation({
  args: {
    itemId: v.id("shoppingListItems"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new ConvexError("Item not found");
    }

    const list = await ctx.db.get(item.shoppingListId);
    if (!list) {
      throw new ConvexError("Shopping list not found");
    }

    const allowed = await canAccessShoppingList(ctx, user._id, list);
    if (!allowed) {
      throw new ConvexError("You do not have access to this shopping list");
    }

    await ctx.db.patch(args.itemId, {
      checked: !item.checked,
    });

    return { checked: !item.checked };
  },
});

/**
 * Update a single item's amount
 */
export const updateItemAmount = mutation({
  args: {
    itemId: v.id("shoppingListItems"),
    amount: v.union(v.number(), v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new ConvexError("Item not found");
    }

    const list = await ctx.db.get(item.shoppingListId);
    if (!list) {
      throw new ConvexError("Shopping list not found");
    }

    const allowed = await canAccessShoppingList(ctx, user._id, list);
    if (!allowed) {
      throw new ConvexError("You do not have access to this shopping list");
    }

    if (list.status !== "draft") {
      throw new ConvexError("Can only update items in draft mode");
    }

    const updates: { amount: number | string | null; amountEntries?: { amount: number | string | null; unit?: string }[] } = { amount: args.amount };
    if (item.amountEntries && item.amountEntries.length > 0) {
      updates.amountEntries = [
        { ...item.amountEntries[0]!, amount: args.amount },
        ...item.amountEntries.slice(1),
      ];
    } else {
      updates.amountEntries = [{ amount: args.amount, unit: item.unit }];
    }
    await ctx.db.patch(args.itemId, updates);

    return { success: true };
  },
});

/**
 * Remove an item from the shopping list
 */
export const removeItem = mutation({
  args: {
    itemId: v.id("shoppingListItems"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new ConvexError("Item not found");
    }

    const list = await ctx.db.get(item.shoppingListId);
    if (!list) {
      throw new ConvexError("Shopping list not found");
    }

    const allowed = await canAccessShoppingList(ctx, user._id, list);
    if (!allowed) {
      throw new ConvexError("You do not have access to this shopping list");
    }

    if (list.status !== "draft") {
      throw new ConvexError("Can only remove items in draft mode");
    }

    await ctx.db.delete(args.itemId);

    return { success: true };
  },
});

/**
 * Add items from chalkboard to existing shopping list
 */
export const addChalkboardItems = mutation({
  args: {
    listId: v.id("shoppingLists"),
    items: v.array(
      v.object({
        chalkboardItemId: v.id("chalkboardItems"),
        name: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const list = await ctx.db.get(args.listId);
    if (!list) {
      throw new ConvexError("Shopping list not found");
    }

    const allowed = await canAccessShoppingList(ctx, user._id, list);
    if (!allowed) {
      throw new ConvexError("You do not have access to this shopping list");
    }

    if (list.status !== "draft") {
      throw new ConvexError("Can only add items in draft mode");
    }

    // Get current max order
    const existingItems = await ctx.db
      .query("shoppingListItems")
      .withIndex("by_shopping_list", (q) => q.eq("shoppingListId", args.listId))
      .collect();

    let maxOrder = existingItems.reduce(
      (max, item) => Math.max(max, item.order),
      -1
    );

    // Add new items
    await Promise.all(
      args.items.map((item) => {
        maxOrder++;
        return ctx.db.insert("shoppingListItems", {
          shoppingListId: args.listId,
          name: item.name,
          amount: null,
          checked: false,
          order: maxOrder,
        });
      })
    );

    // Update chalkboard item IDs
    await ctx.db.patch(args.listId, {
      chalkboardItemIds: [
        ...list.chalkboardItemIds,
        ...args.items.map((item) => item.chalkboardItemId),
      ],
    });

    return { success: true };
  },
});

/**
 * Complete a shopping list
 */
export const completeShoppingList = mutation({
  args: {
    listId: v.id("shoppingLists"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const list = await ctx.db.get(args.listId);
    if (!list) {
      throw new ConvexError("Shopping list not found");
    }

    if (!canModifyShoppingList(user._id, list)) {
      throw new ConvexError(
        "Only the list owner can complete this shopping list"
      );
    }

    if (list.status !== "active") {
      throw new ConvexError("Can only complete active shopping lists");
    }

    // Mark list as completed
    await ctx.db.patch(args.listId, {
      status: "completed",
      completedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete a shopping list
 */
export const deleteShoppingList = mutation({
  args: {
    listId: v.id("shoppingLists"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const list = await ctx.db.get(args.listId);
    if (!list) {
      throw new ConvexError("Shopping list not found");
    }

    if (!canModifyShoppingList(user._id, list)) {
      throw new ConvexError(
        "Only the list owner can delete this shopping list"
      );
    }

    // Delete all items
    const items = await ctx.db
      .query("shoppingListItems")
      .withIndex("by_shopping_list", (q) => q.eq("shoppingListId", args.listId))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    // Delete the list
    await ctx.db.delete(args.listId);

    return { success: true };
  },
});

/**
 * Unfinalise a shopping list (go back to draft mode)
 */
export const unfinaliseShoppingList = mutation({
  args: {
    listId: v.id("shoppingLists"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const list = await ctx.db.get(args.listId);
    if (!list) {
      throw new ConvexError("Shopping list not found");
    }

    if (!canModifyShoppingList(user._id, list)) {
      throw new ConvexError(
        "Only the list owner can un-finalise this shopping list"
      );
    }

    if (list.status !== "active") {
      throw new ConvexError("Can only un-finalise active shopping lists");
    }

    // Mark list as draft
    await ctx.db.patch(args.listId, {
      status: "draft",
      finalisedAt: undefined,
    });

    return { success: true };
  },
});

/**
 * Finalize a draft shopping list, checking the active list limit (creator's limit)
 */
export const finaliseShoppingList = mutation({
  args: {
    listId: v.id("shoppingLists"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const list = await ctx.db.get(args.listId);
    if (!list) {
      throw new ConvexError("Shopping list not found");
    }

    if (!canModifyShoppingList(user._id, list)) {
      throw new ConvexError(
        "Only the list owner can finalize this shopping list"
      );
    }

    if (list.status !== "draft") {
      throw new ConvexError("Shopping list is already finalized");
    }

    // Check active list limit for the list creator (subscription is per creator)
    const creator = await ctx.db.get(list.userId);
    const subscription = creator
      ? await getUserSubscription(creator, ctx)
      : { maxActiveShoppingLists: -1 };
    const activeLists = await ctx.db
      .query("shoppingLists")
      .withIndex("by_user_and_status", (q) =>
        q.eq("userId", list.userId).eq("status", "active")
      )
      .collect();

    if (
      subscription.maxActiveShoppingLists !== -1 &&
      activeLists.length >= subscription.maxActiveShoppingLists
    ) {
      throw new ConvexError(
        `The list owner has reached their limit of ${subscription.maxActiveShoppingLists} active shopping lists. Complete an existing list before finalizing this one.`
      );
    }

    const now = Date.now();

    // Mark list as active
    await ctx.db.patch(args.listId, {
      status: "active",
      finalisedAt: now,
    });

    // Delete chalkboard items
    for (const chalkboardItemId of list.chalkboardItemIds) {
      try {
        const item = await ctx.db.get(chalkboardItemId);
        if (!item) continue;

        const canDelete =
          item.householdId === undefined
            ? item.addedBy === user._id
            : await isHouseholdMember(ctx, user._id, item.householdId);
        if (!canDelete) continue;

        await ctx.db.delete(chalkboardItemId);
      } catch (error) {
        // Item might have been deleted already, continue
        console.error("Failed to delete chalkboard item:", error);
      }
    }

    return { success: true };
  },
});

// ============================================================================
// INTERNAL MUTATIONS
// ============================================================================

/**
 * Clean up expired shopping lists
 */
export const cleanupExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Find all expired lists
    const expiredLists = await ctx.db
      .query("shoppingLists")
      .withIndex("by_expires")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();

    let deletedCount = 0;

    for (const list of expiredLists) {
      // Delete all items
      const items = await ctx.db
        .query("shoppingListItems")
        .withIndex("by_shopping_list", (q) => q.eq("shoppingListId", list._id))
        .collect();

      for (const item of items) {
        await ctx.db.delete(item._id);
      }

      // Delete the list
      await ctx.db.delete(list._id);
      deletedCount++;
    }

    return { deletedCount };
  },
});
