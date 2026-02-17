import { APP_NAME } from "@/app/constants";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecipeClient } from "./_components/recipe-client";

interface RecipePageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: RecipePageProps): Promise<Metadata> {
  const recipeId = (await params).id as Id<"recipes"> | undefined;

  if (!recipeId) {
    return { title: "Recipe" };
  }

  try {
    const recipe = await fetchQuery(api.recipes.getRecipe, { recipeId });
    if (recipe?.title) {
      return {
        title: `${recipe.title} | ${APP_NAME}`,
        description: recipe.description ?? undefined,
      };
    }
  } catch {
    // Recipe may require auth or not exist
  }

  return { title: "Recipe" };
}

export default async function RecipePage({ params }: RecipePageProps) {
  const recipeId = (await params).id as Id<"recipes"> | undefined;

  if (!recipeId) {
    notFound();
  }

  return <RecipeClient recipeId={recipeId} />;
}
