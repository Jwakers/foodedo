import { ConvexError, v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import {
  internalMutation,
  mutation,
  MutationCtx,
  query,
  QueryCtx,
} from "./_generated/server";
import {
  isHouseholdMember,
  resolveDefaultHouseholdIdForSharing,
} from "./households";
import { canAccessMealPlan } from "./mealPlans";
import { normaliseNameForGrouping } from "./lib/ingredientGrouping";
import { scaleAmountForServings, scaleNumericAmountForServings } from "./lib/servings";
import { combineAmounts } from "./lib/unitConversion";
import {
  getCurrentUser,
  getCurrentUserOrThrow,
  getUserSubscription,
} from "./users";
import {
  canUseServingControl,
  clampTargetServings,
} from "./lib/constants";

// ============================================================================
// ACCESS HELPER
// ============================================================================

// QA / migration: older lists may lack householdId; household visibility for
// recipe-created lists applies to new rows. Optional backfill: copy mealPlans.householdId
// onto shoppingLists where mealPlanId is set and householdId is unset.
//
// Meal-plan lists (`mealPlanId`): users who pass canAccessShoppingList may also finalize,
// complete, delete, and unfinalise (see canModifyShoppingList), not only the document owner.

/**
 * User can access a shopping list if they own it, are in the list household (when shared),
 * or have access to its linked meal plan. `isPrivate` limits visibility to the owner only.
 * For lists with `mealPlanId`, this is the same access bar used for full lifecycle actions.
 */
export async function canAccessShoppingList(
  ctx: QueryCtx,
  userId: Id<"users">,
  list: Doc<"shoppingLists">
): Promise<boolean> {
  if (list.userId === userId) return true;
  if (list.isPrivate === true) return false;
  if (list.householdId) {
    const inHousehold = await isHouseholdMember(ctx, userId, list.householdId);
    if (inHousehold) return true;
  }
  if (list.mealPlanId) {
    const plan = await ctx.db.get(list.mealPlanId);
    if (!plan) return false;
    return await canAccessMealPlan(ctx, userId, plan);
  }
  return false;
}

/**
 * Full management (finalize, complete, delete, unfinalise) for lists without a meal plan: owner only.
 * Lists created from a meal plan (`mealPlanId`) also allow any user who passes `canAccessShoppingList`
 * (same bar as viewing/editing lines). Item-level mutations still use `canAccessShoppingList` directly.
 */
async function canModifyShoppingList(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  list: Doc<"shoppingLists">,
): Promise<boolean> {
  if (list.userId === userId) return true;
  if (list.mealPlanId !== undefined) {
    return await canAccessShoppingList(ctx, userId, list);
  }
  return false;
}

function manageDeniedMessage(
  list: Doc<"shoppingLists">,
  userId: Id<"users">,
  ownerOnlyMessage: string,
): string {
  if (list.mealPlanId !== undefined && list.userId !== userId) {
    return "You do not have access to this shopping list";
  }
  return ownerOnlyMessage;
}

/** Chalkboard rows the user may attach to a list (personal owner or household member). Preserves order, dedupes IDs. */
async function resolveAccessibleChalkboardItems(
  ctx: MutationCtx,
  userId: Id<"users">,
  chalkboardItemIds: Id<"chalkboardItems">[],
): Promise<{ id: Id<"chalkboardItems">; text: string }[]> {
  const seen = new Set<Id<"chalkboardItems">>();
  const out: { id: Id<"chalkboardItems">; text: string }[] = [];
  for (const cbId of chalkboardItemIds) {
    if (seen.has(cbId)) continue;
    seen.add(cbId);
    const cb = await ctx.db.get(cbId);
    if (!cb) continue;
    if (cb.householdId === undefined) {
      if (cb.addedBy !== userId) continue;
    } else if (!(await isHouseholdMember(ctx, userId, cb.householdId))) {
      continue;
    }
    const text = cb.text.trim();
    out.push({
      id: cbId,
      text: text.length > 0 ? text : "Chalkboard item",
    });
  }
  return out;
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

function resolveRecipeServingScale(
  recipeServes: number | undefined,
  targetServings: number | undefined,
): number {
  if (
    targetServings === undefined ||
    recipeServes === undefined ||
    !Number.isFinite(recipeServes) ||
    recipeServes <= 0
  ) {
    return 1;
  }
  return targetServings / recipeServes;
}

function scaleRawIngredientAmount(
  rawAmount: number | string | null | undefined,
  factor: number,
  ingredientName?: string,
  unit?: string,
): number | string | null {
  return scaleAmountForServings(rawAmount, factor, { ingredientName, unit });
}

function aggregateIngredientsFromRecipes(
  recipes: {
    _id: Id<"recipes">;
    ingredients?: Doc<"recipes">["ingredients"];
    serves?: number;
  }[],
  targetServings?: number,
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
    const servingScale = resolveRecipeServingScale(recipe.serves, targetServings);
    const ingredients = recipe.ingredients ?? [];
    for (const ingredient of ingredients) {
      if (!ingredient?.name) continue;
      const key = getAggregationKey(ingredient);
      const storedAmount = scaleRawIngredientAmount(
        ingredient.amount,
        servingScale,
        ingredient.name,
        ingredient.unit,
      );

      const hasAmountOrUnit =
        storedAmount != null || ingredient.unit !== undefined;
      const entry = hasAmountOrUnit
        ? { amount: storedAmount, unit: ingredient.unit }
        : null;
      const existing = combined.get(key);
      if (!existing) {
        const recipeIds = new Set<Id<"recipes">>([recipe._id]);
        combined.set(key, {
          name: ingredient.name,
          unit: ingredient.unit,
          preparation: ingredient.preparation ?? undefined,
          amount: storedAmount,
          ingredientId: ingredient.ingredientId,
          amountEntries: entry ? [entry] : [],
          recipeIds,
        });
        continue;
      }
      existing.recipeIds.add(recipe._id);
      if (entry) {
        existing.amountEntries.push(entry);
      }
      const entries = existing.amountEntries;
      if (entries.length > 0) {
        const aggregated = entries.slice(1).reduce<{
          amount: number | string | null;
          unit?: string;
        }>(
          (acc, e) => combineAmounts(acc.amount, acc.unit, e.amount, e.unit),
          { amount: entries[0]!.amount, unit: entries[0]!.unit }
        );
        existing.amount = aggregated.amount ?? null;
        existing.unit = aggregated.unit;
      } else {
        existing.amount = null;
        existing.unit = undefined;
      }
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

export type AggregatedShoppingLine = ReturnType<
  typeof aggregateIngredientsFromRecipes
>[number];

function scaleAmountForLeftover(
  amount: number | string | null,
  factor: number,
): number | string | null {
  if (amount === null) return null;
  if (typeof amount === "number" && Number.isFinite(amount)) {
    return scaleNumericAmountForServings(amount, factor);
  }
  const parsed = Number(amount);
  if (Number.isFinite(parsed)) {
    return scaleNumericAmountForServings(parsed, factor);
  }
  return amount;
}

function combineAmountEntriesToDisplay(
  entries: Array<{ amount: number | string | null; unit?: string }>,
): { amount: number | string | null; unit?: string } {
  if (entries.length === 0) return { amount: null, unit: undefined };
  return entries.slice(1).reduce(
    (acc, e) => combineAmounts(acc.amount, acc.unit, e.amount, e.unit),
    { amount: entries[0]!.amount, unit: entries[0]!.unit },
  );
}

/** Full baseline copy from an aggregated line (before any leftover scaling). */
function baselineSnapshotFromAggregatedLine(line: AggregatedShoppingLine) {
  const amountEntries =
    line.amountEntries && line.amountEntries.length > 0
      ? line.amountEntries.map((e) => ({
          amount: e.amount,
          unit: e.unit,
        }))
      : [{ amount: line.amount, unit: line.unit }];
  return {
    amount: line.amount,
    unit: line.unit,
    amountEntries,
  };
}

function scaledLineFromBaseline(
  baseline: {
    amount: number | string | null;
    unit?: string;
    amountEntries: Array<{ amount: number | string | null; unit?: string }>;
  },
  factor: number,
): {
  amount: number | string | null;
  unit?: string;
  amountEntries: Array<{ amount: number | string | null; unit?: string }>;
} {
  const amountEntries = baseline.amountEntries.map((e) => ({
    amount: scaleAmountForLeftover(e.amount, factor),
    unit: e.unit,
  }));
  const combined = combineAmountEntriesToDisplay(amountEntries);
  return {
    amount: combined.amount ?? null,
    unit: combined.unit,
    amountEntries,
  };
}

function scaleAmountEntriesForServings(
  entries: Array<{ amount: number | string | null; unit?: string }>,
  factor: number,
) {
  const scaled = entries.map((entry) => ({
    amount: scaleAmountForLeftover(entry.amount, factor),
    unit: entry.unit,
  }));
  const combined = combineAmountEntriesToDisplay(scaled);
  return {
    amount: combined.amount ?? null,
    unit: combined.unit,
    amountEntries: scaled,
  };
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
 * Preview aggregated lines and which ones overlap the meal plan’s “already have” ingredients.
 * Optional for tooling or future UI; `createShoppingListFromMealPlan` does not depend on this
 * (overlapping ingredients default to full amounts when no per-line choices are sent).
 */
export const previewShoppingListFromMealPlan = query({
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

    const recipeIds = [...new Set(entries.map((e) => e.recipeId))];
    const recipes = await Promise.all(recipeIds.map((id) => ctx.db.get(id)));
    const validRecipes = recipes.filter(
      (r): r is NonNullable<typeof r> => r != null,
    );
    const aggregated = aggregateIngredientsFromRecipes(validRecipes);
    const leftoverSet = new Set(
      (plan.leftoverIngredientIds ?? []).map((id) => id as string),
    );

    const overlapIngredients = aggregated
      .filter(
        (i) =>
          i.ingredientId != null && leftoverSet.has(i.ingredientId as string),
      )
      .map((i) => ({
        ingredientId: i.ingredientId!,
        name: i.name,
        amountSummary: formatAggregatedLineSummary(i),
      }));

    return {
      hasLeftoverIntent:
        (plan.leftoverIngredientIds?.length ?? 0) > 0 ||
        (plan.leftoverIngredientPhrases?.length ?? 0) > 0,
      overlapIngredients,
      totalAggregatedLines: aggregated.length,
    };
  },
});

function formatAggregatedLineSummary(line: AggregatedShoppingLine): string {
  const entries =
    line.amountEntries.length > 0
      ? line.amountEntries
      : [{ amount: line.amount, unit: line.unit }];
  const parts = entries.map((e) =>
    `${e.amount ?? ""} ${e.unit ?? ""}`.trim(),
  );
  return parts.filter(Boolean).join(" + ") || "—";
}

async function collectHouseholdSharedShoppingLists(
  ctx: QueryCtx,
  userId: Id<"users">,
  seen: Set<Id<"shoppingLists">>
): Promise<Doc<"shoppingLists">[]> {
  const memberships = await ctx.db
    .query("householdMembers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  const out: Doc<"shoppingLists">[] = [];
  for (const m of memberships) {
    const lists = await ctx.db
      .query("shoppingLists")
      .withIndex("by_household", (q) => q.eq("householdId", m.householdId))
      .collect();
    for (const list of lists) {
      if (seen.has(list._id)) continue;
      if (list.status !== "draft" && list.status !== "active") continue;
      if (list.isPrivate === true) continue;
      if (list.userId === userId) continue;
      seen.add(list._id);
      out.push(list);
    }
  }
  return out;
}

/**
 * Get all draft/active shopping lists the current user can access (owned, household-shared, or via linked meal plan), ordered by recency.
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

    const seen = new Set(ownLists.map((l) => l._id));

    // Lists linked to meal plans the user can access (bounded by accessible plans, not all lists)
    const accessiblePlanIds = await getAccessibleMealPlanIds(ctx, user._id);
    const linkedLists: Doc<"shoppingLists">[] = [];
    for (const planId of accessiblePlanIds) {
      const lists = await ctx.db
        .query("shoppingLists")
        .withIndex("by_meal_plan", (q) => q.eq("mealPlanId", planId))
        .collect();
      for (const list of lists) {
        if (seen.has(list._id)) continue;
        if (list.status !== "draft" && list.status !== "active") continue;
        if (!(await canAccessShoppingList(ctx, user._id, list))) continue;
        seen.add(list._id);
        linkedLists.push(list);
      }
    }

    const householdLists = await collectHouseholdSharedShoppingLists(
      ctx,
      user._id,
      seen
    );

    const accessible = [...ownLists, ...linkedLists, ...householdLists];
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
    return {
      ...list,
      items: sortedItems,
      isOwner: list.userId === user._id,
    };
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

    const out: Doc<"shoppingLists">[] = [];
    for (const l of lists) {
      if (l.status !== "draft" && l.status !== "active") continue;
      if (await canAccessShoppingList(ctx, user._id, l)) {
        out.push(l);
      }
    }
    return out;
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
        if (!(await canAccessShoppingList(ctx, user._id, list))) continue;
        seen.add(list._id);
        linkedLists.push(list);
      }
    }

    const householdLists = await collectHouseholdSharedShoppingLists(
      ctx,
      user._id,
      seen
    );

    const accessible = [...ownLists, ...linkedLists, ...householdLists];
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
      isOwner: first.userId === user._id,
    };
  },
});

/**
 * Owner only: change in-app visibility — private (owner-only), remove household link, or share with a household.
 */
export const updateShoppingListSharing = mutation({
  args: {
    listId: v.id("shoppingLists"),
    visibility: v.union(
      v.literal("private"),
      v.literal("owner_only"),
      v.literal("household"),
    ),
    householdId: v.optional(v.id("households")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const list = await ctx.db.get(args.listId);
    if (!list) {
      throw new ConvexError("Shopping list not found");
    }
    if (list.userId !== user._id) {
      throw new ConvexError("Only the list owner can change sharing settings");
    }

    if (args.visibility === "private") {
      if (list.mealPlanId !== undefined) {
        throw new ConvexError(
          "This list is linked to a meal plan and cannot be made private while that link exists. Choose 'Not shared via household' to drop household visibility instead.",
        );
      }
      await ctx.db.patch(args.listId, {
        isPrivate: true,
        householdId: undefined,
      });
      return { success: true };
    }

    if (args.visibility === "owner_only") {
      await ctx.db.patch(args.listId, {
        isPrivate: undefined,
        householdId: undefined,
      });
      return { success: true };
    }

    const hid = await resolveDefaultHouseholdIdForSharing(
      ctx,
      user._id,
      args.householdId,
    );
    if (hid === undefined) {
      throw new ConvexError(
        "Choose a household or join a household to share this list",
      );
    }
    await ctx.db.patch(args.listId, {
      isPrivate: undefined,
      householdId: hid,
    });
    return { success: true };
  },
});

/**
 * Active shopping lists owned by the current user only. Used for subscription limits (household-shared lists created by someone else do not count against this cap).
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
    /** When omitted, uses the user's only household if they have exactly one (unless `isPrivate`). If they have several, omitting leaves the list unshared unless they pick a household in the UI. */
    householdId: v.optional(v.id("households")),
    /** Owner-only list; no household sharing. */
    isPrivate: v.optional(v.boolean()),
    targetServings: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.items?.length) {
      throw new ConvexError("Cannot create a shopping list with zero items.");
    }
    const user = await getCurrentUserOrThrow(ctx);
    const canUseServingTarget = canUseServingControl(user.subscriptionTier);
    const targetServings =
      canUseServingTarget && args.targetServings !== undefined
        ? clampTargetServings(args.targetServings)
        : undefined;
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

    let shareHouseholdId: Id<"households"> | undefined;
    if (!args.isPrivate) {
      shareHouseholdId = await resolveDefaultHouseholdIdForSharing(
        ctx,
        user._id,
        args.householdId
      );
    }

    const resolvedChalkboard = await resolveAccessibleChalkboardItems(
      ctx,
      user._id,
      args.chalkboardItemIds,
    );

    // Create the shopping list
    const listId = await ctx.db.insert("shoppingLists", {
      userId: user._id,
      status: "draft",
      expiresAt: now + oneWeek,
      chalkboardItemIds: resolvedChalkboard.map((r) => r.id),
      ...(shareHouseholdId !== undefined && { householdId: shareHouseholdId }),
      ...(args.isPrivate === true && { isPrivate: true }),
      ...(targetServings !== undefined
        ? { targetServings, baseTargetServings: targetServings }
        : {}),
    });

    // Recipe-derived lines
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
          baseAmountEntries: entries,
          amountManuallyEdited: false,
          ...(item.recipeIds != null && item.recipeIds.length > 0 && { recipeIds: item.recipeIds }),
        });
      })
    );

    // Chalkboard lines (cleared from chalkboard when list is finalised)
    const baseOrder = args.items.length;
    await Promise.all(
      resolvedChalkboard.map((r, j) =>
        ctx.db.insert("shoppingListItems", {
          shoppingListId: listId,
          name: r.text,
          amount: null,
          checked: false,
          order: baseOrder + j,
        })
      )
    );

    return { listId };
  },
});

