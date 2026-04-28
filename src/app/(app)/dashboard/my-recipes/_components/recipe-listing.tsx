"use client";

import { ROUTES } from "@/app/constants";
import {
  getCurrentTab,
  RecipeLoadMore,
  RecipeListingLayout,
  RecipeListingProvider,
  TAB_ALL,
  TAB_DISCOVER,
  TAB_MY_RECIPES,
} from "@/components/recipes";
import { LimitIndicator } from "@/components/limit-indicator";
import { Button } from "@/components/ui/button";
import useSubscription from "@/lib/hooks/use-subscription";
import { api } from "convex/_generated/api";
import { usePaginatedQuery } from "convex/react";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
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
  const searchParams = useSearchParams();
  const currentTab = getCurrentTab(searchParams);

  const {
    results: recipes,
    status: myRecipesStatus,
    loadMore: loadMoreMyRecipes,
  } = usePaginatedQuery(
    api.recipes.listUserRecipesPaginated,
    {},
    { initialNumItems: 20 },
  );
  const {
    results: systemRecipes,
    status: systemRecipesStatus,
    loadMore: loadMoreSystemRecipes,
  } = usePaginatedQuery(
    api.recipes.listSystemRecipesPaginated,
    {},
    { initialNumItems: 20 },
  );
  const subscription = useSubscription();
  const isMyRecipesInitialLoading =
    myRecipesStatus === "LoadingFirstPage" && recipes.length === 0;
  const isSystemRecipesInitialLoading =
    systemRecipesStatus === "LoadingFirstPage" && systemRecipes.length === 0;

  const isMyRecipesTab = currentTab === TAB_MY_RECIPES;
  const isDiscoverTab = currentTab === TAB_DISCOVER;
  const showEmptyState =
    isMyRecipesTab && !isMyRecipesInitialLoading && recipes.length === 0;
  const canLoadMoreMyRecipes = myRecipesStatus === "CanLoadMore";
  const canLoadMoreSystemRecipes = systemRecipesStatus === "CanLoadMore";
  const canLoadMoreCurrentTab =
    currentTab === TAB_MY_RECIPES
      ? canLoadMoreMyRecipes
      : currentTab === TAB_DISCOVER
        ? canLoadMoreSystemRecipes
        : canLoadMoreMyRecipes || canLoadMoreSystemRecipes;
  const isLoadingMoreCurrentTab =
    currentTab === TAB_MY_RECIPES
      ? myRecipesStatus === "LoadingMore"
      : currentTab === TAB_DISCOVER
        ? systemRecipesStatus === "LoadingMore"
        : myRecipesStatus === "LoadingMore" ||
          systemRecipesStatus === "LoadingMore";

  const handleLoadMore = () => {
    if (currentTab === TAB_MY_RECIPES) {
      if (canLoadMoreMyRecipes) {
        loadMoreMyRecipes(20);
      }
      return;
    }
    if (currentTab === TAB_DISCOVER) {
      if (canLoadMoreSystemRecipes) {
        loadMoreSystemRecipes(20);
      }
      return;
    }
    if (canLoadMoreMyRecipes) {
      loadMoreMyRecipes(20);
    }
    if (canLoadMoreSystemRecipes) {
      loadMoreSystemRecipes(20);
    }
  };

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
              myRecipes={isMyRecipesInitialLoading ? undefined : recipes}
              systemRecipes={
                isSystemRecipesInitialLoading ? undefined : systemRecipes
              }
            >
              <RecipeListingLayout />
            </RecipeListingProvider>
            <RecipeLoadMore
              canLoadMore={canLoadMoreCurrentTab}
              loadingMore={isLoadingMoreCurrentTab}
              onLoadMore={handleLoadMore}
            />
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
