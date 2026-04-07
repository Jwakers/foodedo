/**
 * Intelligent Weekly Meal Plan Generator — selection algorithm.
 *
 * Flow: build pool (eligible recipes) → apply constraints (recently suggested, protein/cuisine caps)
 * → score recipes (behavioural acceptance + editorial bias) → weighted deterministic selection.
 * Spec 3 (Algorithm Overview), 6.3 (Deterministic), 6.4 (Recently used).
 */

import type { Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { canAccessRecipe } from "./households";
import {
  LIBRARY_MEAL_PLAN_WEIGHT_MULTIPLIER,
  MAX_CUISINE_PER_WEEK,
  MAX_PRIMARY_PROTEIN_PER_WEEK,
  RECENTLY_SUGGESTED_DAYS,
  recipeIsInMealPlanGeneratorPool,
  SMOOTHING,
  SMOOTHING_FACTOR,
} from "./lib/constants";
import type { ActorType } from "./recipeBehaviourStats";

/** Minimal recipe shape needed for scoring and constraints (Spec 3 Step 2, 5.2). */
export type PoolRecipe = {
  _id: Id<"recipes">;
  primaryProtein?: string | null;
  complexityTier?: string | null;
  cuisine?: string[] | null;
  editorialBias?: number | null;
  /** System (Discover) catalog recipes are not boosted; user and household recipes are. */
  isSystem: boolean;
};

export type BehaviourStatsMap = Map<
  Id<"recipes">,
  { suggestedCount: number; swappedCount: number; removedCount: number }
>;

/**
 * Build the eligible recipe pool for generation: system + user + household recipes.
 * Spec 8: include only if isGeneratorEligible === true OR (primaryProtein and complexityTier set).
 */
export async function buildPool(
  ctx: QueryCtx,
  userId: Id<"users">,
  householdId: Id<"households"> | null,
): Promise<PoolRecipe[]> {
  const pool: PoolRecipe[] = [];
  const seenIds = new Set<Id<"recipes">>();

  const addIfEligible = (r: {
    _id: Id<"recipes">;
    category?: string | null;
    primaryProtein?: string | null;
    complexityTier?: string | null;
    cuisine?: string[] | null;
    editorialBias?: number | null;
    isGeneratorEligible?: boolean | null;
    source?: string | null;
    userId?: Id<"users"> | null;
    excludeFromMealPlanGenerator?: boolean | null;
  }) => {
    if (seenIds.has(r._id)) return;
    if (!recipeIsInMealPlanGeneratorPool(r)) return;
    seenIds.add(r._id);
    pool.push({
      _id: r._id,
      primaryProtein: r.primaryProtein,
      complexityTier: r.complexityTier,
      cuisine: r.cuisine,
      editorialBias: r.editorialBias,
      isSystem: r.source === "system",
    });
  };

  // System recipes
  const systemRecipes = await ctx.db
    .query("recipes")
    .withIndex("by_source", (q) => q.eq("source", "system"))
    .collect();
  for (const r of systemRecipes) addIfEligible(r);

  // User recipes
  const userRecipes = await ctx.db
    .query("recipes")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  for (const r of userRecipes) addIfEligible(r);

  // Household recipes (user must have access)
  if (householdId) {
    const shared = await ctx.db
      .query("householdRecipes")
      .withIndex("by_household", (q) => q.eq("householdId", householdId))
      .collect();
    for (const s of shared) {
      const recipe = await ctx.db.get(s.recipeId);
      if (!recipe) continue;
      const { canAccess } = await canAccessRecipe(ctx, userId, s.recipeId);
      if (!canAccess) continue;
      addIfEligible(recipe);
    }
  }

  return pool;
}

/**
 * Get recipe ids that were suggested recently (within withinDays).
 * Spec 6.4: "recently used" = recently suggested; we exclude these to avoid repetition.
 */
export async function getRecentlySuggested(
  ctx: QueryCtx,
  actorType: ActorType,
  actorId: Id<"users"> | Id<"households">,
  withinDays: number = RECENTLY_SUGGESTED_DAYS,
): Promise<Set<Id<"recipes">>> {
  const cutoff = Date.now() - withinDays * 24 * 60 * 60 * 1000;
  const stats = await ctx.db
    .query("recipeBehaviourStats")
    .withIndex("by_actor_lastSuggestedAt", (q) =>
      q
        .eq("actorType", actorType)
        .eq("actorId", actorId)
        .gte("lastSuggestedAt", cutoff),
    )
    .collect();
  return new Set(stats.map((s) => s.recipeId));
}

/**
 * Load all behaviour stats for an actor (for scoring). Spec 4.2: kept = suggested - swapped - removed (computed at use time).
 */
export async function getBehaviourStatsForActor(
  ctx: QueryCtx,
  actorType: ActorType,
  actorId: Id<"users"> | Id<"households">,
): Promise<BehaviourStatsMap> {
  const rows = await ctx.db
    .query("recipeBehaviourStats")
    .withIndex("by_actor", (q) =>
      q.eq("actorType", actorType).eq("actorId", actorId),
    )
    .collect();
  const map: BehaviourStatsMap = new Map();
  for (const r of rows) {
    map.set(r.recipeId, {
      suggestedCount: r.suggestedCount,
      swappedCount: r.swappedCount,
      removedCount: r.removedCount,
    });
  }
  return map;
}

/**
 * Acceptance score for a recipe: (kept + smoothing) / (suggested + smoothingFactor).
 * Spec 4.4: avoids 0/0; new recipes get ~0.5. kept = suggestedCount - swappedCount - removedCount.
 */
function acceptanceScore(
  stats:
    | { suggestedCount: number; swappedCount: number; removedCount: number }
    | undefined,
  smoothing: number = SMOOTHING,
  smoothingFactor: number = SMOOTHING_FACTOR,
): number {
  if (!stats || stats.suggestedCount === 0) {
    return (0 + smoothing) / (0 + smoothingFactor);
  }
  const kept = stats.suggestedCount - stats.swappedCount - stats.removedCount;
  return (kept + smoothing) / (stats.suggestedCount + smoothingFactor);
}

/**
 * Count how many of alreadySelected have the same primaryProtein (for cap). Same for cuisine (count per cuisine tag).
 */
function countByProtein(
  alreadySelected: PoolRecipe[],
  protein: string | undefined | null,
): number {
  if (!protein || protein === "other" || protein === "none") return 0;
  return alreadySelected.filter((r) => r.primaryProtein === protein).length;
}

function countByCuisine(
  alreadySelected: PoolRecipe[],
  cuisineTag: string,
): number {
  return alreadySelected.filter(
    (r) => r.cuisine && r.cuisine.includes(cuisineTag),
  ).length;
}

/**
 * Weight for a candidate recipe: editorialBias * acceptanceScore, then 0 if adding it would exceed constraints.
 * Spec 3 Step 4: base weighting, behavioural acceptance, optional editorial bias, constraint compliance.
 */
export function weight(
  recipe: PoolRecipe,
  stats: BehaviourStatsMap,
  alreadySelected: PoolRecipe[],
  proteinCap: number = MAX_PRIMARY_PROTEIN_PER_WEEK,
  cuisineCap: number = MAX_CUISINE_PER_WEEK,
): number {
  const stat = stats.get(recipe._id);
  const score = acceptanceScore(stat);
  const bias = Math.max(0.01, recipe.editorialBias ?? 1);

  // Constraint: primary protein cap (Spec 3 Step 2)
  const protein = recipe.primaryProtein ?? "other";
  if (
    protein !== "other" &&
    protein !== "none" &&
    countByProtein(alreadySelected, protein) >= proteinCap
  ) {
    return 0;
  }

  // Constraint: cuisine cap per tag (max N per cuisine in the week)
  const cuisines = recipe.cuisine ?? [];
  for (const c of cuisines) {
    if (countByCuisine(alreadySelected, c) >= cuisineCap) return 0;
  }

  const libraryBoost = recipe.isSystem ? 1 : LIBRARY_MEAL_PLAN_WEIGHT_MULTIPLIER;
  return score * bias * libraryBoost;
}

/**
 * Seeded RNG (mulberry32) for deterministic selection. Spec 6.3: same seed + pool => same selection.
 * State is derived from the seed string (hash); state is kept non-zero to avoid a stuck stream.
 */
function seededRandom(seed: string): () => number {
  let state = 0;
  for (let i = 0; i < seed.length; i++) {
    state = Math.imul(31, state) + seed.charCodeAt(i);
    state = (state << 13) | (state >>> 19);
  }
  state = (state >>> 0) || 1;
  return function next() {
    let t = (state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Weighted selection without replacement: pick `count` recipes from pool using weights.
 * Deterministic given seed (Spec 6.3). Excludes excludeRecipeIds (e.g. recently suggested).
 * alreadySelectedLocked: recipes already in the week (e.g. locked entries on regenerate); used only for constraint counts (protein/cuisine caps). Return value is only the newly selected recipe ids (length up to count).
 */
export function selectRecipes(
  pool: PoolRecipe[],
  count: number,
  actorStats: BehaviourStatsMap,
  seed: string,
  excludeRecipeIds: Set<Id<"recipes">>,
  alreadySelectedLocked: PoolRecipe[] = [],
): Id<"recipes">[] {
  const sortedPool = [...pool].sort((a, b) => (a._id < b._id ? -1 : 1));
  const candidates = sortedPool.filter((r) => !excludeRecipeIds.has(r._id));
  const selected: PoolRecipe[] = [...alreadySelectedLocked];
  const result: Id<"recipes">[] = [];
  const rng = seededRandom(seed);

  for (let i = 0; i < count; i++) {
    const remaining = candidates.filter(
      (c) => !selected.some((s) => s._id === c._id),
    );
    if (remaining.length === 0) break;

    const weights = remaining.map((r) => weight(r, actorStats, selected));
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    if (totalWeight <= 0) {
      const pick = remaining[0];
      selected.push(pick);
      result.push(pick._id);
      continue;
    }

    let r = rng() * totalWeight;
    let idx = 0;
    for (; idx < remaining.length; idx++) {
      r -= weights[idx];
      if (r <= 0) break;
    }
    idx = Math.min(idx, remaining.length - 1);
    const pick = remaining[idx];
    selected.push(pick);
    result.push(pick._id);
  }

  return result;
}