/**
 * Create a shopping list from a meal plan. User must have access to the plan (owner or shared household).
 */
const leftoverShoppingChoiceValidator = v.object({
  ingredientId: v.id("ingredients"),
  mode: v.union(
    v.literal("full"),
    v.literal("reduced"),
    v.literal("exclude"),
  ),
  reducedScale: v.optional(v.number()),
});

export const createShoppingListFromMealPlan = mutation({
  args: {
    mealPlanId: v.id("mealPlans"),
    chalkboardItemIds: v.array(v.id("chalkboardItems")),
    targetServings: v.optional(v.number()),
    /** Per overlapping ingredient: optional override (defaults to full amount on the list if omitted). */
    leftoverIngredientChoices: v.optional(v.array(leftoverShoppingChoiceValidator)),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const plan = await ctx.db.get(args.mealPlanId);
    if (!plan) throw new ConvexError("Meal plan not found");
    const allowed = await canAccessMealPlan(ctx, user._id, plan);
    if (!allowed) {
      throw new ConvexError("You do not have access to this meal plan");
    }
    const canUseServingTarget = canUseServingControl(user.subscriptionTier);
    const requestedTargetServings =
      canUseServingTarget
        ? (args.targetServings ?? plan.targetServings)
        : undefined;
    const resolvedTargetServings =
      requestedTargetServings !== undefined
        ? clampTargetServings(requestedTargetServings)
        : undefined;

    const entries = await ctx.db
      .query("mealPlanEntries")
      .withIndex("by_meal_plan", (q) => q.eq("mealPlanId", args.mealPlanId))
      .collect();

    const recipeIds = [...new Set(entries.map((e) => e.recipeId))];
    const recipes = await Promise.all(recipeIds.map((id) => ctx.db.get(id)));
    const validRecipes = recipes.filter(
      (r): r is NonNullable<typeof r> => r != null
    );
    const items = aggregateIngredientsFromRecipes(
      validRecipes,
      resolvedTargetServings,
    );
    const resolvedChalkboard = await resolveAccessibleChalkboardItems(
      ctx,
      user._id,
      args.chalkboardItemIds,
    );

    const leftoverSet = new Set(
      (plan.leftoverIngredientIds ?? []).map((id) => id as string),
    );
    const choiceMap = new Map<
      string,
      { mode: "full" | "reduced" | "exclude"; reducedScale?: number }
    >();
    for (const c of args.leftoverIngredientChoices ?? []) {
      choiceMap.set(c.ingredientId as string, {
        mode: c.mode,
        reducedScale: c.reducedScale,
      });
    }

    const rowsToInsert: Array<{
      line: AggregatedShoppingLine;
      leftoverMeta?: {
        ingredientId: Id<"ingredients">;
        mode: "full" | "reduced";
        baseline: ReturnType<typeof baselineSnapshotFromAggregatedLine>;
        reducedScale?: number;
      };
    }> = [];

    for (const line of items) {
      const iid = line.ingredientId;
      const overlaps =
        leftoverSet.size > 0 &&
        iid !== undefined &&
        leftoverSet.has(iid as string);
      if (overlaps) {
        const choice = choiceMap.get(iid as string) ?? {
          mode: "full" as const,
        };
        if (choice.mode === "exclude") {
          continue;
        }
        const scale =
          choice.mode === "reduced" ? (choice.reducedScale ?? 0.5) : 1;
        const baseline = baselineSnapshotFromAggregatedLine(line);
        const display = scaledLineFromBaseline(baseline, scale);
        rowsToInsert.push({
          line: {
            ...line,
            amount: display.amount,
            unit: display.unit,
            amountEntries: display.amountEntries,
          },
          leftoverMeta: {
            ingredientId: iid,
            mode: choice.mode === "reduced" ? "reduced" : "full",
            baseline,
            reducedScale:
              choice.mode === "reduced"
                ? (choice.reducedScale ?? 0.5)
                : undefined,
          },
        });
        continue;
      }
      rowsToInsert.push({ line });
    }

    rowsToInsert.sort((a, b) =>
      a.line.name.localeCompare(b.line.name, undefined, {
        sensitivity: "base",
      }),
    );

    if (!rowsToInsert.length && !resolvedChalkboard.length) {
      throw new ConvexError(
        "Cannot create a shopping list from this meal plan: no ingredients or chalkboard items."
      );
    }

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
      chalkboardItemIds: resolvedChalkboard.map((r) => r.id),
      mealPlanId: args.mealPlanId,
      ...(plan.householdId !== undefined && { householdId: plan.householdId }),
      ...(resolvedTargetServings !== undefined
        ? {
            targetServings: resolvedTargetServings,
            baseTargetServings: resolvedTargetServings,
          }
        : {}),
    });

    let order = 0;
    for (const row of rowsToInsert) {
      const item = row.line;
      const entries = item.amountEntries ?? [
        { amount: item.amount, unit: item.unit },
      ];
      const first = entries[0];
      await ctx.db.insert("shoppingListItems", {
        shoppingListId: listId,
        name: item.name,
        amount: first?.amount ?? item.amount,
        unit: first?.unit ?? item.unit,
        preparation: item.preparation,
        checked: false,
        order: order++,
        ingredientId: item.ingredientId,
        amountEntries: entries,
        baseAmountEntries: entries,
        amountManuallyEdited: false,
        recipeIds: item.recipeIds,
        ...(row.leftoverMeta
          ? {
              mealPlanLeftoverIngredientId: row.leftoverMeta.ingredientId,
              leftoverIncludeMode: row.leftoverMeta.mode,
              leftoverReducedScale: row.leftoverMeta.reducedScale,
              leftoverBaseline: {
                amount: row.leftoverMeta.baseline.amount,
                unit: row.leftoverMeta.baseline.unit,
                amountEntries: row.leftoverMeta.baseline.amountEntries,
              },
            }
          : {}),
      });
    }

    const baseOrder = order;
    await Promise.all(
      resolvedChalkboard.map((r, j) =>
        ctx.db.insert("shoppingListItems", {
          shoppingListId: listId,
          name: r.text,
          amount: null,
          checked: false,
          order: baseOrder + j,
        })
      )
    );

    return { listId };
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
    await ctx.db.patch(args.itemId, { amountManuallyEdited: true });

    return { success: true };
  },
});

