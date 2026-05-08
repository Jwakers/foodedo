"use client";

import type { RecipeListItem } from "./types";
import {
  getRecipeQuickFilter,
  isRecipeQuickFilterKey,
  type RecipeQuickFilterKey,
} from "./quick-filters";
import type { RecipeListServerFilter } from "convex/lib/recipeListFilters";
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

export function toRecipeListServerFilter(
  filterState: RecipeCoreFilterState,
): RecipeListServerFilter {
  return {
    searchQuery: filterState.searchQuery,
    selectedCategory: filterState.selectedCategory,
    selectedProtein: filterState.selectedProtein,
    selectedDuration: filterState.selectedDuration as
      | "all"
      | "under-30"
      | "30-60"
      | "60-plus",
    selectedComplexity: filterState.selectedComplexity,
    selectedQuickFilters: filterState.selectedQuickFilters,
  };
}

const FILTER_QUERY_KEYS = {
  search: "q",
  category: "category",
  protein: "protein",
  duration: "duration",
  complexity: "complexity",
  quick: "quick",
} as const;

export function recipeFilterStateFromSearchParams(searchParams: {
  get(key: string): string | null;
  getAll?(key: string): string[];
}): RecipeCoreFilterState {
  const parseQuick = () => {
    if (typeof searchParams.getAll === "function") {
      return searchParams
        .getAll(FILTER_QUERY_KEYS.quick)
        .filter(isRecipeQuickFilterKey);
    }
    const raw = searchParams.get(FILTER_QUERY_KEYS.quick);
    if (!raw) return [];
    return raw
      .split(",")
      .map((value) => value.trim())
      .filter(isRecipeQuickFilterKey);
  };

  return {
    searchQuery: searchParams.get(FILTER_QUERY_KEYS.search) ?? "",
    selectedCategory: searchParams.get(FILTER_QUERY_KEYS.category) ?? "all",
    selectedProtein: searchParams.get(FILTER_QUERY_KEYS.protein) ?? "all",
    selectedDuration: searchParams.get(FILTER_QUERY_KEYS.duration) ?? "all",
    selectedComplexity: searchParams.get(FILTER_QUERY_KEYS.complexity) ?? "all",
    selectedQuickFilters: parseQuick(),
  };
}

export function applyRecipeFilterStateToSearchParams(
  filterState: RecipeCoreFilterState,
  params: URLSearchParams,
): URLSearchParams {
  const next = new URLSearchParams(params.toString());

  if (filterState.searchQuery.trim()) {
    next.set(FILTER_QUERY_KEYS.search, filterState.searchQuery.trim());
  } else {
    next.delete(FILTER_QUERY_KEYS.search);
  }

  if (filterState.selectedCategory !== "all") {
    next.set(FILTER_QUERY_KEYS.category, filterState.selectedCategory);
  } else {
    next.delete(FILTER_QUERY_KEYS.category);
  }

  if (filterState.selectedProtein !== "all") {
    next.set(FILTER_QUERY_KEYS.protein, filterState.selectedProtein);
  } else {
    next.delete(FILTER_QUERY_KEYS.protein);
  }

  if (filterState.selectedDuration !== "all") {
    next.set(FILTER_QUERY_KEYS.duration, filterState.selectedDuration);
  } else {
    next.delete(FILTER_QUERY_KEYS.duration);
  }

  if (filterState.selectedComplexity !== "all") {
    next.set(FILTER_QUERY_KEYS.complexity, filterState.selectedComplexity);
  } else {
    next.delete(FILTER_QUERY_KEYS.complexity);
  }

  next.delete(FILTER_QUERY_KEYS.quick);
  for (const quick of filterState.selectedQuickFilters) {
    next.append(FILTER_QUERY_KEYS.quick, quick);
  }

  return next;
}
