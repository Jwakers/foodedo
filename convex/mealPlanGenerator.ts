/**
 * Intelligent Weekly Meal Plan Generator — selection algorithm.
 *
 * Flow: build pool (eligible recipes) → apply constraints (recently suggested, protein/cuisine caps)
 * → score recipes (behavioural acceptance + editorial bias) → weighted deterministic selection.
 * Spec 3 (Algorithm Overview), 6.3 (Deterministic), 6.4 (Recently used).
 */

import type { Doc, Id } from "./_generated/dataModel";
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
import {
  collectLeftoverMatchKeys,
  leftoverWeightMultiplier,
  normaliseLeftoverPhrasesList,
} from "./lib/leftoverIngredients";
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
  /** Set when generation uses leftover-ingredient boosting (same target count for all pool rows). */
  leftoverMatchCount?: number;
  /** Distinct matched targets: `id:…` and `phr:…` keys (for novel leftover weighting). */
  leftoverMatchKeys?: string[];
  leftoverTargetCount?: number;
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
  options?: {
    leftoverTargetIds?: Id<"ingredients">[] | null;
    leftoverTargetPhrases?: string[] | null;
  },
): Promise<PoolRecipe[]> {
  const pool: PoolRecipe[] = [];
  const seenIds = new Set<Id<"recipes">>();

  let leftoverDocs: Doc<"ingredients">[] = [];
  if (options?.leftoverTargetIds?.length) {
    const got = await Promise.all(
      options.leftoverTargetIds.map((id) => ctx.db.get(id)),
    );
    leftoverDocs = got.filter((d): d is Doc<"ingredients"> => d != null);
  }
  const normalisedPhrases = normaliseLeftoverPhrasesList(
    options?.leftoverTargetPhrases,
  );
  const leftoverIdsForMatch = leftoverDocs.map((d) => d._id);
  const totalLeftoverTargets = leftoverDocs.length + normalisedPhrases.length;
  const leftoverTargetCount =
    totalLeftoverTargets > 0 ? totalLeftoverTargets : undefined;

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
    ingredients?: Doc<"recipes">["ingredients"];
  }) => {
    if (seenIds.has(r._id)) return;
    if (!recipeIsInMealPlanGeneratorPool(r)) return;
    seenIds.add(r._id);
    let leftoverMatchKeys: string[] | undefined;
    let leftoverMatchCount: number | undefined;
    if (leftoverTargetCount !== undefined) {
      leftoverMatchKeys = collectLeftoverMatchKeys(
        r.ingredients,
        leftoverIdsForMatch,
        leftoverDocs,
        normalisedPhrases,
      );
      leftoverMatchCount = leftoverMatchKeys.length;
    }
    pool.push({
      _id: r._id,
      primaryProtein: r.primaryProtein,
      complexityTier: r.complexityTier,
      cuisine: r.cuisine,
      editorialBias: r.editorialBias,
      isSystem: r.source === "system",
      ...(leftoverTargetCount !== undefined
        ? { leftoverTargetCount, leftoverMatchCount, leftoverMatchKeys }
        : {}),
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
  /** Target keys (`id:…` / `phr:…`) already covered; only novel matches get leftover boost. */
  coveredLeftoverTargetKeys?: ReadonlySet<string>,
): number {
  const stat = stats.get(recipe._id);
  const score = acceptanceScore(stat);
  const bias = Math.max(0.01, recipe.editorialBias ?? 1);

  const keys = recipe.leftoverMatchKeys ?? [];
  const novelCount = coveredLeftoverTargetKeys
    ? keys.filter((k) => !coveredLeftoverTargetKeys.has(k)).length
    : keys.length;

  /** While some leftover targets are still uncovered, allow recipes that match new targets to ignore protein/cuisine caps so each target can get a meal. */
  const relaxDiversityCaps =
    recipe.leftoverTargetCount != null &&
    recipe.leftoverTargetCount > 0 &&
    coveredLeftoverTargetKeys != null &&
    coveredLeftoverTargetKeys.size < recipe.leftoverTargetCount &&
    novelCount > 0;

  if (!relaxDiversityCaps) {
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
  }

  const libraryBoost = recipe.isSystem ? 1 : LIBRARY_MEAL_PLAN_WEIGHT_MULTIPLIER;
  let w = score * bias * libraryBoost;
  if (
    recipe.leftoverTargetCount != null &&
    recipe.leftoverTargetCount > 0 &&
    novelCount > 0
  ) {
    w *= leftoverWeightMultiplier(
      novelCount,
      recipe.leftoverTargetCount,
    );
  }
  return w;
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
  const coveredLeftoverTargetKeys =
    coveredLeftoverKeysFromRecipes(alreadySelectedLocked);

  const leftoverTargetTotal = sortedPool.find(
    (p) => p.leftoverTargetCount != null && p.leftoverTargetCount > 0,
  )?.leftoverTargetCount;

  const unionPickLeftovers = (pick: PoolRecipe) => {
    for (const k of pick.leftoverMatchKeys ?? []) {
      coveredLeftoverTargetKeys.add(k);
    }
  };

  for (let i = 0; i < count; i++) {
    const remaining = candidates.filter(
      (c) => !selected.some((s) => s._id === c._id),
    );
    if (remaining.length === 0) break;

    const hasUncoveredTargets =
      leftoverTargetTotal != null &&
      coveredLeftoverTargetKeys.size < leftoverTargetTotal;

    const withNovelLeftover = remaining.filter((r) => {
      const k = r.leftoverMatchKeys ?? [];
      return k.some((key) => !coveredLeftoverTargetKeys.has(key));
    });

    let pickFrom = remaining;
    let pickWeights = remaining.map((r) =>
      weight(
        r,
        actorStats,
        selected,
        MAX_PRIMARY_PROTEIN_PER_WEEK,
        MAX_CUISINE_PER_WEEK,
        coveredLeftoverTargetKeys,
      ),
    );
    let tw = pickWeights.reduce((a, b) => a + b, 0);

    if (hasUncoveredTargets && withNovelLeftover.length > 0) {
      const wnWeights = withNovelLeftover.map((r) =>
        weight(
          r,
          actorStats,
          selected,
          MAX_PRIMARY_PROTEIN_PER_WEEK,
          MAX_CUISINE_PER_WEEK,
          coveredLeftoverTargetKeys,
        ),
      );
      const wnTotal = wnWeights.reduce((a, b) => a + b, 0);
      if (wnTotal > 0) {
        pickFrom = withNovelLeftover;
        pickWeights = wnWeights;
        tw = wnTotal;
      }
    }

    if (tw <= 0) {
      const pick = remaining[0];
      selected.push(pick);
      result.push(pick._id);
      unionPickLeftovers(pick);
      continue;
    }

    let r = rng() * tw;
    let idx = 0;
    for (; idx < pickFrom.length; idx++) {
      r -= pickWeights[idx];
      if (r <= 0) break;
    }
    idx = Math.min(idx, pickFrom.length - 1);
    const pick = pickFrom[idx];
    selected.push(pick);
    result.push(pick._id);
    unionPickLeftovers(pick);
  }

  return result;
}

function coveredLeftoverKeysFromRecipes(rows: PoolRecipe[]): Set<string> {
  const s = new Set<string>();
  for (const row of rows) {
    for (const k of row.leftoverMatchKeys ?? []) {
      s.add(k);
    }
  }
  return s;
}
