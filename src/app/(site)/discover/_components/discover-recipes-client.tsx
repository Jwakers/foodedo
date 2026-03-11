"use client";

import { RecipeListGrid } from "@/components/recipes";
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

export default function DiscoverRecipesClient() {
  const recipes = useQuery(api.recipes.getSystemRecipes);

  if (recipes === undefined) {
    return <DiscoverLoadingSkeleton />;
  }

  return <RecipeListGrid recipes={recipes} />;
}
