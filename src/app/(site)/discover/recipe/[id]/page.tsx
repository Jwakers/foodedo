import { APP_NAME, ROUTES } from "@/app/constants";
import { getSiteBaseUrl } from "@/lib/site-url";
import { buildRecipeJsonLd } from "@/lib/recipe-json-ld";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { DiscoverRecipeView } from "./_components/discover-recipe-view";

interface DiscoverRecipePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: DiscoverRecipePageProps): Promise<Metadata> {
  const recipeId = (await params).id as Id<"recipes"> | undefined;

  if (!recipeId) {
    return { title: "Recipe" };
  }

  try {
    const recipe = await fetchQuery(api.recipes.getRecipe, { recipeId });
    if (recipe?.title) {
      const title = `${recipe.title} | Discover | ${APP_NAME}`;
      const description =
        (recipe.description?.trim() ?? "").length > 0
          ? recipe.description!.slice(0, 160)
          : `View the recipe for ${recipe.title} on ${APP_NAME}.`;
      return {
        title,
        description,
        openGraph: {
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

export default async function DiscoverRecipePage({
  params,
}: DiscoverRecipePageProps) {
  const recipeId = (await params).id as Id<"recipes"> | undefined;

  if (!recipeId) {
    notFound();
  }

  const recipe = await fetchQuery(api.recipes.getRecipe, { recipeId });

  if (!recipe) {
    notFound();
  }

  if (recipe.source !== "system") {
    notFound();
  }

  const recipeUrl = `${getSiteBaseUrl()}${ROUTES.discoverRecipe(recipeId)}`;
  const recipeJsonLd = buildRecipeJsonLd(recipe, recipeUrl);
  // Escape '<' so '</script>' in recipe content cannot break out of the script tag
  const safeJsonLd = JSON.stringify(recipeJsonLd).replace(/</g, "\\u003c");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd }}
      />
      <DiscoverRecipeView recipe={recipe} />
    </>
  );
}