export const updateDraftShoppingListTargetServings = mutation({
  args: {
    listId: v.id("shoppingLists"),
    targetServings: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const list = await ctx.db.get(args.listId);
    if (!list) throw new ConvexError("Shopping list not found");
    const allowed = await canAccessShoppingList(ctx, user._id, list);
    if (!allowed) throw new ConvexError("You do not have access to this shopping list");
    if (list.status !== "draft") {
      throw new ConvexError("Can only update servings in draft mode");
    }
    if (!canUseServingControl(user.subscriptionTier)) {
      // Non-entitled callers should gracefully no-op to the current/default list behavior.
      return {
        success: true,
        targetServings: list.targetServings ?? list.baseTargetServings ?? undefined,
      };
    }
    const nextTarget = clampTargetServings(args.targetServings);
    const baseTarget = clampTargetServings(
      list.baseTargetServings ?? list.targetServings ?? nextTarget,
    );
    const ratio = nextTarget / baseTarget;
    const items = await ctx.db
      .query("shoppingListItems")
      .withIndex("by_shopping_list", (q) => q.eq("shoppingListId", args.listId))
      .collect();
    for (const item of items) {
      if (item.amountManuallyEdited === true) continue;
      const baseEntries =
        item.baseAmountEntries && item.baseAmountEntries.length > 0
          ? item.baseAmountEntries
          : item.amountEntries && item.amountEntries.length > 0
            ? item.amountEntries
            : [{ amount: item.amount, unit: item.unit }];
      const scaled = scaleAmountEntriesForServings(baseEntries, ratio);
      await ctx.db.patch(item._id, {
        amount: scaled.amount,
        unit: scaled.unit,
        amountEntries: scaled.amountEntries,
      });
    }
    await ctx.db.patch(args.listId, {
      targetServings: nextTarget,
      baseTargetServings: baseTarget,
    });
    return { success: true, targetServings: nextTarget };
  },
});

