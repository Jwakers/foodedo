import { ROUTES } from "@/app/constants";
import { getSiteBaseUrl } from "@/lib/site-url";
import { client } from "@/sanity/client";
import { api } from "convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import type { MetadataRoute } from "next";

const SLUGS_QUERY = `*[_type == "post" && defined(slug.current) && !(_id in path("drafts.**"))]{ "slug": slug.current, publishedAt }`;

// Convex Next.js helpers currently issue fetches with `revalidate: 0`.
// Force dynamic rendering to prevent Next from attempting to statically
// pre-render `/sitemap.xml` during the build.
export const dynamic = "force-dynamic";

// Still revalidate periodically when Next's caching layer applies.
export const revalidate = 3600;
const STATIC_LAST_MODIFIED = new Date("2026-04-28T00:00:00.000Z");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteBaseUrl();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}${ROUTES.DISCOVER}`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}${ROUTES.BLOG}`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}${ROUTES.FAQ}`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${baseUrl}${ROUTES.PRICING}`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}${ROUTES.PUBLIC_SUPPORT}`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.72,
    },
    {
      url: `${baseUrl}${ROUTES.PUBLIC_SUPPORT_HOW_TO}`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}${ROUTES.PUBLIC_SUPPORT_CONTACT}`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.55,
    },
    {
      url: `${baseUrl}${ROUTES.FAMILY_MEAL_PLANNING}`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.88,
    },
    {
      url: `${baseUrl}${ROUTES.RECIPE_TO_SHOPPING_LIST}`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.88,
    },
    {
      url: `${baseUrl}${ROUTES.HOUSEHOLD_MEAL_PLANNING}`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.88,
    },
    {
      url: `${baseUrl}${ROUTES.HOW_TO_MAKE_A_SHOPPING_LIST_FROM_RECIPES}`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.86,
    },
    {
      url: `${baseUrl}${ROUTES.COMBINE_RECIPES_INTO_ONE_GROCERY_LIST}`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.86,
    },
    {
      url: `${baseUrl}${ROUTES.MEAL_PLANNER_WITH_GROCERY_LIST}`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.86,
    },
    {
      url: `${baseUrl}${ROUTES.HOW_TO_CREATE_A_WEEKLY_MEAL_PLAN_FAST}`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.84,
    },
    {
      url: `${baseUrl}${ROUTES.HOW_TO_PLAN_VARIED_MEALS_FOR_THE_WEEK}`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.84,
    },
    {
      url: `${baseUrl}${ROUTES.MEAL_PLANNING_FOR_BUSY_WEEKNIGHTS}`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.84,
    },
    {
      url: `${baseUrl}${ROUTES.MEAL_PLAN_VS_SHOPPING_LIST_WHAT_YOU_NEED}`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.82,
    },
    {
      url: `${baseUrl}/blog/how-to-turn-recipes-into-one-grocery-list`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.72,
    },
    {
      url: `${baseUrl}/blog/how-to-combine-ingredients-from-multiple-recipes`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.72,
    },
    {
      url: `${baseUrl}/blog/weekly-meal-plan-and-shopping-list-guide`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.72,
    },
    {
      url: `${baseUrl}/blog/recipe-app-vs-meal-planner-vs-grocery-list-app`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog/how-to-build-a-weekly-meal-plan-in-15-minutes`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.72,
    },
    {
      url: `${baseUrl}/blog/how-to-keep-meals-varied-without-overthinking-it`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.72,
    },
    {
      url: `${baseUrl}${ROUTES.PRIVACY}`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}${ROUTES.TERMS}`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  type SlugResult = { slug: string; publishedAt?: string };
  let postEntries: MetadataRoute.Sitemap = [];
  try {
    const posts = await client.fetch<SlugResult[]>(SLUGS_QUERY);
    postEntries = (posts ?? []).map(({ slug, publishedAt }) => ({
      url: `${baseUrl}${ROUTES.blogPost(slug)}`,
      lastModified: publishedAt ? new Date(publishedAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch (e) {
    console.warn("Failed to fetch posts from Sanity", e);
    // Omit dynamic post URLs on failure
  }

  // Public discover recipe URLs (SEO); only system recipes are included
  let recipeEntries: MetadataRoute.Sitemap = [];
  try {
    const sitemapRecipes = await fetchQuery(
      api.recipes.getSystemRecipeSitemapEntries,
    );
    recipeEntries = (sitemapRecipes ?? []).map((recipe) => ({
      url: `${baseUrl}${ROUTES.discoverRecipe(recipe.publicSlug)}`,
      lastModified: new Date(recipe.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch (e) {
    console.warn("Failed to fetch dynamic URLs from Convex", e);
    // Omit recipe URLs on failure
  }

  return [...staticEntries, ...recipeEntries, ...postEntries];
}
