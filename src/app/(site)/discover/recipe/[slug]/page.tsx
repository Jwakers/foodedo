import { APP_NAME, ROUTES } from "@/app/constants";
import { openGraphSiteAndUrl } from "@/lib/og-metadata";
import { buildRecipeJsonLd } from "@/lib/recipe-json-ld";
import { getSiteBaseUrl } from "@/lib/site-url";
import { api } from "convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DiscoverRecipeView } from "./_components/discover-recipe-view";

interface DiscoverRecipePageProps {
  params: Promise<{ slug: string }>;
}

async function fetchDiscoverRecipe(slug: string) {
  const recipe = await fetchQuery(api.recipes.getSystemRecipeBySlug, {
    slug,
  });
  const publicSlug = recipe?.publicSlug?.trim();
  if (!recipe || !publicSlug) {
    return null;
  }
  return { ...recipe, publicSlug };
}

function buildDiscoverMetadata(
  recipe: NonNullable<Awaited<ReturnType<typeof fetchDiscoverRecipe>>>,
): Metadata {
  const canonicalUrl = `${getSiteBaseUrl()}${ROUTES.discoverRecipe(recipe.publicSlug)}`;
  const title = `${recipe.title} | Discover | ${APP_NAME}`;
  const description =
    (recipe.description?.trim() ?? "").length > 0
      ? recipe.description!.slice(0, 160)
      : `View the recipe for ${recipe.title} on ${APP_NAME}.`;
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

export async function generateMetadata({
  params,
}: DiscoverRecipePageProps): Promise<Metadata> {
  const slug = (await params).slug?.trim() ?? "";
  if (!slug) {
    return { title: "Recipe" };
  }

  const recipe = await fetchDiscoverRecipe(slug);
  if (!recipe?.title) {
    return { title: "Recipe" };
  }

  return buildDiscoverMetadata(recipe);
}

export default async function DiscoverRecipePage({
  params,
}: DiscoverRecipePageProps) {
  const slug = (await params).slug?.trim() ?? "";
  if (!slug) {
    notFound();
  }

  const recipe = await fetchDiscoverRecipe(slug);
  if (!recipe) {
    notFound();
  }

  const recipeUrl = `${getSiteBaseUrl()}${ROUTES.discoverRecipe(recipe.publicSlug)}`;
  const recipeJsonLd = buildRecipeJsonLd(recipe, recipeUrl);
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
