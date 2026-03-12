import { APP_NAME, ROUTES } from "@/app/constants";
import { client } from "@/sanity/client";
import { urlFor } from "@/sanity/image";
import type { Post } from "@/sanity/types";
import { Button } from "@/components/ui/button";
import { PortableText } from "next-sanity";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]{
  _id,
  title,
  slug,
  publishedAt,
  excerpt,
  mainImage,
  body
}`;

const SLUGS_QUERY = `*[_type == "post" && defined(slug.current)]{ "slug": slug.current }`;

const REVALIDATE_SECONDS = 30;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let post: Post | null = null;
  try {
    post = await client.fetch<Post | null>(
      POST_QUERY,
      { slug },
      { next: { revalidate: REVALIDATE_SECONDS } },
    );
  } catch (e) {
    if (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
      throw e;
    }
    // Sanity not configured (e.g. build without env)
  }
  if (!post) {
    return { title: "Post not found" };
  }
  const title = `${post.title} | ${APP_NAME}`;
  const description =
    post.excerpt?.slice(0, 160) ?? `Read ${post.title} on the ${APP_NAME} blog.`;
  const ogImage =
    post.mainImage?.asset?._ref != null
      ? urlFor(post.mainImage).width(1200).height(630).url()
      : undefined;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export async function generateStaticParams() {
  try {
    const slugs = await client.fetch<{ slug: string }[]>(
      SLUGS_QUERY,
      {},
      { next: { revalidate: REVALIDATE_SECONDS } },
    );
    return (slugs ?? []).map(({ slug }) => ({ slug }));
  } catch {
    return [];
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  let post: Post | null = null;
  try {
    post = await client.fetch<Post | null>(
      POST_QUERY,
      { slug },
      { next: { revalidate: REVALIDATE_SECONDS } },
    );
  } catch (e) {
    if (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
      throw e;
    }
    // Sanity not configured (e.g. build without env)
  }

  if (!post) {
    notFound();
  }

  const imageUrl =
    post.mainImage?.asset?._ref != null
      ? urlFor(post.mainImage).width(800).height(450).url()
      : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href={ROUTES.BLOG}>
            <span className="mr-2">←</span>
            Back to Blog
          </Link>
        </Button>

        <article className="space-y-6">
          <header>
            <h1 className="text-4xl font-bold tracking-tight">{post.title}</h1>
            {post.publishedAt && (
              <p className="text-muted-foreground mt-2">
                {new Date(post.publishedAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
            {post.excerpt && (
              <p className="text-lg text-muted-foreground mt-2">
                {post.excerpt}
              </p>
            )}
          </header>

          {imageUrl && (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
              <Image
                src={imageUrl}
                alt={post.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 672px"
              />
            </div>
          )}

          {Array.isArray(post.body) && post.body.length > 0 && (
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <PortableText
                value={post.body as React.ComponentProps<typeof PortableText>["value"]}
                components={{
                  types: {
                    pteImage: ({
                      value,
                    }: {
                      value?: {
                        asset?: { _ref: string };
                        alt?: string;
                        [key: string]: unknown;
                      };
                    }) => {
                      if (!value?.asset?._ref) return null;
                      try {
                        const src = urlFor(value).width(800).url();
                        return (
                          <figure className="my-6">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={src}
                              alt={value.alt ?? ""}
                              className="rounded-lg w-full"
                            />
                          </figure>
                        );
                      } catch {
                        return null;
                      }
                    },
                  },
                }}
              />
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
