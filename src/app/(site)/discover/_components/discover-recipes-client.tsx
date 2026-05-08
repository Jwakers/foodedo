"use client";

import {
  applyRecipeFilterStateToSearchParams,
  recipeFilterStateFromSearchParams,
  toRecipeListServerFilter,
} from "@/components/recipes/recipe-filter-utils";
import { RecipeFilters } from "@/components/recipes/recipe-filters";
import { RecipeLoadMore } from "@/components/recipes/recipe-listing";
import {
  RecipeListingProvider,
  useRecipeListing,
} from "@/components/recipes/recipe-listing-context";
import { Button } from "@/components/ui/button";
import { api } from "convex/_generated/api";
import { usePaginatedQuery } from "convex/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { DiscoverRecipeGrid } from "./discover-recipe-grid";

function DiscoverLoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-5 w-72 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-64 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}

function DiscoverRecipeListing() {
  const {
    recipes,
    filteredRecipes,
    clearFilters,
    hasActiveFilters,
    leftoverListingMeta,
    leftoverIngredientIds,
    leftoverIngredientPhrases,
    baseRecipesForTab,
  } = useRecipeListing();

  const hasLeftoverFilter =
    leftoverIngredientIds.length > 0 || leftoverIngredientPhrases.length > 0;
  const isFilteredEmpty = recipes != null && recipes.length === 0;
  const hasSourceRecipes = recipes != null && recipes.length > 0;
  const sourceListEmpty =
    baseRecipesForTab === undefined ||
    (baseRecipesForTab.length === 0 && !hasActiveFilters);

  if (filteredRecipes.length === 0) {
    if (hasLeftoverFilter && leftoverListingMeta) {
      if (!leftoverListingMeta.hasAnyMatch) {
        return (
          <div className="text-center py-16">
            <p className="text-muted-foreground max-w-md mx-auto">
              None of your saved or Discover recipes use those ingredients yet.
              Try different ingredients or clear the list.
            </p>
            {hasActiveFilters && (
              <Button className="mt-4" variant="outline" onClick={clearFilters}>
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
              No Discover recipes use those ingredients. Try My Recipes or
              adjust your ingredient list.
            </p>
            {hasActiveFilters && (
              <Button className="mt-4" variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        );
      }
    }

    if (!hasSourceRecipes && sourceListEmpty && !isFilteredEmpty) {
      return (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No recipes found.</p>
        </div>
      );
    }
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">
          No recipes match your search or filters.
        </p>
        {hasActiveFilters && (
          <Button className="mt-4" variant="outline" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <DiscoverRecipeGrid
      recipes={filteredRecipes}
      leftoverTargetCount={leftoverListingMeta?.targetCount}
    />
  );
}

export default function DiscoverRecipesClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filterState = useMemo(
    () => recipeFilterStateFromSearchParams(searchParams),
    [searchParams],
  );
  const serverFilter = useMemo(
    () => toRecipeListServerFilter(filterState),
    [filterState],
  );

  const handleFilterStateChange = (nextFilterState: typeof filterState) => {
    const nextParams = applyRecipeFilterStateToSearchParams(
      nextFilterState,
      new URLSearchParams(searchParams.toString()),
    );
    const nextQuery = nextParams.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery === currentQuery) return;
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  };

  const { results, status, loadMore } = usePaginatedQuery(
    api.recipes.listRecipesPaginatedUnified,
    { scope: "discover", filter: serverFilter },
    { initialNumItems: 20 },
  );
  const isInitialLoading =
    status === "LoadingFirstPage" && results.length === 0;

  if (isInitialLoading) {
    return <DiscoverLoadingSkeleton />;
  }

  return (
    <RecipeListingProvider
      recipes={results}
      serverFiltered
      filterState={filterState}
      onFilterStateChange={handleFilterStateChange}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <RecipeFilters />
        </div>
        <DiscoverRecipeListing />
        <RecipeLoadMore
          canLoadMore={status === "CanLoadMore"}
          loadingMore={status === "LoadingMore"}
          onLoadMore={() => loadMore(20)}
        />
      </div>
    </RecipeListingProvider>
  );
}
