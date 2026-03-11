"use client";

import { RecipeListGrid } from "@/components/recipes";
import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";

export default function DiscoverRecipesClient() {
  const recipes = useQuery(api.recipes.getSystemRecipes);

  return (
    <RecipeListGrid
      recipes={recipes}
      title="Discover"
      subtitle="Browse our curated recipes."
      filterVariant="discover"
      emptyState={
        <div className="text-center py-16">
          <p className="text-muted-foreground">No recipes available yet.</p>
        </div>
      }
    />
  );
}
