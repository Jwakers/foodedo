"use client";

import type { RecipeListItem } from "./types";
import {
  getRecipeQuickFilter,
  isRecipeQuickFilterKey,
  type RecipeQuickFilterKey,
} from "./quick-filters";
import { getRecipeTotalMinutes, isUnder30Minutes } from "./recipe-time";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { canUseLeftoverIngredients } from "convex/lib/constants";
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

function matchesDuration(recipe: RecipeListItem, duration: string): boolean {
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
      return true;
  }
}

function filterRecipes(
  recipes: RecipeListItem[] | undefined,
  filterState: RecipeListingFilterState,
): RecipeListItem[] {
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
    const matchesDurationFilter = matchesDuration(
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
  selectedQuickFilters: RecipeQuickFilterKey[];
};

export type LeftoverListingMeta = {
  bestMatchCount: number;
  targetCount: number;
  hasAnyMatch: boolean;
};

const initialFilterState: RecipeListingFilterState = {
  searchQuery: "",
  selectedCategory: "all",
  selectedProtein: "all",
  selectedDuration: "all",
  selectedComplexity: "all",
  selectedQuickFilters: [],
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
  toggleQuickFilter: (v: RecipeQuickFilterKey) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  isTabbedMode: boolean;
  currentTab: RecipeListingTab | null;
  /** When true, recipe card images use Next.js Image optimization (system recipes only). */
  optimizeImage: boolean;
  leftoverIngredientIds: Id<"ingredients">[];
  leftoverIngredientPhrases: string[];
  setLeftoverSelection: (next: {
    ingredientIds: Id<"ingredients">[];
    phrases: string[];
  }) => void;
  /** Present when leftover search ran successfully (entitled + at least one id). */
  leftoverListingMeta: LeftoverListingMeta | null;
  /** User may use leftover ranking (Pro, or free during beta). */
  canUseLeftoverFeatures: boolean;
  /** Recipes for the current tab before leftover filter (for empty-state copy). */
  baseRecipesForTab: RecipeListItem[] | undefined;
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
  const [leftoverIngredientIds, setLeftoverIngredientIds] = useState<
    Id<"ingredients">[]
  >([]);
  const [leftoverIngredientPhrases, setLeftoverIngredientPhrases] = useState<
    string[]
  >([]);

  const user = useQuery(api.users.current);
  const canUseLeftoverFeatures =
    user != null && canUseLeftoverIngredients(user.subscriptionTier);

  const hasLeftoverTargets =
    leftoverIngredientIds.length > 0 || leftoverIngredientPhrases.length > 0;

  const leftoverSearch = useQuery(
    api.recipes.searchWithLeftoverIngredients,
    canUseLeftoverFeatures && hasLeftoverTargets && user != null
      ? {
          leftoverIngredientIds:
            leftoverIngredientIds.length > 0
              ? leftoverIngredientIds
              : undefined,
          leftoverIngredientPhrases:
            leftoverIngredientPhrases.length > 0
              ? leftoverIngredientPhrases
              : undefined,
        }
      : "skip",
  );

  const isTabbed = isTabbedProps(props);
  const currentTab: RecipeListingTab | null = isTabbed
    ? getCurrentTab(searchParams)
    : null;

  const recipes: RecipeListItem[] | undefined = useMemo(() => {
    if (!hasLeftoverTargets || !canUseLeftoverFeatures) {
      if (isTabbedProps(props)) {
        return currentTab === "discover"
          ? props.systemRecipes
          : props.myRecipes;
      }
      return props.recipes;
    }
    if (leftoverSearch === undefined) return undefined;
    const from = leftoverSearch.recipes;
    if (!isTabbedProps(props)) {
      return from.filter((r) => r.source === "system") as RecipeListItem[];
    }
    if (currentTab === "discover") {
      return from.filter((r) => r.source === "system") as RecipeListItem[];
    }
    return from.filter((r) => r.source !== "system") as RecipeListItem[];
  }, [
    props,
    currentTab,
    hasLeftoverTargets,
    canUseLeftoverFeatures,
    leftoverSearch,
  ]);

  const baseRecipesForTab: RecipeListItem[] | undefined = useMemo(() => {
    if (isTabbedProps(props)) {
      return currentTab === "discover"
        ? props.systemRecipes
        : props.myRecipes;
    }
    return props.recipes;
  }, [props, currentTab]);

  const leftoverListingMeta = useMemo((): LeftoverListingMeta | null => {
    if (
      !hasLeftoverTargets ||
      !canUseLeftoverFeatures ||
      leftoverSearch === undefined
    ) {
      return null;
    }
    return {
      bestMatchCount: leftoverSearch.bestMatchCount,
      targetCount: leftoverSearch.targetCount,
      hasAnyMatch: leftoverSearch.hasAnyMatch,
    };
  }, [
    hasLeftoverTargets,
    canUseLeftoverFeatures,
    leftoverSearch,
  ]);

  const filteredRecipes = useMemo(
    () => filterRecipes(recipes, filterState),
    [recipes, filterState],
  );

  const hasActiveFilters =
    filterState.searchQuery.trim() !== "" ||
    filterState.selectedCategory !== "all" ||
    filterState.selectedProtein !== "all" ||
    filterState.selectedDuration !== "all" ||
    filterState.selectedComplexity !== "all" ||
    filterState.selectedQuickFilters.length > 0 ||
    hasLeftoverTargets;

  const setLeftoverSelection = useCallback(
    (next: {
      ingredientIds: Id<"ingredients">[];
      phrases: string[];
    }) => {
      setLeftoverIngredientIds(next.ingredientIds);
      setLeftoverIngredientPhrases(next.phrases);
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setFilterState(initialFilterState);
    setLeftoverIngredientIds([]);
    setLeftoverIngredientPhrases([]);
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
  const toggleQuickFilter = useCallback((v: RecipeQuickFilterKey) => {
    setFilterState((s) => {
      if (s.selectedQuickFilters.includes(v)) {
        return {
          ...s,
          selectedQuickFilters: s.selectedQuickFilters.filter(
            (key) => key !== v,
          ),
        };
      }
      return {
        ...s,
        selectedQuickFilters: [...s.selectedQuickFilters, v],
      };
    });
  }, []);

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
      toggleQuickFilter,
      clearFilters,
      hasActiveFilters,
      isTabbedMode: isTabbed,
      currentTab,
      optimizeImage: isTabbed ? currentTab === "discover" : true,
      leftoverIngredientIds,
      leftoverIngredientPhrases,
      setLeftoverSelection,
      leftoverListingMeta,
      canUseLeftoverFeatures,
      baseRecipesForTab,
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
      toggleQuickFilter,
      clearFilters,
      hasActiveFilters,
      isTabbed,
      currentTab,
      leftoverIngredientIds,
      leftoverIngredientPhrases,
      setLeftoverSelection,
      leftoverListingMeta,
      canUseLeftoverFeatures,
      baseRecipesForTab,
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
