"use server";

import { getSanityWriteClient, isSanityWriteConfigured } from "@/sanity/write-client";
import { markdownToPortableText } from "@/sanity/markdown-to-portable-text";
import { requireSuperUser } from "@/lib/require-super-user";
import { z } from "zod";

const CreateSanityPostDraftSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string(),
  markdownBody: z.string(),
});

export type CreateSanityPostDraftInput = z.infer<typeof CreateSanityPostDraftSchema>;

export type CreateSanityPostDraftResult =
  | { success: true; sanityId: string; studioEditUrl?: string }
  | { success: false; error: string };

export async function createSanityPostDraft(
  rawInput: unknown
): Promise<CreateSanityPostDraftResult> {
  await requireSuperUser();

  if (!isSanityWriteConfigured) {
    return {
      success: false,
      error: "Sanity write is not configured (missing SANITY_API_WRITE_TOKEN).",
    };
  }

  const parsed = CreateSanityPostDraftSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: "Invalid input: title, slug, excerpt, and markdownBody are required." };
  }

  const { title, slug, excerpt, markdownBody } = parsed.data;

  try {
    const body = markdownToPortableText(markdownBody);
    const client = getSanityWriteClient();
    const draftId = `drafts.${crypto.randomUUID()}`;

    await client.createOrReplace({
      _id: draftId,
      _type: "post",
      title,
      slug: { _type: "slug", current: slug },
      excerpt: excerpt || undefined,
      body,
      publishedAt: new Date().toISOString(),
    });

    // Optional: link to open this document in Sanity Studio (set NEXT_PUBLIC_SANITY_STUDIO_URL)
    const studioBase = process.env.NEXT_PUBLIC_SANITY_STUDIO_URL;
    const studioEditUrl = studioBase
      ? `${studioBase.replace(/\/$/, "")}/desk/post;${draftId}`
      : undefined;

    return {
      success: true,
      sanityId: draftId,
      studioEditUrl,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create Sanity draft.";
    return { success: false, error: message };
  }
}
