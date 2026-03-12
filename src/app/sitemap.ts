import { ROUTES } from "@/app/constants";
import { client } from "@/sanity/client";
import { api } from "convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import type { MetadataRoute } from "next";

const SLUGS_QUERY = `*[_type == "post" && defined(slug.current)]{ "slug": slug.current, publishedAt }`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.VERCEL_URL
    ? `${process.env.NODE_ENV === "production" ? "https://" : "http://"}${process.env.VERCEL_URL}`
    : "https://foodedo-app.com";

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
      url: `${baseUrl}/${ROUTES.PRIVACY}`,
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
      url: `${baseUrl}/blog/${slug}`,
      lastModified: publishedAt ? new Date(publishedAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // If Sanity is not configured or fetch fails, omit dynamic post URLs
  }

  let recipeEntries: MetadataRoute.Sitemap = [];
  try {
    const systemRecipes = await fetchQuery(api.recipes.getSystemRecipes);
    recipeEntries = (systemRecipes ?? []).map((recipe) => ({
      url: `${baseUrl}/recipe/${recipe._id}`,
      lastModified: recipe.updatedAt ? new Date(recipe.updatedAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // If Convex is not configured or fetch fails, omit recipe URLs
  }

  return [...staticEntries, ...recipeEntries, ...postEntries];
}
