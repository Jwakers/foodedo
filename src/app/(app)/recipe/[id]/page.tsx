import { APP_NAME, ROUTES } from "@/app/constants";
import { openGraphSiteAndUrl } from "@/lib/og-metadata";
import { getSiteBaseUrl } from "@/lib/site-url";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RecipeBackButton } from "./_components/recipe-back-button";
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
    const getCachedRecipeForMetadata = unstable_cache(
      async () => fetchQuery(api.recipes.getRecipe, { recipeId }),
      ["recipe-open-graph-metadata", recipeId],
      { revalidate: 60 * 60 * 12 },
    );
    const recipe = await getCachedRecipeForMetadata();
    if (recipe?.title) {
      const title = `${recipe.title} | ${APP_NAME}`;
      const description =
        (recipe.description?.trim() ?? "").length > 0
          ? recipe.description!.slice(0, 160)
          : `View the recipe for ${recipe.title} on ${APP_NAME}.`;
      const canonicalUrl = `${getSiteBaseUrl()}${ROUTES.RECIPE}/${recipeId}`;
      return {
        title,
        description,
        alternates: { canonical: canonicalUrl },
        openGraph: {
          ...openGraphSiteAndUrl(canonicalUrl),
          title,
          description,
          type: "article",
          images: recipe.image
            ? [
                {
                  url: recipe.image,
                  width: 1200,
                  height: 630,
                  alt: recipe.title,
                },
              ]
            : undefined,
        },
        twitter: {
          card: recipe.image ? "summary_large_image" : "summary",
          title,
          description,
          images: recipe.image ? [recipe.image] : undefined,
        },
      };
    }
  } catch (error) {
    console.warn("Failed to fetch recipe metadata:", error);
  }

  return { title: "Recipe" };
}

export default async function RecipePage({ params }: RecipePageProps) {
  const recipeId = (await params).id as Id<"recipes"> | undefined;

  if (!recipeId) {
    notFound();
  }

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-8">
        <RecipeBackButton />
        <Suspense fallback={null}>
          <RecipeClient recipeId={recipeId} />
        </Suspense>
      </div>
    </div>
  );
}
