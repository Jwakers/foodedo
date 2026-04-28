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
  canUseHouseholdPreferences,
  canUseLeftoverIngredients,
  canUseQuickMealPreferences,
  canUseServingControl,
  clampTargetServings,
  LEFTOVER_INGREDIENTS_MAX,
  MAX_DAYS_IN_MEAL_PLAN,
  MEAL_PLAN_ERRORS,
  PRIMARY_PROTEINS,
  QUICK_MEALS_MIN_MINUTES,
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

type UserPreferenceShape = NonNullable<Doc<"users">["preferences"]>;

function normalisePreferencePhrase(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

async function resolveGenerationPreferenceConstraints(args: {
  ctx: QueryCtx;
  ownerUserId: Id<"users">;
  householdId: Id<"households"> | undefined;
  includedMemberUserIds: Id<"users">[] | undefined;
  subscriptionTier: string | undefined;
}): Promise<{
  includedMemberUserIds: Id<"users">[] | undefined;
  snapshot:
    | {
        allergyIngredientIds: Id<"ingredients">[];
        allergyPhrases: string[];
        excludedPrimaryProteins: (typeof PRIMARY_PROTEINS)[number][];
      }
    | undefined;
}> {
  const wantsPreferenceFiltering =
    (args.includedMemberUserIds?.length ?? 0) > 0 &&
    args.householdId !== undefined;
  if (!wantsPreferenceFiltering) {
    return { includedMemberUserIds: undefined, snapshot: undefined };
  }
  if (!canUseHouseholdPreferences(args.subscriptionTier)) {
    throw new ConvexError(
      MEAL_PLAN_ERRORS.PREMIUM_REQUIRED_HOUSEHOLD_PREFERENCES,
    );
  }

  const members = await args.ctx.db
    .query("householdMembers")
    .withIndex("by_household", (q) => q.eq("householdId", args.householdId!))
    .collect();
  const memberSet = new Set(members.map((member) => member.userId));
  const uniqueSelected = Array.from(new Set(args.includedMemberUserIds ?? []));
  const validSelected = uniqueSelected.filter((id) => memberSet.has(id));
  if (!validSelected.includes(args.ownerUserId)) {
    validSelected.unshift(args.ownerUserId);
  }
  if (validSelected.length === 0) {
    return { includedMemberUserIds: undefined, snapshot: undefined };
  }

  const selectedUsers = await Promise.all(
    validSelected.map((userId) => args.ctx.db.get(userId)),
  );

  const allergyIngredientIds = new Set<Id<"ingredients">>();
  const allergyPhrases = new Set<string>();
  const excludedPrimaryProteins = new Set<(typeof PRIMARY_PROTEINS)[number]>();

  for (const user of selectedUsers) {
    const prefs: UserPreferenceShape | undefined = user?.preferences;
    if (!prefs) continue;
    for (const id of prefs.allergyIngredientIds ?? [])
      allergyIngredientIds.add(id);
    for (const phrase of prefs.allergyPhrases ?? []) {
      const normalized = normalisePreferencePhrase(phrase);
      if (normalized) allergyPhrases.add(normalized);
    }
    for (const protein of prefs.excludedPrimaryProteins ?? []) {
      if ((PRIMARY_PROTEINS as readonly string[]).includes(protein)) {
        excludedPrimaryProteins.add(
          protein as (typeof PRIMARY_PROTEINS)[number],
        );
      }
    }
  }

  const snapshot = {
    allergyIngredientIds: Array.from(allergyIngredientIds),
    allergyPhrases: Array.from(allergyPhrases),
    excludedPrimaryProteins: Array.from(excludedPrimaryProteins),
  };

  const hasAnyFilters =
    snapshot.allergyIngredientIds.length > 0 ||
    snapshot.allergyPhrases.length > 0 ||
    snapshot.excludedPrimaryProteins.length > 0;

  return {
    includedMemberUserIds: validSelected,
    snapshot: hasAnyFilters ? snapshot : undefined,
  };
}

function resolveDefaultTargetServings(args: {
  requestedTargetServings: number | undefined;
  includedMemberUserIds: Id<"users">[] | undefined;
  subscriptionTier: string | undefined;
}): number {
  const canUseControl = canUseServingControl(args.subscriptionTier);
  const includedCount = args.includedMemberUserIds?.length ?? 0;
  if (canUseControl && args.requestedTargetServings !== undefined) {
    return clampTargetServings(args.requestedTargetServings);
  }
  if (includedCount > 0) return clampTargetServings(includedCount);
  return 1;
}

// ============================================================================
// HELPERS
// ============================================================================

function startOfDayMs(ms: number): number {
  const d = new Date(ms);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

function buildInclusiveWindow(
  startDate: number,
  dayCount: number,
): { startDate: number; endDate: number } {
  return {
    startDate,
    endDate: startOfDayMs(startDate + (dayCount - 1) * ONE_DAY_MS),
  };
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
    ? args.startDate !== undefined
      ? startOfDayMs(args.startDate)
      : nowStart
    : nowStart;
  const requestedDayCount = isEntitledToAdvancedControls
    ? (args.dayCount ?? MAX_DAYS_IN_MEAL_PLAN)
    : MAX_DAYS_IN_MEAL_PLAN;

  if (!Number.isInteger(requestedDayCount)) {
    throw new ConvexError("dayCount must be an integer");
  }

  if (requestedStart < nowStart) {
    throw new ConvexError("startDate cannot be before today");
  }
  const maxAllowedStart = nowStart + (MAX_DAYS_IN_MEAL_PLAN - 1) * ONE_DAY_MS;
  if (requestedStart > maxAllowedStart) {
    throw new ConvexError(
      `startDate cannot be more than ${MAX_DAYS_IN_MEAL_PLAN - 1} days ahead`,
    );
  }

  if (requestedDayCount < 1 || requestedDayCount > MAX_DAYS_IN_MEAL_PLAN) {
    throw new ConvexError(
      `dayCount must be between 1 and ${MAX_DAYS_IN_MEAL_PLAN}`,
    );
  }

  const { endDate } = buildInclusiveWindow(requestedStart, requestedDayCount);
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
    throw new ConvexError(
      MEAL_PLAN_ERRORS.PREMIUM_REQUIRED_MULTIPLE_MEAL_PLANS,
    );
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

function getPlanDayCount(plan: Doc<"mealPlans">): number {
  const planStart = plan.startDate ?? plan.endDate;
  return Math.max(1, Math.floor((plan.endDate - planStart) / ONE_DAY_MS) + 1);
}

function resolveRecipeTotalTimeMinutes(recipe: {
  totalTimeMinutes?: number | null;
  prepTime?: number | null;
  cookTime?: number | null;
}): number | null {
  if (
    recipe.totalTimeMinutes !== undefined &&
    recipe.totalTimeMinutes !== null
  ) {
    return recipe.totalTimeMinutes;
  }
  if (recipe.prepTime === undefined || recipe.prepTime === null) return null;
  if (recipe.cookTime === undefined || recipe.cookTime === null) return null;
  return recipe.prepTime + recipe.cookTime;
}

function assertValidEntryPlacement(args: {
  plan: Doc<"mealPlans">;
  date: number;
  order: number | undefined;
}) {
  const dateStart = startOfDayMs(args.date);
  const { plan } = args;
  if (plan.startDate !== undefined && dateStart < plan.startDate) {
    throw new ConvexError("Date must be on or after the plan start date");
  }
  if (dateStart > plan.endDate) {
    throw new ConvexError("Date must be on or before the plan end date");
  }
  if (args.order !== undefined) {
    if (!Number.isInteger(args.order)) {
      throw new ConvexError("Entry order must be an integer");
    }
    const planDayCount = getPlanDayCount(plan);
    if (args.order < 0 || args.order >= planDayCount) {
      throw new ConvexError(
        `Entry order must be between 0 and ${planDayCount - 1}`,
      );
    }
  }
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
function planOverlapsLocalDay(
  plan: Doc<"mealPlans">,
  entryMinDate: number | null,
  localDayStartMs: number,
): boolean {
  const planStart = effectivePlanStartMs(plan, entryMinDate);
  const planEndExclusive = plan.endDate + ONE_DAY_MS;
  const localEndExclusive = localDayStartMs + ONE_DAY_MS;
  return localDayStartMs < planEndExclusive && localEndExclusive > planStart;
}

/**
 * Treat plans starting soon as relevant for selection/listing so users can
 * immediately access newly-created plans that begin tomorrow/soon.
 */
function planIsRelevantForLocalDay(
  plan: Doc<"mealPlans">,
  entryMinDate: number | null,
  localDayStartMs: number,
): boolean {
  if (planOverlapsLocalDay(plan, entryMinDate, localDayStartMs)) return true;
  const planStart = effectivePlanStartMs(plan, entryMinDate);
  const soonCutoff = localDayStartMs + (MAX_DAYS_IN_MEAL_PLAN - 1) * ONE_DAY_MS;
  return planStart > localDayStartMs && planStart <= soonCutoff;
}

/**
 * Meal plans the user can see (index + dedupe) that are not superseded.
 * Overlap with “today” is applied after loading entry stats.
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

  const sharedPlanGroups = await Promise.all(
    householdIds.map((householdId) =>
      ctx.db
        .query("mealPlans")
        .withIndex("by_household_and_endDate", (q) =>
          q.eq("householdId", householdId).gte("endDate", indexGteEndDate),
        )
        .order("desc")
        .collect(),
    ),
  );
  const sharedPlans = sharedPlanGroups.flat();

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
  return Promise.all(
    plans.map(async (p) => {
      const entries = await ctx.db
        .query("mealPlanEntries")
        .withIndex("by_meal_plan", (q) => q.eq("mealPlanId", p._id))
        .collect();
      const dates = entries.map((e) => e.date);
      return {
        plan: p,
        entryCount: entries.length,
        entryMinDate: dates.length > 0 ? Math.min(...dates) : null,
        entryMaxDate: dates.length > 0 ? Math.max(...dates) : null,
        isOwner: p.userId === userId,
      };
    }),
  );
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
        planOverlapsLocalDay(s.plan, s.entryMinDate, localDayStartMs),
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

  type EntryRecipe = {
    _id: Id<"recipes">;
    title: string;
    image: string | null;
    ingredients: Doc<"recipes">["ingredients"];
    prepTime: number;
    cookTime: number | undefined;
    totalTimeMinutes: number;
    nutrition: Doc<"recipes">["nutrition"];
    category: string;
    primaryProtein: string | undefined;
  };
  const recipeCache = new Map<Id<"recipes">, EntryRecipe | null>();

  const entriesWithRecipes = await Promise.all(
    entries.map(async (entry) => {
      if (!recipeCache.has(entry.recipeId)) {
        const recipe = await ctx.db.get(entry.recipeId);
        if (!recipe) {
          recipeCache.set(entry.recipeId, null);
        } else {
          const image = recipe.image
            ? await ctx.storage.getUrl(recipe.image)
            : null;
          const totalTimeMinutes =
            recipe.totalTimeMinutes ??
            (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
          recipeCache.set(entry.recipeId, {
            _id: recipe._id,
            title: recipe.title,
            image,
            ingredients: recipe.ingredients,
            prepTime: recipe.prepTime ?? 0,
            cookTime: recipe.cookTime,
            totalTimeMinutes,
            nutrition: recipe.nutrition,
            category: recipe.category ?? "",
            primaryProtein: recipe.primaryProtein,
          });
        }
      }
      const recipe = recipeCache.get(entry.recipeId);
      if (!recipe) return { ...entry, recipe: null };

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
          image: recipe.image,
          ingredients: recipe.ingredients,
          prepTime: recipe.prepTime,
          cookTime: recipe.cookTime,
          totalTimeMinutes: recipe.totalTimeMinutes,
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
      planIsRelevantForLocalDay(s.plan, s.entryMinDate, refLocalStart),
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
      planIsRelevantForLocalDay(s.plan, s.entryMinDate, refLocalStart),
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

/**
 * Count owned plans that would block free-tier additional plan creation:
 * unreplaced plans with endDate >= today (UTC day start).
 */
export const getOwnedUnreplacedPlanCountForCreation = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return 0;
    const today = startOfDayMs(Date.now());
    const ownedPlans = await ctx.db
      .query("mealPlans")
      .withIndex("by_user_and_endDate", (q) =>
        q.eq("userId", user._id).gte("endDate", today),
      )
      .collect();
    return ownedPlans.filter((plan) => !plan.replacedByPlanId).length;
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
    includedMemberUserIds: v.optional(v.array(v.id("users"))),
    targetServings: v.optional(v.number()),
    quickMealsCount: v.optional(v.number()),
    quickMealsMaxMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const now = Date.now();
    const { startDate, endDate, dayCount } = resolveMealPlanWindow({
      startDate: args.startDate,
      dayCount: args.dayCount,
      subscriptionTier: user.subscriptionTier,
    });
    const wantsQuickMeals = args.quickMealsCount !== undefined;
    if (wantsQuickMeals && !canUseQuickMealPreferences(user.subscriptionTier)) {
      throw new ConvexError(MEAL_PLAN_ERRORS.PREMIUM_REQUIRED_QUICK_MEALS);
    }
    if (wantsQuickMeals) {
      if (
        !Number.isInteger(args.quickMealsCount) ||
        (args.quickMealsCount ?? 0) < 1
      ) {
        throw new ConvexError(
          "quickMealsCount must be a positive whole number",
        );
      }
      if ((args.quickMealsCount ?? 0) > dayCount) {
        throw new ConvexError("quickMealsCount cannot exceed dayCount");
      }
      if (!Number.isInteger(args.quickMealsMaxMinutes)) {
        throw new ConvexError("quickMealsMaxMinutes must be a whole number");
      }
      if ((args.quickMealsMaxMinutes ?? 0) < QUICK_MEALS_MIN_MINUTES) {
        throw new ConvexError(
          `quickMealsMaxMinutes must be at least ${QUICK_MEALS_MIN_MINUTES}`,
        );
      }
    }
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
    const preferenceConstraints = await resolveGenerationPreferenceConstraints({
      ctx,
      ownerUserId: user._id,
      householdId: shareHouseholdId,
      includedMemberUserIds: args.includedMemberUserIds,
      subscriptionTier: user.subscriptionTier,
    });
    const targetServings = resolveDefaultTargetServings({
      requestedTargetServings: args.targetServings,
      includedMemberUserIds: preferenceConstraints.includedMemberUserIds,
      subscriptionTier: user.subscriptionTier,
    });

    const leftover = prepareLeftoverInputs(
      args.leftoverIngredientIds?.filter(Boolean) as
        | Id<"ingredients">[]
        | undefined,
      args.leftoverIngredientPhrases,
    );
    const wantsLeftovers = leftover.wantsLeftovers;
    if (wantsLeftovers && !canUseLeftoverIngredients(user.subscriptionTier)) {
      throw new ConvexError(
        MEAL_PLAN_ERRORS.PREMIUM_REQUIRED_LEFTOVER_INGREDIENTS,
      );
    }

    const generationSeed = `gen-${now}-${Math.random().toString(36).slice(2, 11)}`;

    const actorType = "user";
    const actorId = user._id;

    const recentlySuggested = await getRecentlySuggested(
      ctx,
      actorType,
      actorId,
      RECENTLY_SUGGESTED_DAYS,
    );
    const actorStats = await getBehaviourStatsForActor(ctx, actorType, actorId);
    const selectFromPool = (
      pool: PoolRecipe[],
      excludeRecency: Set<Id<"recipes">>,
      seedPrefix: string,
    ): {
      selectedIds: Id<"recipes">[];
      failureReason?: "quick_meals" | "selection";
    } => {
      if (
        wantsQuickMeals &&
        args.quickMealsCount !== undefined &&
        args.quickMealsMaxMinutes !== undefined
      ) {
        const quickPool = pool.filter((recipe) => {
          const totalTime = resolveRecipeTotalTimeMinutes(recipe);
          return totalTime !== null && totalTime <= args.quickMealsMaxMinutes!;
        });
        if (quickPool.length < args.quickMealsCount) {
          return { selectedIds: [], failureReason: "quick_meals" };
        }
        const quickIds = selectRecipes(
          quickPool,
          args.quickMealsCount,
          actorStats,
          `${seedPrefix}:quick`,
          excludeRecency,
          [],
        );
        if (quickIds.length < args.quickMealsCount) {
          return { selectedIds: [], failureReason: "quick_meals" };
        }
        const quickIdSet = new Set(quickIds);
        const remainderPool = pool.filter((recipe) => !quickIdSet.has(recipe._id));
        const remainderIds = selectRecipes(
          remainderPool,
          dayCount - quickIds.length,
          actorStats,
          `${seedPrefix}:remainder`,
          new Set<Id<"recipes">>([...excludeRecency, ...quickIds]),
          quickPool.filter((recipe) => quickIdSet.has(recipe._id)),
        );
        if (remainderIds.length !== dayCount - quickIds.length) {
          return { selectedIds: [], failureReason: "quick_meals" };
        }
        return { selectedIds: [...quickIds, ...remainderIds] };
      }

      const selectedIds = selectRecipes(
        pool,
        dayCount,
        actorStats,
        seedPrefix,
        excludeRecency,
        [],
      );
      if (selectedIds.length !== dayCount) {
        return { selectedIds: [], failureReason: "selection" };
      }
      return { selectedIds };
    };

    const fullPreferencePool = await buildPool(ctx, user._id, shareHouseholdId ?? null, {
      leftoverTargetIds: wantsLeftovers ? leftover.ids : undefined,
      leftoverTargetPhrases: wantsLeftovers ? leftover.phrases : undefined,
      preferenceConstraints: preferenceConstraints.snapshot,
    });
    const fullAttempt = selectFromPool(
      fullPreferencePool,
      recentlySuggested,
      `${generationSeed}:full`,
    );

    let selectedIds = fullAttempt.selectedIds;
    let selectedPool = fullPreferencePool;
    let fallbackStage: "recency_relaxed" | "non_allergy_relaxed" | undefined;
    let allergiesOnlyPool: PoolRecipe[] | null = null;

    if (selectedIds.length === 0) {
      const recencyRelaxedAttempt = selectFromPool(
        fullPreferencePool,
        new Set<Id<"recipes">>(),
        `${generationSeed}:recency_relaxed`,
      );
      if (recencyRelaxedAttempt.selectedIds.length > 0) {
        selectedIds = recencyRelaxedAttempt.selectedIds;
        selectedPool = fullPreferencePool;
        fallbackStage = "recency_relaxed";
      } else if (preferenceConstraints.snapshot) {
        const allergiesOnlyConstraints = {
          allergyIngredientIds:
            preferenceConstraints.snapshot.allergyIngredientIds,
          allergyPhrases: preferenceConstraints.snapshot.allergyPhrases,
          excludedPrimaryProteins: [] as (typeof PRIMARY_PROTEINS)[number][],
        };
        allergiesOnlyPool = await buildPool(ctx, user._id, shareHouseholdId ?? null, {
          leftoverTargetIds: wantsLeftovers ? leftover.ids : undefined,
          leftoverTargetPhrases: wantsLeftovers ? leftover.phrases : undefined,
          preferenceConstraints: allergiesOnlyConstraints,
        });
        const nonAllergyRelaxedAttempt = selectFromPool(
          allergiesOnlyPool,
          new Set<Id<"recipes">>(),
          `${generationSeed}:non_allergy_relaxed`,
        );
        if (nonAllergyRelaxedAttempt.selectedIds.length > 0) {
          selectedIds = nonAllergyRelaxedAttempt.selectedIds;
          selectedPool = allergiesOnlyPool;
          fallbackStage = "non_allergy_relaxed";
        }
      }
    }

    if (selectedIds.length === 0) {
      const diagnostics = {
        fullPoolSize: fullPreferencePool.length,
        recencyExcludedCount: recentlySuggested.size,
        allergiesOnlyPoolSize: allergiesOnlyPool?.length ?? null,
        fullAttemptReason: fullAttempt.failureReason ?? "unknown",
      };
      console.warn(
        "[mealPlans:generateWeeklyPlan] no eligible recipes after fallback",
        diagnostics,
      );

      if (
        fullAttempt.failureReason === "quick_meals" ||
        (fullPreferencePool.length > 0 &&
          wantsQuickMeals &&
          args.quickMealsCount !== undefined &&
          args.quickMealsMaxMinutes !== undefined)
      ) {
        throw new ConvexError(MEAL_PLAN_ERRORS.QUICK_MEALS_NO_RECIPES);
      }

      if (preferenceConstraints.snapshot && (allergiesOnlyPool?.length ?? 0) === 0) {
        throw new ConvexError(MEAL_PLAN_ERRORS.HOUSEHOLD_PREFERENCES_NO_RECIPES);
      }
      throw new ConvexError("No eligible recipes matched your current constraints");
    }

    let bestMatchInPool = 0;
    if (wantsLeftovers) {
      for (const p of selectedPool) {
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
      ...(preferenceConstraints.includedMemberUserIds
        ? { includedMemberUserIds: preferenceConstraints.includedMemberUserIds }
        : {}),
      ...(preferenceConstraints.snapshot
        ? { preferenceFilterSnapshot: preferenceConstraints.snapshot }
        : {}),
      ...(wantsQuickMeals &&
      args.quickMealsCount !== undefined &&
      args.quickMealsMaxMinutes !== undefined
        ? {
            quickMealsCount: args.quickMealsCount,
            quickMealsMaxMinutes: args.quickMealsMaxMinutes,
          }
        : {}),
      targetServings,
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
      ...(fallbackStage
        ? {
            generationFallback: {
              stage: fallbackStage,
            },
          }
        : {}),
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
    targetServings: v.optional(v.number()),
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
      targetServings: resolveDefaultTargetServings({
        requestedTargetServings: args.targetServings,
        includedMemberUserIds: undefined,
        subscriptionTier: user.subscriptionTier,
      }),
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
    targetServings: v.optional(v.number()),
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
      throw new ConvexError(
        MEAL_PLAN_ERRORS.PREMIUM_REQUIRED_LEFTOVER_INGREDIENTS,
      );
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
    const lockedSorted = [...locked]
      .filter(
        (e) =>
          Number.isInteger(e.order) &&
          (e.order ?? -1) >= 0 &&
          (e.order ?? MAX_DAYS_IN_MEAL_PLAN) < MAX_DAYS_IN_MEAL_PLAN,
      )
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    const now = Date.now();
    const { startDate, endDate } = buildInclusiveWindow(
      startOfDayMs(now),
      MAX_DAYS_IN_MEAL_PLAN,
    );
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
      ...(previousPlan.includedMemberUserIds
        ? { includedMemberUserIds: previousPlan.includedMemberUserIds }
        : {}),
      ...(previousPlan.preferenceFilterSnapshot
        ? { preferenceFilterSnapshot: previousPlan.preferenceFilterSnapshot }
        : {}),
      ...(previousPlan.quickMealsCount !== undefined &&
      previousPlan.quickMealsMaxMinutes !== undefined
        ? {
            quickMealsCount: previousPlan.quickMealsCount,
            quickMealsMaxMinutes: previousPlan.quickMealsMaxMinutes,
          }
        : {}),
      targetServings: resolveDefaultTargetServings({
        requestedTargetServings: args.targetServings,
        includedMemberUserIds: previousPlan.includedMemberUserIds,
        subscriptionTier: user.subscriptionTier,
      }),
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
          preferenceConstraints: previousPlan.preferenceFilterSnapshot,
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

      let newIds: Id<"recipes">[] = [];
      if (
        previousPlan.quickMealsCount !== undefined &&
        previousPlan.quickMealsMaxMinutes !== undefined
      ) {
        const quickTargetCount = Math.min(
          previousPlan.quickMealsCount,
          toSelect,
        );
        const quickPool = pool.filter((recipe) => {
          const totalTime = resolveRecipeTotalTimeMinutes(recipe);
          return (
            totalTime !== null &&
            totalTime <= previousPlan.quickMealsMaxMinutes!
          );
        });
        if (quickPool.length < quickTargetCount) {
          throw new ConvexError(MEAL_PLAN_ERRORS.QUICK_MEALS_NO_RECIPES);
        }
        const quickIds = selectRecipes(
          quickPool,
          quickTargetCount,
          actorStats,
          `${generationSeed}:quick`,
          recentlySuggested,
          lockedPoolRecipes,
        );
        if (quickIds.length < quickTargetCount) {
          throw new ConvexError(MEAL_PLAN_ERRORS.QUICK_MEALS_NO_RECIPES);
        }
        const quickIdSet = new Set(quickIds);
        const remainderPool = pool.filter(
          (recipe) => !quickIdSet.has(recipe._id),
        );
        const remainderTarget = toSelect - quickIds.length;
        const remainderIds = selectRecipes(
          remainderPool,
          remainderTarget,
          actorStats,
          `${generationSeed}:remainder`,
          new Set<Id<"recipes">>([...recentlySuggested, ...quickIds]),
          [
            ...lockedPoolRecipes,
            ...quickPool.filter((r) => quickIdSet.has(r._id)),
          ],
        );
        if (remainderIds.length !== remainderTarget) {
          throw new ConvexError(MEAL_PLAN_ERRORS.QUICK_MEALS_NO_RECIPES);
        }
        newIds = [...quickIds, ...remainderIds];
      } else {
        newIds = selectRecipes(
          pool,
          toSelect,
          actorStats,
          generationSeed,
          recentlySuggested,
          lockedPoolRecipes,
        );
      }

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
    assertValidEntryPlacement({ plan, date: args.date, order: args.order });
    const dateStart = startOfDayMs(args.date);
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
      assertValidEntryPlacement({
        plan,
        date: args.date,
        order: args.order ?? entry.order,
      });
      const dateStart = startOfDayMs(args.date);
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
    if (args.order !== undefined) {
      assertValidEntryPlacement({
        plan,
        date: args.date ?? entry.date,
        order: args.order,
      });
      updates.order = args.order;
    }
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

    const entries = await ctx.db
      .query("mealPlanEntries")
      .withIndex("by_meal_plan", (q) => q.eq("mealPlanId", args.mealPlanId))
      .collect();

    const planDayCount = getPlanDayCount(plan);
    if (entries.length > planDayCount) {
      throw new ConvexError(
        "This plan has more meals than available days. Remove extras or increase plan days before saving.",
      );
    }

    const planStart = plan.startDate ?? plan.endDate;
    const orderedEntries = [...entries].sort(
      (a, b) =>
        (a.order ?? Number.MAX_SAFE_INTEGER) -
          (b.order ?? Number.MAX_SAFE_INTEGER) ||
        a.date - b.date ||
        a._creationTime - b._creationTime,
    );

    for (let i = 0; i < orderedEntries.length; i++) {
      const entry = orderedEntries[i]!;
      const expectedDate = startOfDayMs(planStart + i * ONE_DAY_MS);
      if (entry.date !== expectedDate || entry.order !== i) {
        await ctx.db.patch(entry._id, {
          date: expectedDate,
          order: i,
        });
      }
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
