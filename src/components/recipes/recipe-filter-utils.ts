"use client";

import type { RecipeListItem } from "./types";
import {
  getRecipeQuickFilter,
  isRecipeQuickFilterKey,
  type RecipeQuickFilterKey,
} from "./quick-filters";
import { getRecipeTotalMinutes, isUnder30Minutes } from "./recipe-time";

export type RecipeCoreFilterState = {
  searchQuery: string;
  selectedCategory: string;
  selectedProtein: string;
  selectedDuration: string;
  selectedComplexity: string;
  selectedQuickFilters: RecipeQuickFilterKey[];
};

export const initialRecipeCoreFilterState: RecipeCoreFilterState = {
  searchQuery: "",
  selectedCategory: "all",
  selectedProtein: "all",
  selectedDuration: "all",
  selectedComplexity: "all",
  selectedQuickFilters: [],
};

export function matchesRecipeDuration(
  recipe: RecipeListItem,
  duration: string,
): boolean {
  if (duration === "all") return true;
  switch (duration) {
    case "under-30":
      // Exclude total === 0: treat missing/zero time as unknown, not "under 30"
      return isUnder30Minutes(recipe);
    case "30-60": {
      const total = getRecipeTotalMinutes(recipe);
      return total >= 30 && total <= 60;
    }
    case "60-plus": {
      const total = getRecipeTotalMinutes(recipe);
      return total > 60;
    }
    default:
      return false;
  }
}

export function applyRecipeCoreFilters<T extends RecipeListItem>(
  recipes: T[] | undefined,
  filterState: RecipeCoreFilterState,
): T[] {
  if (!recipes) return [];
  const normalizedSearch = filterState.searchQuery.trim().toLowerCase();
  const activeQuickFilters = filterState.selectedQuickFilters
    .filter(isRecipeQuickFilterKey)
    .map((key) => getRecipeQuickFilter(key));

  return recipes.filter((recipe) => {
    const matchesQuickFilters =
      activeQuickFilters.length === 0 ||
      activeQuickFilters.some((filter) => filter.matches(recipe));
    const matchesSearch =
      recipe.title.toLowerCase().includes(normalizedSearch) ||
      (recipe.description ?? "").toLowerCase().includes(normalizedSearch);
    const matchesCategory =
      filterState.selectedCategory === "all" ||
      recipe.category === filterState.selectedCategory;
    const matchesProtein =
      filterState.selectedProtein === "all" ||
      (recipe.primaryProtein ?? "other") === filterState.selectedProtein;
    const matchesDuration = matchesRecipeDuration(
      recipe,
      filterState.selectedDuration,
    );
    const matchesComplexity =
      filterState.selectedComplexity === "all" ||
      (recipe.complexityTier ?? "") === filterState.selectedComplexity;

    return (
      matchesQuickFilters &&
      matchesSearch &&
      matchesCategory &&
      matchesProtein &&
      matchesDuration &&
      matchesComplexity
    );
  });
}
