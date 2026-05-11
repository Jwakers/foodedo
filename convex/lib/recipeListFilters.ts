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
  ingredients?: { name?: string | null }[] | null;
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

function matchesSearchQuery(
  recipe: RecipeListFilterable,
  searchQuery: string,
): boolean {
  return searchQuery.length === 0 || getRecipeSearchScore(recipe, searchQuery) >= 0;
}

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function tokenizeSearchQuery(searchQuery: string): string[] {
  return searchQuery
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

function expandSearchToken(token: string): string[] {
  const variants = new Set<string>([token]);
  if (token.endsWith("es") && token.length > 3) {
    variants.add(token.slice(0, -2));
  }
  if (token.endsWith("s") && token.length > 2) {
    variants.add(token.slice(0, -1));
  }
  return Array.from(variants);
}

function includesAnyTokenVariant(text: string, token: string): boolean {
  const variants = expandSearchToken(token);
  return variants.some((variant) => text.includes(variant));
}

export function getRecipeSearchScore(
  recipe: RecipeListFilterable,
  searchQuery: string,
): number {
  const normalizedQuery = normalizeSearchText(searchQuery);
  if (normalizedQuery.length === 0) return 0;

  const title = normalizeSearchText(recipe.title);
  const description = normalizeSearchText(recipe.description ?? "");
  const ingredients = normalizeSearchText(
    (recipe.ingredients ?? [])
      .map((ingredient) => ingredient?.name ?? "")
      .join(" "),
  );
  const tokens = tokenizeSearchQuery(normalizedQuery);
  if (tokens.length === 0) return 0;

  const tokenMatched = tokens.every((token) => {
    return (
      includesAnyTokenVariant(title, token) ||
      includesAnyTokenVariant(description, token) ||
      includesAnyTokenVariant(ingredients, token)
    );
  });
  if (!tokenMatched) return -1;

  let score = 0;
  if (title === normalizedQuery) score += 120;
  else if (title.startsWith(normalizedQuery)) score += 80;
  else if (title.includes(normalizedQuery)) score += 60;

  if (ingredients.includes(normalizedQuery)) score += 45;
  if (description.includes(normalizedQuery)) score += 30;

  for (const token of tokens) {
    if (title.startsWith(token)) score += 18;
    else if (title.includes(token)) score += 12;

    if (ingredients.includes(token)) score += 10;
    if (description.includes(token)) score += 6;
  }

  return score;
}

export function sortRecipesBySearchScore<T extends RecipeListFilterable>(
  recipes: T[],
  filter: RecipeListServerFilter | NormalizedRecipeListServerFilter | undefined,
): T[] {
  const normalized =
    filter && "selectedCategory" in filter
      ? (filter as NormalizedRecipeListServerFilter)
      : normalizeRecipeListServerFilter(filter as RecipeListServerFilter | undefined);
  if (normalized.searchQuery.length === 0 || recipes.length <= 1) {
    return recipes;
  }

  return recipes
    .map((recipe, index) => ({
      recipe,
      index,
      score: getRecipeSearchScore(recipe, normalized.searchQuery),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.index - b.index;
    })
    .map((entry) => entry.recipe);
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

  const matchesSearch = matchesSearchQuery(recipe, normalized.searchQuery);

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

export function recipeMatchesServerFilterIgnoringSearch(
  recipe: RecipeListFilterable,
  filter: RecipeListServerFilter | null | undefined,
): boolean {
  const normalized = normalizeRecipeListServerFilter(filter);
  const noSearchFilter: NormalizedRecipeListServerFilter = {
    ...normalized,
    searchQuery: "",
  };
  return recipeMatchesServerFilter(recipe, noSearchFilter);
}
