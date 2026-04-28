"use client";

import type { RecipeListItem } from "./types";
import {
  applyRecipeCoreFilters,
  initialRecipeCoreFilterState,
  type RecipeCoreFilterState,
} from "./recipe-filter-utils";
import {
  type RecipeQuickFilterKey,
} from "./quick-filters";
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
export const TAB_ALL = "all";

export type RecipeListingTab = "my-recipes" | "discover" | "all";

export function getCurrentTab(searchParams: {
  get(key: string): string | null;
}): RecipeListingTab {
  const rawTab = searchParams.get(TAB_PARAM);
  if (rawTab === TAB_DISCOVER) return TAB_DISCOVER;
  if (rawTab === TAB_ALL) return TAB_ALL;
  return TAB_MY_RECIPES;
}

function mergeRecipeLists(
  first: RecipeListItem[] | undefined,
  second: RecipeListItem[] | undefined,
): RecipeListItem[] | undefined {
  if (!first && !second) return undefined;
  const out: RecipeListItem[] = [];
  const seen = new Set<string>();
  for (const recipe of first ?? []) {
    const id = String(recipe._id);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(recipe);
  }
  for (const recipe of second ?? []) {
    const id = String(recipe._id);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(recipe);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RecipeListingFilterState = RecipeCoreFilterState;

export type LeftoverListingMeta = {
  bestMatchCount: number;
  targetCount: number;
  hasAnyMatch: boolean;
};

const initialFilterState: RecipeListingFilterState =
  initialRecipeCoreFilterState;

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

function getRecipesForTab(
  props: RecipeListingProviderProps,
  currentTab: RecipeListingTab | null,
  options?: {
    useLeftover?: boolean;
    leftoverSource?: RecipeListItem[];
  },
): RecipeListItem[] | undefined {
  if (options?.useLeftover) {
    const from = options.leftoverSource ?? [];
    const discover = from.filter((recipe) => recipe.source === "system");
    const mine = from.filter((recipe) => recipe.source !== "system");
    if (!isTabbedProps(props)) {
      return discover;
    }
    if (currentTab === TAB_DISCOVER) return discover;
    if (currentTab === TAB_ALL) return mergeRecipeLists(mine, discover);
    return mine;
  }

  if (isTabbedProps(props)) {
    if (currentTab === TAB_DISCOVER) return props.systemRecipes;
    if (currentTab === TAB_ALL) {
      return mergeRecipeLists(props.myRecipes, props.systemRecipes);
    }
    return props.myRecipes;
  }
  return props.recipes;
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
      return getRecipesForTab(props, currentTab);
    }
    if (leftoverSearch === undefined) return undefined;
    return getRecipesForTab(props, currentTab, {
      useLeftover: true,
      leftoverSource: leftoverSearch.recipes as RecipeListItem[],
    });
  }, [
    props,
    currentTab,
    hasLeftoverTargets,
    canUseLeftoverFeatures,
    leftoverSearch,
  ]);

  const baseRecipesForTab: RecipeListItem[] | undefined = useMemo(() => {
    return getRecipesForTab(props, currentTab);
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
    () => applyRecipeCoreFilters(recipes, filterState),
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
      optimizeImage: isTabbed ? currentTab === TAB_DISCOVER : true,
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
