"use client";

import { ROUTES } from "@/app/constants";
import { LimitIndicator } from "@/components/limit-indicator";
import {
  getCurrentTab,
  RecipeListingLayout,
  RecipeListingProvider,
  RecipeLoadMore,
  TAB_ALL,
  TAB_DISCOVER,
  TAB_MY_RECIPES,
} from "@/components/recipes";
import {
  applyRecipeFilterStateToSearchParams,
  recipeFilterStateFromSearchParams,
  toRecipeListServerFilter,
} from "@/components/recipes/recipe-filter-utils";
import { Button } from "@/components/ui/button";
import useSubscription from "@/lib/hooks/use-subscription";
import { api } from "convex/_generated/api";
import { usePaginatedQuery } from "convex/react";
import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AddRecipeDrawer } from "../../../_components.tsx/add-recipe-drawer";

function EmptyState({
  setAddRecipeDrawerOpen,
}: {
  setAddRecipeDrawerOpen: (open: boolean) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="size-24 bg-muted rounded-full flex items-center justify-center mb-6">
        <Plus className="size-12 text-muted-foreground" />
      </div>
      <h3 className="text-2xl font-bold text-foreground mb-2">
        No recipes yet
      </h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Start building your recipe collection by creating your first recipe.
        Share your culinary creations with the world!
      </p>
      <Button size="lg" onClick={() => setAddRecipeDrawerOpen(true)}>
        <Plus className="size-5" />
        Create Your First Recipe
      </Button>
    </div>
  );
}

export default function RecipeListingPage() {
  const [showAddRecipeDrawer, setShowAddRecipeDrawer] = useState(false);
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
  const currentTab = getCurrentTab(searchParams);
  const unifiedScope =
    currentTab === TAB_DISCOVER
      ? "discover"
      : currentTab === TAB_ALL
        ? "all"
        : "my";

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
    { scope: unifiedScope, filter: serverFilter },
    { initialNumItems: 20 },
  );

  const recipes = currentTab === TAB_MY_RECIPES ? results : [];
  const systemRecipes = currentTab === TAB_DISCOVER ? results : [];
  const allRecipes = currentTab === TAB_ALL ? results : [];
  const subscription = useSubscription();
  const isInitialLoading =
    status === "LoadingFirstPage" && results.length === 0;

  const isMyRecipesTab = currentTab === TAB_MY_RECIPES;
  const isDiscoverTab = currentTab === TAB_DISCOVER;
  const showEmptyState =
    isMyRecipesTab && !isInitialLoading && recipes.length === 0;
  const canLoadMoreCurrentTab = status === "CanLoadMore";
  const isLoadingMoreCurrentTab = status === "LoadingMore";

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {isMyRecipesTab
                ? "My Recipes"
                : isDiscoverTab
                  ? "Discover"
                  : "All Recipes"}
            </h1>
            {isMyRecipesTab ? (
              <p className="text-muted-foreground text-lg">
                Manage and organise your culinary creations.{" "}
                <Link
                  href={ROUTES.MY_RECIPES_DISCOVER_TAB}
                  className="text-primary hover:underline"
                >
                  Discover more recipes
                </Link>
              </p>
            ) : (
              <p className="text-muted-foreground text-lg">
                {currentTab === TAB_ALL
                  ? "Browse your recipes alongside curated discover recipes."
                  : "Browse our curated recipes."}
              </p>
            )}
          </div>
          {isMyRecipesTab && (
            <Button
              size="lg"
              onClick={() => setShowAddRecipeDrawer(true)}
              className="hidden md:flex"
            >
              <Plus className="size-5" />
              Add Recipe
            </Button>
          )}
        </div>

        {isMyRecipesTab && recipes && recipes.length > 0 && subscription && (
          <div className="flex items-center gap-6 mb-6 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="size-3 bg-primary rounded-full" />
              <span className="text-sm font-medium">
                {recipes.length} {recipes.length === 1 ? "Recipe" : "Recipes"}
              </span>
            </div>
            <div className="ml-auto">
              <LimitIndicator
                current={recipes.length}
                max={subscription.maxRecipes ?? 0}
                label="recipes"
              />
            </div>
          </div>
        )}

        {showEmptyState ? (
          <EmptyState setAddRecipeDrawerOpen={setShowAddRecipeDrawer} />
        ) : (
          <>
            <RecipeListingProvider
              myRecipes={
                isInitialLoading
                  ? undefined
                  : currentTab === TAB_ALL
                    ? allRecipes
                    : recipes
              }
              systemRecipes={
                isInitialLoading
                  ? undefined
                  : currentTab === TAB_DISCOVER
                    ? systemRecipes
                    : []
              }
              serverFiltered
              filterState={filterState}
              onFilterStateChange={handleFilterStateChange}
            >
              <RecipeListingLayout />
              <RecipeLoadMore
                canLoadMore={canLoadMoreCurrentTab}
                loadingMore={isLoadingMoreCurrentTab}
                onLoadMore={() => loadMore(20)}
              />
            </RecipeListingProvider>
          </>
        )}

        <AddRecipeDrawer
          open={showAddRecipeDrawer}
          onOpenChange={setShowAddRecipeDrawer}
        />
      </div>
    </div>
  );
}
