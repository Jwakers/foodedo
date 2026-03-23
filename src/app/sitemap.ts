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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteBaseUrl();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}${ROUTES.DISCOVER}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}${ROUTES.BLOG}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}${ROUTES.FAQ}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${baseUrl}${ROUTES.PRIVACY}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}${ROUTES.TERMS}`,
      lastModified: new Date(),
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
