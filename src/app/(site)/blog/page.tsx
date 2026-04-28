import { APP_NAME, ROUTES } from "@/app/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { openGraphSiteAndUrl } from "@/lib/og-metadata";
import { getSiteBaseUrl } from "@/lib/site-url";
import { client } from "@/sanity/client";
import { urlFor } from "@/sanity/image";
import type { PostListItem } from "@/sanity/types";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const POSTS_QUERY = `*[
  _type == "post"
  && defined(slug.current)
]|order(publishedAt desc)[0...12]{
  _id,
  title,
  slug,
  publishedAt,
  excerpt,
  mainImage
}`;

const REVALIDATE_SECONDS = 30;

const blogCanonical = `${getSiteBaseUrl()}${ROUTES.BLOG}`;
const SEO_GUIDES = [
  {
    title: "How to Turn Recipes Into One Grocery List",
    href: "/blog/how-to-turn-recipes-into-one-grocery-list",
    excerpt:
      "A practical recipe-to-list guide for creating one weekly grocery list.",
  },
  {
    title: "How to Combine Ingredients From Multiple Recipes",
    href: "/blog/how-to-combine-ingredients-from-multiple-recipes",
    excerpt:
      "Plan several meals and combine ingredients into one shopping-ready list.",
  },
  {
    title: "Weekly Meal Plan + Shopping List Guide",
    href: "/blog/weekly-meal-plan-and-shopping-list-guide",
    excerpt: "A repeatable weekly planning rhythm for households and families.",
  },
  {
    title: "How to Build a Weekly Meal Plan in 15 Minutes",
    href: "/blog/how-to-build-a-weekly-meal-plan-in-15-minutes",
    excerpt: "A quick routine for planning dinners when time is tight.",
  },
  {
    title: "How to Keep Meals Varied Without Overthinking It",
    href: "/blog/how-to-keep-meals-varied-without-overthinking-it",
    excerpt: "Avoid repeating the same meals with a simple weekly mix.",
  },
  {
    title: "Recipe App vs Meal Planner vs Grocery List App",
    href: "/blog/recipe-app-vs-meal-planner-vs-grocery-list-app",
    excerpt:
      "Compare tools and see why connected planning + shopping is easier.",
  },
] as const;

export const metadata: Metadata = {
  alternates: { canonical: blogCanonical },
  title: `Blog | ${APP_NAME}`,
  description:
    "Articles and tips for family meal planning, recipes, and making the most of your kitchen.",
  openGraph: {
    ...openGraphSiteAndUrl(blogCanonical),
    title: `Blog | ${APP_NAME}`,
    description:
      "Articles and tips for family meal planning, recipes, and making the most of your kitchen.",
  },
  twitter: {
    card: "summary_large_image",
    title: `Blog | ${APP_NAME}`,
    description:
      "Articles and tips for family meal planning, recipes, and making the most of your kitchen.",
  },
};

export default async function BlogPage() {
  let posts: PostListItem[] = [];
  try {
    posts = await client.fetch<PostListItem[]>(
      POSTS_QUERY,
      {},
      { next: { revalidate: REVALIDATE_SECONDS } },
    );
  } catch (e) {
    if (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
      throw e;
    }
    // Sanity not configured (e.g. at build without env)
  }
  posts = posts ?? [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href={ROUTES.HOME}>
            <ArrowLeft className="mr-2 size-4" />
            Back to Home
          </Link>
        </Button>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Blog</h1>
            <p className="text-muted-foreground">
              Articles and tips for family meal planning and cooking.
            </p>
          </div>

          <section aria-labelledby="featured-guides">
            <h2 id="featured-guides" className="text-2xl font-semibold mb-3">
              Featured guides
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {SEO_GUIDES.map((guide) => (
                <li key={guide.href}>
                  <Link href={guide.href}>
                    <Card className="h-full transition-colors hover:bg-muted/50">
                      <CardContent className="p-4">
                        <h3 className="text-lg font-semibold">{guide.title}</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          {guide.excerpt}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {!posts?.length ? (
            <p className="text-muted-foreground">
              No blog posts yet. Start with the featured guides above.
            </p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2">
              {posts.map((post) => {
                const imageUrl =
                  post.mainImage?.asset?._ref != null
                    ? urlFor(post.mainImage).width(400).height(220).url()
                    : null;
                return (
                  <li key={post._id}>
                    <Link href={ROUTES.blogPost(post.slug.current)}>
                      <Card className="h-full overflow-hidden transition-colors hover:bg-muted/50 pt-0">
                        {imageUrl && (
                          <div className="relative aspect-video w-full bg-muted">
                            <Image
                              src={imageUrl}
                              alt={post.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 100vw, 50vw"
                            />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <h2 className="text-xl font-semibold line-clamp-2">
                            {post.title}
                          </h2>
                          {post.publishedAt && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(post.publishedAt).toLocaleDateString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </p>
                          )}
                          {post.excerpt && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {post.excerpt}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
