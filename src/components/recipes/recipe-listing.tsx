"use client";

import { Button } from "@/components/ui/button";
import type { RecipeListItem } from "./recipe-card";
import { LoadingState, RecipeCard } from "./recipe-card";
import { RecipeFilters } from "./recipe-filters";
import { RecipeListingProvider, useRecipeListing } from "./recipe-listing-context";
import { RecipeTabSwitcher } from "./recipe-tab-switcher";
import type { ReactNode } from "react";

// -----------------------------------------------------------------------------
// Recipe listing (grid / empty / loading) – reads from context
// -----------------------------------------------------------------------------

export function RecipeListing() {
  const { recipes, filteredRecipes, clearFilters } = useRecipeListing();

  const loading = recipes === undefined;
  const hasSourceRecipes = recipes != null && recipes.length > 0;

  if (loading || recipes === undefined) {
    return <LoadingState />;
  }

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
        <Button className="mt-4" variant="outline" onClick={clearFilters}>
          Clear filters
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredRecipes.map((recipe) => (
        <RecipeCard key={recipe._id} recipe={recipe} />
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Layout – filters, tab switcher (when tabbed), and listing
// -----------------------------------------------------------------------------

export function RecipeListingLayout() {
  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <RecipeFilters />
          <RecipeTabSwitcher />
        </div>
        <RecipeListing />
      </div>
    </div>
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
      <RecipeListingLayout />
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
};

export function RecipeGrid({
  recipes,
  loading = false,
  emptyState,
  onClearFilters,
  hasSourceRecipes = false,
}: RecipeGridProps) {
  if (loading || recipes === undefined) {
    return <LoadingState />;
  }

  if (recipes.length === 0) {
    if (!hasSourceRecipes) {
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
        <RecipeCard key={recipe._id} recipe={recipe} />
      ))}
    </div>
  );
}
