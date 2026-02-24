"use client";

import { ROUTES } from "@/app/constants";
import { RecipeListGrid } from "@/components/recipes";
import { LimitIndicator } from "@/components/limit-indicator";
import { Button } from "@/components/ui/button";
import useSubscription from "@/lib/hooks/use-subscription";
import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";
import { Plus } from "lucide-react";
import Link from "next/link";
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

export default function RecipeListing() {
  const [showAddRecipeDrawer, setShowAddRecipeDrawer] = useState(false);

  const recipes = useQuery(api.recipes.getAllUserRecipes);
  const subscription = useSubscription();

  return (
    <RecipeListGrid
      recipes={recipes}
      title="My Recipes"
      showMealPlanEligibleKey
      subtitle={
        <>
          Manage and organise your culinary creations.{" "}
          <Link href={ROUTES.DISCOVER} className="text-primary hover:underline">
            Discover more recipes
          </Link>
        </>
      }
      emptyState={
        <EmptyState setAddRecipeDrawerOpen={setShowAddRecipeDrawer} />
      }
      headerActions={
        <Button
          size="lg"
          onClick={() => setShowAddRecipeDrawer(true)}
          className="hidden md:flex"
        >
          <Plus className="size-5" />
          Add Recipe
        </Button>
      }
      stats={
        recipes &&
        recipes.length > 0 && (
          <div className="flex items-center gap-6 mb-6 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="size-3 bg-primary rounded-full" />
              <span className="text-sm font-medium">
                {recipes.length} {recipes.length === 1 ? "Recipe" : "Recipes"}
              </span>
            </div>
            <div className="ml-auto">
              <LimitIndicator
                current={recipes?.length ?? 0}
                max={subscription?.maxRecipes ?? 0}
                label="recipes"
              />
            </div>
          </div>
        )
      }
      footer={
        <AddRecipeDrawer
          open={showAddRecipeDrawer}
          onOpenChange={setShowAddRecipeDrawer}
        />
      }
    />
  );
}
