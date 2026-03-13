"use client";

import type { RecipeListItem } from "./types";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";

// ---------------------------------------------------------------------------
// Tab constants and derivation (shared with page and tab switcher)
// ---------------------------------------------------------------------------

export const TAB_PARAM = "tab";
export const TAB_DISCOVER = "discover";
export const TAB_MY_RECIPES = "my-recipes";

export type RecipeListingTab = "my-recipes" | "discover";

export function getCurrentTab(searchParams: {
  get(key: string): string | null;
}): RecipeListingTab {
  return searchParams.get(TAB_PARAM) === TAB_DISCOVER
    ? TAB_DISCOVER
    : TAB_MY_RECIPES;
}

// ---------------------------------------------------------------------------
// Filter helpers
// ---------------------------------------------------------------------------

function getRecipeTotalMinutes(recipe: RecipeListItem): number {
  if (recipe.totalTimeMinutes != null && recipe.totalTimeMinutes > 0) {
    return recipe.totalTimeMinutes;
  }
  return (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
}

function matchesDuration(recipe: RecipeListItem, duration: string): boolean {
  if (duration === "all") return true;
  const total = getRecipeTotalMinutes(recipe);
  switch (duration) {
    case "under-30":
      // Exclude total === 0: treat missing/zero time as unknown, not "under 30"
      return total > 0 && total < 30;
    case "30-60":
      return total >= 30 && total <= 60;
    case "60-plus":
      return total > 60;
    default:
      return true;
  }
}

function filterRecipes(
  recipes: RecipeListItem[] | undefined,
  filterState: RecipeListingFilterState,
): RecipeListItem[] {
  if (!recipes) return [];
  const normalizedSearch = filterState.searchQuery.trim().toLowerCase();
  return recipes.filter((recipe) => {
    const matchesSearch =
      recipe.title.toLowerCase().includes(normalizedSearch) ||
      (recipe.description ?? "").toLowerCase().includes(normalizedSearch);
    const matchesCategory =
      filterState.selectedCategory === "all" ||
      recipe.category === filterState.selectedCategory;
    const matchesProtein =
      filterState.selectedProtein === "all" ||
      (recipe.primaryProtein ?? "other") === filterState.selectedProtein;
    const matchesDurationFilter = matchesDuration(
      recipe,
      filterState.selectedDuration,
    );
    const matchesComplexity =
      filterState.selectedComplexity === "all" ||
      (recipe.complexityTier ?? "") === filterState.selectedComplexity;
    return (
      matchesSearch &&
      matchesCategory &&
      matchesProtein &&
      matchesDurationFilter &&
      matchesComplexity
    );
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RecipeListingFilterState = {
  searchQuery: string;
  selectedCategory: string;
  selectedProtein: string;
  selectedDuration: string;
  selectedComplexity: string;
};

const initialFilterState: RecipeListingFilterState = {
  searchQuery: "",
  selectedCategory: "all",
  selectedProtein: "all",
  selectedDuration: "all",
  selectedComplexity: "all",
};

export type RecipeListingContextValue = {
  recipes: RecipeListItem[] | undefined;
  filteredRecipes: RecipeListItem[];
  filterState: RecipeListingFilterState;
  setSearchQuery: (v: string) => void;
  setSelectedCategory: (v: string) => void;
  setSelectedProtein: (v: string) => void;
  setSelectedDuration: (v: string) => void;
  setSelectedComplexity: (v: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  isTabbedMode: boolean;
  currentTab: RecipeListingTab | null;
  /** When true, recipe card images use Next.js Image optimization (system recipes only). */
  optimizeImage: boolean;
};

const RecipeListingContext = createContext<RecipeListingContextValue | null>(
  null,
);

// ---------------------------------------------------------------------------
// Provider – single view (recipes only) or tabbed (myRecipes + systemRecipes, tab from URL)
// ---------------------------------------------------------------------------

type RecipeListingProviderPropsSingle = {
  recipes: RecipeListItem[] | undefined;
  children: ReactNode;
};

type RecipeListingProviderPropsTabbed = {
  myRecipes: RecipeListItem[] | undefined;
  systemRecipes: RecipeListItem[] | undefined;
  children: ReactNode;
};

export type RecipeListingProviderProps =
  | RecipeListingProviderPropsSingle
  | RecipeListingProviderPropsTabbed;

function isTabbedProps(
  p: RecipeListingProviderProps,
): p is RecipeListingProviderPropsTabbed {
  return "myRecipes" in p && "systemRecipes" in p;
}

export function RecipeListingProvider(props: RecipeListingProviderProps) {
  const searchParams = useSearchParams();
  const [filterState, setFilterState] =
    useState<RecipeListingFilterState>(initialFilterState);

  const isTabbed = isTabbedProps(props);
  const currentTab: RecipeListingTab | null = isTabbed
    ? getCurrentTab(searchParams)
    : null;

  const recipes: RecipeListItem[] | undefined = isTabbed
    ? currentTab === "discover"
      ? props.systemRecipes
      : props.myRecipes
    : props.recipes;

  const filteredRecipes = useMemo(
    () => filterRecipes(recipes, filterState),
    [recipes, filterState],
  );

  const hasActiveFilters =
    filterState.searchQuery.trim() !== "" ||
    filterState.selectedCategory !== "all" ||
    filterState.selectedProtein !== "all" ||
    filterState.selectedDuration !== "all" ||
    filterState.selectedComplexity !== "all";

  const clearFilters = useCallback(() => {
    setFilterState(initialFilterState);
  }, []);

  const setSearchQuery = useCallback(
    (v: string) => setFilterState((s) => ({ ...s, searchQuery: v })),
    [],
  );
  const setSelectedCategory = useCallback(
    (v: string) => setFilterState((s) => ({ ...s, selectedCategory: v })),
    [],
  );
  const setSelectedProtein = useCallback(
    (v: string) => setFilterState((s) => ({ ...s, selectedProtein: v })),
    [],
  );
  const setSelectedDuration = useCallback(
    (v: string) => setFilterState((s) => ({ ...s, selectedDuration: v })),
    [],
  );
  const setSelectedComplexity = useCallback(
    (v: string) => setFilterState((s) => ({ ...s, selectedComplexity: v })),
    [],
  );

  const value: RecipeListingContextValue = useMemo(
    () => ({
      recipes,
      filteredRecipes,
      filterState,
      setSearchQuery,
      setSelectedCategory,
      setSelectedProtein,
      setSelectedDuration,
      setSelectedComplexity,
      clearFilters,
      hasActiveFilters,
      isTabbedMode: isTabbed,
      currentTab,
      optimizeImage: isTabbed ? currentTab === "discover" : true,
    }),
    [
      recipes,
      filteredRecipes,
      filterState,
      setSearchQuery,
      setSelectedCategory,
      setSelectedProtein,
      setSelectedDuration,
      setSelectedComplexity,
      clearFilters,
      hasActiveFilters,
      isTabbed,
      currentTab,
    ],
  );

  return (
    <RecipeListingContext.Provider value={value}>
      {props.children}
    </RecipeListingContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useRecipeListing(): RecipeListingContextValue {
  const value = useContext(RecipeListingContext);
  if (!value) {
    throw new Error(
      "useRecipeListing must be used within RecipeListingProvider",
    );
  }
  return value;
}
