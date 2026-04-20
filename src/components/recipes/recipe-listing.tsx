"use client";

import { Button } from "@/components/ui/button";
import type { RecipeListItem } from "./types";
import { LoadingState, RecipeCard } from "./recipe-card";
import { RecipeFilters } from "./recipe-filters";
import {
  RecipeListingProvider,
  useRecipeListing,
} from "./recipe-listing-context";
import { RecipeTabSwitcher } from "./recipe-tab-switcher";
import type { ReactNode } from "react";

// -----------------------------------------------------------------------------
// Recipe listing (grid / empty / loading) – reads from context
// -----------------------------------------------------------------------------

export function RecipeListing() {
  const {
    recipes,
    filteredRecipes,
    clearFilters,
    optimizeImage,
    leftoverListingMeta,
    leftoverIngredientIds,
    leftoverIngredientPhrases,
    baseRecipesForTab,
  } = useRecipeListing();

  const loading = recipes === undefined;
  const hasLeftoverFilter =
    leftoverIngredientIds.length > 0 || leftoverIngredientPhrases.length > 0;
  const hasSourceRecipes = recipes != null && recipes.length > 0;
  const sourceListEmpty =
    baseRecipesForTab === undefined || baseRecipesForTab.length === 0;

  if (loading) {
    return <LoadingState />;
  }

  return (
    <RecipeGrid
      recipes={filteredRecipes}
      loading={false}
      hasSourceRecipes={hasSourceRecipes}
      onClearFilters={clearFilters}
      optimizeImage={optimizeImage}
      leftoverListingMeta={leftoverListingMeta}
      hasLeftoverFilter={hasLeftoverFilter}
      sourceListEmpty={sourceListEmpty}
    />
  );
}

// -----------------------------------------------------------------------------
// Layout – filters, tab switcher (when tabbed), and listing. No container;
// parent (page or RecipeListGrid) provides container when needed.
// -----------------------------------------------------------------------------

export function RecipeListingLayout() {
  return (
    <>
      <div className="mb-8">
        <RecipeFilters />
        <RecipeTabSwitcher />
      </div>
      <RecipeListing />
    </>
  );
}

// -----------------------------------------------------------------------------
// Single-view wrapper (e.g. Discover page). For tabbed view use
// RecipeListingProvider with myRecipes + systemRecipes and RecipeListingLayout.
// -----------------------------------------------------------------------------

export function RecipeListGrid({
  recipes,
}: {
  recipes: RecipeListItem[] | undefined;
}) {
  return (
    <RecipeListingProvider recipes={recipes}>
      <div className="container mx-auto px-4 py-8">
        <RecipeListingLayout />
      </div>
    </RecipeListingProvider>
  );
}

// -----------------------------------------------------------------------------
// Presentational grid (for use outside context: pass recipes, loading, etc.)
// -----------------------------------------------------------------------------

type RecipeGridProps = {
  recipes: RecipeListItem[] | undefined;
  loading?: boolean;
  emptyState?: ReactNode;
  onClearFilters?: () => void;
  hasSourceRecipes?: boolean;
  /** When true, recipe card images use Next.js Image optimization (e.g. system recipes). */
  optimizeImage?: boolean;
  leftoverListingMeta?: {
    bestMatchCount: number;
    targetCount: number;
    hasAnyMatch: boolean;
  } | null;
  hasLeftoverFilter?: boolean;
  /** True when this tab had no recipes before leftover filtering. */
  sourceListEmpty?: boolean;
};

export function RecipeGrid({
  recipes,
  loading,
  emptyState,
  onClearFilters,
  hasSourceRecipes = false,
  optimizeImage = false,
  leftoverListingMeta = null,
  hasLeftoverFilter = false,
  sourceListEmpty = false,
}: RecipeGridProps) {
  if (loading || recipes === undefined) {
    return <LoadingState />;
  }

  if (recipes.length === 0) {
    if (hasLeftoverFilter && leftoverListingMeta) {
      if (!leftoverListingMeta.hasAnyMatch) {
        return (
          <div className="text-center py-16">
            <p className="text-muted-foreground max-w-md mx-auto">
              None of your saved or Discover recipes use those ingredients yet.
              Try different ingredients or clear the list. Recipes with linked
              ingredients match best.
            </p>
            {onClearFilters && (
              <Button
                className="mt-4"
                variant="outline"
                onClick={onClearFilters}
              >
                Clear filters
              </Button>
            )}
          </div>
        );
      }
      if (!sourceListEmpty) {
        return (
          <div className="text-center py-16">
            <p className="text-muted-foreground max-w-md mx-auto">
              No recipes in this tab use those ingredients. Try the other tab
              or adjust your ingredient list.
            </p>
            {onClearFilters && (
              <Button
                className="mt-4"
                variant="outline"
                onClick={onClearFilters}
              >
                Clear filters
              </Button>
            )}
          </div>
        );
      }
    }

    if (!hasSourceRecipes && sourceListEmpty) {
      return (
        <>
          {emptyState ?? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No recipes found.</p>
            </div>
          )}
        </>
      );
    }
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">
          No recipes match your search or filters.
        </p>
        {onClearFilters && (
          <Button className="mt-4" variant="outline" onClick={onClearFilters}>
            Clear filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe._id}
          recipe={recipe}
          optimizeImage={optimizeImage}
          leftoverTargetCount={leftoverListingMeta?.targetCount}
        />
      ))}
    </div>
  );
}
