import type { RecipeListItem } from "./types";
import { getRecipeTotalMinutes } from "./recipe-time";

export const QUICK_FILTER_KEYS = [
  "vegetarian",
  "vegan",
  "quick",
  "simple",
  "dinner",
] as const;

export type RecipeQuickFilterKey = (typeof QUICK_FILTER_KEYS)[number];

export type RecipeQuickFilterDefinition = {
  key: RecipeQuickFilterKey;
  label: string;
  matches: (recipe: RecipeListItem) => boolean;
};

export const RECIPE_QUICK_FILTERS: readonly RecipeQuickFilterDefinition[] = [
  {
    key: "vegetarian",
    label: "Vegetarian",
    matches: (recipe) => recipe.primaryProtein === "vegetarian",
  },
  {
    key: "vegan",
    label: "Vegan",
    matches: (recipe) => recipe.primaryProtein === "vegan",
  },
  {
    key: "quick",
    label: "Quick",
    matches: (recipe) => {
      const total = getRecipeTotalMinutes(recipe);
      return total > 0 && total < 30;
    },
  },
  {
    key: "simple",
    label: "Simple",
    matches: (recipe) => recipe.complexityTier === "simple",
  },
  {
    key: "dinner",
    label: "Dinner",
    matches: (recipe) => recipe.category === "dinner",
  },
];

const quickFilterMap: Record<RecipeQuickFilterKey, RecipeQuickFilterDefinition> =
  Object.fromEntries(
    RECIPE_QUICK_FILTERS.map((filter) => [filter.key, filter]),
  ) as Record<RecipeQuickFilterKey, RecipeQuickFilterDefinition>;

export function isRecipeQuickFilterKey(value: string): value is RecipeQuickFilterKey {
  return Object.prototype.hasOwnProperty.call(quickFilterMap, value);
}

export function getRecipeQuickFilter(
  key: RecipeQuickFilterKey,
): RecipeQuickFilterDefinition {
  return quickFilterMap[key];
}
