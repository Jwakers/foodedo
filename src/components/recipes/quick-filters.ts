import type { RecipeListItem } from "./types";
import { isUnder30Minutes } from "./recipe-time";
import {
  RECIPE_QUICK_FILTER_VALUES,
  type RecipeQuickFilterValue,
} from "convex/lib/recipeListFilters";

export const QUICK_FILTER_KEYS = RECIPE_QUICK_FILTER_VALUES;

export type RecipeQuickFilterKey = RecipeQuickFilterValue;

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
    matches: (recipe) => isUnder30Minutes(recipe),
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
