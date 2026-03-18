"use server";

import { requireSuperUser } from "@/lib/require-super-user";
import { buildBlogHeroImagePrompt } from "@/lib/ai/blog-hero-image-prompt";
import { generateImage } from "ai";
import { z } from "zod";

const GenerateBlogHeroImageInputSchema = z.object({
  title: z.string().min(1),
  excerpt: z.string().nullable().optional(),
});

export type GenerateBlogHeroImageResult =
  | {
      success: true;
      base64: string;
      mediaType: string;
      promptUsed: string;
    }
  | { success: false; error: string };

const DEFAULT_MODEL = "google/imagen-4.0-ultra-generate-001";

export async function generateBlogHeroImage(
  rawInput: unknown,
): Promise<GenerateBlogHeroImageResult> {
  await requireSuperUser();

  const parsed = GenerateBlogHeroImageInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: "Invalid input." };
  }

  if (!process.env.AI_GATEWAY_API_KEY) {
    return {
      success: false,
      error: "AI_GATEWAY_API_KEY is required for image generation.",
    };
  }

  const { title, excerpt } = parsed.data;
  const promptUsed = buildBlogHeroImagePrompt({ title, excerpt });

  try {
    const result = await generateImage({
      model: DEFAULT_MODEL,
      prompt: promptUsed,
      aspectRatio: "16:9",
    });
    const img = result.image;
    if (!img?.base64) {
      return { success: false, error: "No image returned by the model." };
    }
    return {
      success: true,
      base64: img.base64,
      mediaType: img.mediaType ?? "image/png",
      promptUsed,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to generate image.";
    return { success: false, error: message };
  }
}

