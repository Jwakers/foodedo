"use client";

import { RecipeFilters } from "@/components/recipes/recipe-filters";
import {
  RecipeListingProvider,
  useRecipeListing,
} from "@/components/recipes/recipe-listing-context";
import { Button } from "@/components/ui/button";
import { DiscoverRecipeGrid } from "./discover-recipe-grid";
import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";

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
  } = useRecipeListing();

  const hasSourceRecipes = recipes != null && recipes.length > 0;

  if (filteredRecipes.length === 0) {
    if (!hasSourceRecipes) {
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
          <Button
            className="mt-4"
            variant="outline"
            onClick={clearFilters}
          >
            Clear filters
          </Button>
        )}
      </div>
    );
  }

  return <DiscoverRecipeGrid recipes={filteredRecipes} />;
}

export default function DiscoverRecipesClient() {
  const recipes = useQuery(api.recipes.getSystemRecipes);

  if (recipes === undefined) {
    return <DiscoverLoadingSkeleton />;
  }

  return (
    <RecipeListingProvider recipes={recipes}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <RecipeFilters />
        </div>
        <DiscoverRecipeListing />
      </div>
    </RecipeListingProvider>
  );
}
