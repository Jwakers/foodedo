"use client";

import { ROUTES } from "@/app/constants";
import {
  RecipeListingLayout,
  RecipeListingProvider,
} from "@/components/recipes";
import { LimitIndicator } from "@/components/limit-indicator";
import { Button } from "@/components/ui/button";
import useSubscription from "@/lib/hooks/use-subscription";
import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AddRecipeDrawer } from "../../../_components.tsx/add-recipe-drawer";

const TAB_PARAM = "tab";
const TAB_DISCOVER = "discover";
const TAB_MY_RECIPES = "my-recipes";

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
  const currentTab =
    searchParams.get(TAB_PARAM) === TAB_DISCOVER ? TAB_DISCOVER : TAB_MY_RECIPES;

  const recipes = useQuery(api.recipes.getAllUserRecipes);
  const systemRecipes = useQuery(api.recipes.getSystemRecipes);
  const subscription = useSubscription();

  const isMyRecipesTab = currentTab === TAB_MY_RECIPES;
  const showEmptyState =
    isMyRecipesTab && recipes && recipes.length === 0;

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {isMyRecipesTab ? "My Recipes" : "Discover"}
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
                Browse our curated recipes.
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
          <RecipeListingProvider
            myRecipes={recipes}
            systemRecipes={systemRecipes}
          >
            <RecipeListingLayout />
          </RecipeListingProvider>
        )}

        <AddRecipeDrawer
          open={showAddRecipeDrawer}
          onOpenChange={setShowAddRecipeDrawer}
        />
      </div>
    </div>
  );
}
