"use client";

import { RecipeListGrid } from "@/components/recipes";
import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";

export default function DiscoverRecipesClient() {
  const recipes = useQuery(api.recipes.getSystemRecipes);

  return <RecipeListGrid recipes={recipes} />;
}
