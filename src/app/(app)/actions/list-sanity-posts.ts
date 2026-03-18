"use server";

import { requireSuperUser } from "@/lib/require-super-user";
import { client, isSanityConfigured } from "@/sanity/client";
import { z } from "zod";

const ListSanityPostsInputSchema = z.object({
  q: z.string().nullable().optional(),
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(50).default(20),
});

export type ListSanityPostsInput = z.infer<typeof ListSanityPostsInputSchema>;

export type SanityPostListRow = {
  _id: string;
  title?: string;
  excerpt?: string;
  publishedAt?: string;
  slug?: { current?: string };
  hasMainImage: boolean;
  isDraft: boolean;
};

export type ListSanityPostsResult =
  | { success: true; posts: SanityPostListRow[]; total: number }
  | { success: false; error: string };

const POSTS_QUERY = `{
  "total": count(*[
    _type == "post"
    && (!defined($q) || $q == "" || title match text::query($q) || excerpt match text::query($q))
  ]),
  "posts": *[
    _type == "post"
    && (!defined($q) || $q == "" || title match text::query($q) || excerpt match text::query($q))
  ]|order(publishedAt desc, _updatedAt desc)[$offset...$end]{
    _id,
    title,
    excerpt,
    publishedAt,
    slug,
    "hasMainImage": defined(mainImage.asset),
    "isDraft": _id in path("drafts.**")
  }
}`;

export async function listSanityPosts(rawInput: unknown): Promise<ListSanityPostsResult> {
  await requireSuperUser();

  if (!isSanityConfigured) {
    return { success: false, error: "Sanity is not configured." };
  }

  const parsed = ListSanityPostsInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: "Invalid input." };
  }

  const { q, offset, limit } = parsed.data;
  const end = offset + limit;

  try {
    const res = await client.fetch<{ total: number; posts: SanityPostListRow[] }>(
      POSTS_QUERY,
      { q: q?.trim() ?? "", offset, end },
      { cache: "no-store" },
    );
    return {
      success: true,
      posts: res?.posts ?? [],
      total: res?.total ?? 0,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list posts.";
    return { success: false, error: message };
  }
}

