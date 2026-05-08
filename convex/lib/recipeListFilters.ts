import {
  COMPLEXITY_TIERS,
  PRIMARY_PROTEINS,
  RECIPE_CATEGORIES,
} from "./constants";

export const RECIPE_QUICK_FILTER_VALUES = [
  "vegetarian",
  "vegan",
  "quick",
  "simple",
  "dinner",
] as const;

export type RecipeQuickFilterValue =
  (typeof RECIPE_QUICK_FILTER_VALUES)[number];

export const RECIPE_DURATION_FILTER_VALUES = [
  "all",
  "under-30",
  "30-60",
  "60-plus",
] as const;

export type RecipeDurationFilterValue =
  (typeof RECIPE_DURATION_FILTER_VALUES)[number];

export type RecipeCategoryFilterValue =
  | "all"
  | (typeof RECIPE_CATEGORIES)[number];
export type RecipeProteinFilterValue =
  | "all"
  | (typeof PRIMARY_PROTEINS)[number];
export type RecipeComplexityFilterValue =
  | "all"
  | (typeof COMPLEXITY_TIERS)[number];

export type RecipeListServerFilter = {
  searchQuery?: string;
  selectedCategory?: RecipeCategoryFilterValue;
  selectedProtein?: RecipeProteinFilterValue;
  selectedDuration?: RecipeDurationFilterValue;
  selectedComplexity?: RecipeComplexityFilterValue;
  selectedQuickFilters?: RecipeQuickFilterValue[];
};

export type NormalizedRecipeListServerFilter = {
  searchQuery: string;
  selectedCategory: RecipeCategoryFilterValue;
  selectedProtein: RecipeProteinFilterValue;
  selectedDuration: RecipeDurationFilterValue;
  selectedComplexity: RecipeComplexityFilterValue;
  selectedQuickFilters: RecipeQuickFilterValue[];
};

export type RecipeListFilterable = {
  title: string;
  description?: string | null;
  category?: string | null;
  primaryProtein?: string | null;
  complexityTier?: string | null;
  prepTime?: number | null;
  cookTime?: number | null;
  totalTimeMinutes?: number | null;
};

const DEFAULT_FILTER: NormalizedRecipeListServerFilter = {
  searchQuery: "",
  selectedCategory: "all",
  selectedProtein: "all",
  selectedDuration: "all",
  selectedComplexity: "all",
  selectedQuickFilters: [],
};

function uniqueQuickFilters(
  values: readonly RecipeQuickFilterValue[],
): RecipeQuickFilterValue[] {
  return [...new Set(values)];
}

export function normalizeRecipeListServerFilter(
  filter: RecipeListServerFilter | null | undefined,
): NormalizedRecipeListServerFilter {
  if (!filter) {
    return DEFAULT_FILTER;
  }

  const selectedDuration = RECIPE_DURATION_FILTER_VALUES.includes(
    (filter.selectedDuration ?? "all") as RecipeDurationFilterValue,
  )
    ? (filter.selectedDuration as RecipeDurationFilterValue)
    : "all";

  const selectedQuickFilters = uniqueQuickFilters(
    (filter.selectedQuickFilters ?? []).filter(
      (value): value is RecipeQuickFilterValue =>
        RECIPE_QUICK_FILTER_VALUES.includes(value),
    ),
  );

  return {
    searchQuery: (filter.searchQuery ?? "").trim().toLowerCase(),
    selectedCategory: filter.selectedCategory ?? "all",
    selectedProtein: filter.selectedProtein ?? "all",
    selectedDuration,
    selectedComplexity: filter.selectedComplexity ?? "all",
    selectedQuickFilters,
  };
}

export function toRecipeListServerFilter(
  filter: NormalizedRecipeListServerFilter,
): RecipeListServerFilter {
  return {
    searchQuery: filter.searchQuery,
    selectedCategory: filter.selectedCategory,
    selectedProtein: filter.selectedProtein,
    selectedDuration: filter.selectedDuration,
    selectedComplexity: filter.selectedComplexity,
    selectedQuickFilters: filter.selectedQuickFilters,
  };
}

function getRecipeTotalMinutes(recipe: RecipeListFilterable): number {
  const total = recipe.totalTimeMinutes;
  if (typeof total === "number" && total > 0) {
    return total;
  }
  return (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
}

function matchesDuration(
  recipe: RecipeListFilterable,
  duration: RecipeDurationFilterValue,
): boolean {
  if (duration === "all") return true;

  const total = getRecipeTotalMinutes(recipe);
  switch (duration) {
    case "under-30":
      return total > 0 && total < 30;
    case "30-60":
      return total >= 30 && total <= 60;
    case "60-plus":
      return total > 60;
    default:
      return true;
  }
}

function matchesQuickFilter(
  recipe: RecipeListFilterable,
  filter: RecipeQuickFilterValue,
): boolean {
  switch (filter) {
    case "vegetarian":
      return recipe.primaryProtein === "vegetarian";
    case "vegan":
      return recipe.primaryProtein === "vegan";
    case "quick":
      return matchesDuration(recipe, "under-30");
    case "simple":
      return recipe.complexityTier === "simple";
    case "dinner":
      return recipe.category === "dinner";
    default:
      return false;
  }
}

export function recipeMatchesServerFilter(
  recipe: RecipeListFilterable,
  filter: RecipeListServerFilter | null | undefined,
): boolean {
  const normalized = normalizeRecipeListServerFilter(filter);

  const matchesQuickFilters =
    normalized.selectedQuickFilters.length === 0 ||
    normalized.selectedQuickFilters.some((quickFilter) =>
      matchesQuickFilter(recipe, quickFilter),
    );

  const title = recipe.title.toLowerCase();
  const description = (recipe.description ?? "").toLowerCase();
  const matchesSearch =
    normalized.searchQuery.length === 0 ||
    title.includes(normalized.searchQuery) ||
    description.includes(normalized.searchQuery);

  const matchesCategory =
    normalized.selectedCategory === "all" ||
    recipe.category === normalized.selectedCategory;
  const matchesProtein =
    normalized.selectedProtein === "all" ||
    (recipe.primaryProtein ?? "other") === normalized.selectedProtein;
  const matchesComplexity =
    normalized.selectedComplexity === "all" ||
    (recipe.complexityTier ?? "") === normalized.selectedComplexity;
  const matchesTime = matchesDuration(recipe, normalized.selectedDuration);

  return (
    matchesQuickFilters &&
    matchesSearch &&
    matchesCategory &&
    matchesProtein &&
    matchesComplexity &&
    matchesTime
  );
}
