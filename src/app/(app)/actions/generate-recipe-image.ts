"use server";

import { requireSuperUser } from "@/lib/require-super-user";
import { generateImage } from "ai";
import { z } from "zod";
import { buildImagePrompt } from "../../../../scripts/image-generation-prompt";

const DEFAULT_MODEL = "google/imagen-4.0-ultra-generate-001";

const GenerateRecipeImageInputSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().nullable().optional(),
  method: z
    .array(
      z.object({
        title: z.string().trim().min(1),
        description: z.string().nullable().optional(),
      }),
    )
    .optional()
    .default([]),
});

export type GenerateRecipeImageResult =
  | {
      success: true;
      base64: string;
      mediaType: string;
      promptUsed: string;
    }
  | { success: false; error: string };

export async function generateRecipeImageWithAI(
  rawInput: unknown,
): Promise<GenerateRecipeImageResult> {
  await requireSuperUser();

  const parsed = GenerateRecipeImageInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: "Invalid input." };
  }

  if (!process.env.AI_GATEWAY_API_KEY) {
    return {
      success: false,
      error: "AI_GATEWAY_API_KEY is required for image generation.",
    };
  }

  const { title, description, method } = parsed.data;
  const promptUsed = buildImagePrompt(title, description ?? "", method);

  try {
    const result = await generateImage({
      model: DEFAULT_MODEL,
      prompt: promptUsed,
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(30_000),
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

