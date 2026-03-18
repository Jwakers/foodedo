"use server";

import { requireSuperUser } from "@/lib/require-super-user";
import {
  BLOG_HERO_IMAGE_STYLES,
  buildBlogHeroImagePrompt,
  buildBlogHeroImagePromptOverride,
} from "@/lib/ai/blog-hero-image-prompt";
import { generateImage } from "ai";
import { z } from "zod";

const GenerateBlogHeroImageInputSchema = z.object({
  title: z.string().trim().min(1),
  excerpt: z.string().nullable().optional(),
  style: z.enum(BLOG_HERO_IMAGE_STYLES).default("generalAuto"),
  overridePrompt: z.string().nullable().optional(),
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

  const overridePrompt = parsed.data.overridePrompt?.trim() || "";
  const hasOverride = overridePrompt.length > 0;

  const variationHint = pickVariationHint(
    hasOverride ? "generalAuto" : parsed.data.style,
  );

  const promptUsed = hasOverride
    ? buildBlogHeroImagePromptOverride({
        title,
        excerpt,
        overridePrompt,
        variationHint,
      })
    : buildBlogHeroImagePrompt({
        title,
        excerpt,
        style: parsed.data.style,
        variationHint,
      });

  try {
    const result = await generateImage({
      model: DEFAULT_MODEL,
      prompt: promptUsed,
      aspectRatio: "16:9",
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

function pickVariationHint(
  style: (typeof BLOG_HERO_IMAGE_STYLES)[number],
) {
  const common = [
    "Change camera angle (overhead vs 45° vs close crop), but keep it hero-friendly and wide.",
    "Vary the surface/background (light marble, warm wood, neutral linen).",
  ];
  const byStyle: Record<(typeof BLOG_HERO_IMAGE_STYLES)[number], string[]> = {
    generalAuto: [
      "Auto variety: change camera angle and background; keep it wide and hero-friendly.",
      ...common,
    ],
    finishedDish: [
      "Plate style: rustic ceramic bowl vs modern white plate.",
      "Garnish: fresh herbs vs citrus zest vs sesame (only if relevant).",
      "Lighting: bright window light vs moodier side light.",
      ...common,
    ],
    ingredientsFlatlay: [
      "Ingredient arrangement: radial layout vs neat rows vs clustered composition.",
      "Include 1 hero ingredient prominently; keep the rest supporting.",
      "Add one neutral prop (knife or small bowl) but no clutter.",
      ...common,
    ],
    techniqueCloseup: [
      "Moment: sear crust, bubbling sauce, resting juices, crisp skin—match the topic.",
      "Macro detail: steam, texture, crisp edges, glaze sheen.",
      "Use shallow DoF for a cookbook technique shot; no hands.",
      ...common,
    ],
    lifestyleTableScene: [
      "Setting: casual weeknight vs weekend dinner vibe (still minimal).",
      "Add subtle context: one glass, linen napkin, cutlery—no clutter.",
      "Composition: dish centered with negative space for header crop.",
      ...common,
    ],
    minimalStillLife: [
      "Use lots of negative space; single subject with one accent prop only.",
      "Ultra-clean editorial mood: neutral tones, soft shadows.",
      "Avoid countertop prep; think gallery-like still life.",
      ...common,
    ],
  };

  const styleOptions = byStyle[style] ?? common;
  return styleOptions[Math.floor(Math.random() * styleOptions.length)] ?? "";
}