/**
 * Recompute a meal-plan “already have” line from its stored baseline using full / reduced / exclude.
 * The shopping-list UI normally edits amounts via `updateItemAmount` instead; this remains useful
 * for proportional scaling against `leftoverBaseline` when needed.
 */
export const updateMealPlanLeftoverShoppingItem = mutation({
  args: {
    itemId: v.id("shoppingListItems"),
    mode: v.union(
      v.literal("full"),
      v.literal("reduced"),
      v.literal("exclude"),
    ),
    reducedScale: v.optional(v.number()),
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
    if (
      item.mealPlanLeftoverIngredientId === undefined ||
      item.leftoverBaseline === undefined
    ) {
      throw new ConvexError("This line is not an “already have” meal-plan item");
    }

    if (args.mode === "exclude") {
      await ctx.db.delete(args.itemId);
      return { deleted: true as const };
    }

    const baseline = item.leftoverBaseline;
    const scale =
      args.mode === "reduced" ? (args.reducedScale ?? 0.5) : 1;
    const display = scaledLineFromBaseline(baseline, scale);
    const entries = display.amountEntries;
    const first = entries[0];
    await ctx.db.patch(args.itemId, {
      amount: first?.amount ?? display.amount,
      unit: first?.unit ?? display.unit,
      amountEntries: entries,
      leftoverIncludeMode: args.mode === "reduced" ? "reduced" : "full",
      leftoverReducedScale:
        args.mode === "reduced" ? (args.reducedScale ?? 0.5) : undefined,
    });

    return { success: true as const };
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

    const chalkboardItemIds = args.items.map((i) => i.chalkboardItemId);
    const resolvedChalkboard = await resolveAccessibleChalkboardItems(
      ctx,
      user._id,
      chalkboardItemIds
    );
    if (resolvedChalkboard.length === 0) {
      throw new ConvexError(
        "None of the requested chalkboard items could be added (not found or no access)."
      );
    }

    await Promise.all(
      resolvedChalkboard.map((item) => {
        maxOrder++;
        return ctx.db.insert("shoppingListItems", {
          shoppingListId: args.listId,
          name: item.text,
          amount: null,
          checked: false,
          order: maxOrder,
        });
      })
    );

    await ctx.db.patch(args.listId, {
      chalkboardItemIds: [
        ...list.chalkboardItemIds,
        ...resolvedChalkboard.map((item) => item.id),
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

    if (!(await canModifyShoppingList(ctx, user._id, list))) {
      throw new ConvexError(
        manageDeniedMessage(
          list,
          user._id,
          "Only the list owner can complete this shopping list",
        ),
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

    if (!(await canModifyShoppingList(ctx, user._id, list))) {
      throw new ConvexError(
        manageDeniedMessage(
          list,
          user._id,
          "Only the list owner can delete this shopping list",
        ),
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

    if (!(await canModifyShoppingList(ctx, user._id, list))) {
      throw new ConvexError(
        manageDeniedMessage(
          list,
          user._id,
          "Only the list owner can un-finalise this shopping list",
        ),
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
 * Normalised names still represented on shopping lines (row text + canonical ingredient names).
 * Used so we only remove chalkboard rows that still have a matching line on the finalised trip.
 */
async function normalizedNameKeysForListLines(
  ctx: MutationCtx,
  rows: Doc<"shoppingListItems">[],
): Promise<Set<string>> {
  const keys = new Set<string>();
  const ingIds = [
    ...new Set(
      rows
        .map((r) => r.ingredientId)
        .filter((id): id is Id<"ingredients"> => id != null),
    ),
  ];
  const ingDocs = await Promise.all(ingIds.map((id) => ctx.db.get(id)));
  const ingById = new Map(
    ingIds.map((id, i) => [id, ingDocs[i]] as const),
  );

  for (const row of rows) {
    const fromName = normaliseNameForGrouping(row.name);
    if (fromName) keys.add(fromName);
    const ing = row.ingredientId ? ingById.get(row.ingredientId) : undefined;
    if (ing) {
      const kn = normaliseNameForGrouping(ing.name ?? "");
      const kd = normaliseNameForGrouping(ing.displayName ?? "");
      if (kn) keys.add(kn);
      if (kd) keys.add(kd);
    }
  }
  return keys;
}

/**
 * Shared core: draft → active, subscription check, chalkboard cleanup.
 * Caller must ensure `list` is current and still `draft`.
 */
async function executeFinaliseDraftShoppingList(
  ctx: MutationCtx,
  list: Doc<"shoppingLists">,
  actingUser: Doc<"users">,
): Promise<void> {
  if (!(await canModifyShoppingList(ctx, actingUser._id, list))) {
    throw new ConvexError(
      manageDeniedMessage(
        list,
        actingUser._id,
        "Only the list owner can finalize this shopping list",
      ),
    );
  }

  if (list.status !== "draft") {
    throw new ConvexError("Shopping list is already finalized");
  }

  const remainingRows = await ctx.db
    .query("shoppingListItems")
    .withIndex("by_shopping_list", (q) => q.eq("shoppingListId", list._id))
    .collect();
  const lineKeys = await normalizedNameKeysForListLines(ctx, remainingRows);

  const creator = await ctx.db.get(list.userId);
  const subscription = creator
    ? await getUserSubscription(creator, ctx)
    : { maxActiveShoppingLists: -1 };
  const activeLists = await ctx.db
    .query("shoppingLists")
    .withIndex("by_user_and_status", (q) =>
      q.eq("userId", list.userId).eq("status", "active"),
    )
    .collect();

  if (
    subscription.maxActiveShoppingLists !== -1 &&
    activeLists.length >= subscription.maxActiveShoppingLists
  ) {
    throw new ConvexError(
      `The list owner has reached their limit of ${subscription.maxActiveShoppingLists} active shopping lists. Complete an existing list before finalizing this one.`,
    );
  }

  const now = Date.now();

  await ctx.db.patch(list._id, {
    status: "active",
    finalisedAt: now,
  });

  for (const chalkboardItemId of list.chalkboardItemIds) {
    try {
      const cb = await ctx.db.get(chalkboardItemId);
      if (!cb) continue;

      const cbKey = normaliseNameForGrouping(cb.text);
      if (!cbKey || !lineKeys.has(cbKey)) {
        continue;
      }

      // Items are tied to this list via `chalkboardItemIds`. Finaliser already passed
      // `canModifyShoppingList` (owner or meal-plan/household collaborator). Remove
      // matching rows regardless of `addedBy` so e.g. a collaborator can clear the
      // owner's personal chalkboard lines attached to this draft.
      const canDelete =
        cb.householdId === undefined ||
        (await isHouseholdMember(ctx, actingUser._id, cb.householdId));
      if (!canDelete) continue;

      await ctx.db.delete(chalkboardItemId);
    } catch (error) {
      console.error("Failed to delete chalkboard item:", error);
    }
  }
}

/**
 * Atomically remove draft list lines then finalise the list (single mutation).
 * Use for pantry trim + confirm so removals and finalisation cannot partially apply or double-apply.
 */
export const trimDraftItemsAndFinaliseShoppingList = mutation({
  args: {
    listId: v.id("shoppingLists"),
    itemIdsToRemove: v.array(v.id("shoppingListItems")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const list = await ctx.db.get(args.listId);
    if (!list) {
      throw new ConvexError("Shopping list not found");
    }

    if (!(await canModifyShoppingList(ctx, user._id, list))) {
      throw new ConvexError(
        manageDeniedMessage(
          list,
          user._id,
          "Only the list owner can finalize this shopping list",
        ),
      );
    }

    if (list.status !== "draft") {
      throw new ConvexError("Shopping list is already finalized");
    }

    const uniqueRemove = [...new Set(args.itemIdsToRemove)];
    for (const itemId of uniqueRemove) {
      const row = await ctx.db.get(itemId);
      if (!row) {
        throw new ConvexError("Shopping list item not found");
      }
      if (row.shoppingListId !== args.listId) {
        throw new ConvexError("Item does not belong to this shopping list");
      }
      await ctx.db.delete(itemId);
    }

    const listAfterTrim = await ctx.db.get(args.listId);
    if (!listAfterTrim) {
      throw new ConvexError("Shopping list not found");
    }

    await executeFinaliseDraftShoppingList(ctx, listAfterTrim, user);

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
