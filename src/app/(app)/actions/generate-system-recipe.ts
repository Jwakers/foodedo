"use server";

import { requireSuperUser } from "@/lib/require-super-user";
import type { StructuredIngredient } from "@/lib/types/recipe-parser";
import { generateText, Output } from "ai";
import {
  COMPLEXITY_TIERS,
  CUISINE_MAX_SELECTIONS,
  CUISINES,
  PRIMARY_PROTEINS,
  RECIPE_CATEGORIES,
} from "convex/lib/constants";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { z } from "zod";
import {
  cleanIngredients,
  cleanMethodSteps,
  generatePreparationsString,
  generateUnitsString,
} from "./recipe-parsing-helpers";

const DEFAULT_SYSTEM_RECIPE_MODEL = "anthropic/claude-sonnet-4.6";

function getSystemRecipeModel(): string {
  const configured = process.env.FOODEDO_SYSTEM_RECIPE_AI_MODEL?.trim();
  return configured && configured.length > 0
    ? configured
    : DEFAULT_SYSTEM_RECIPE_MODEL;
}

const GenerateSystemRecipeInputSchema = z.object({
  guidance: z.string().min(1, "Guidance is required"),
});

const GeneratedSystemRecipeSchema = z.object({
  title: z
    .string()
    .refine((value) => value.trim().length > 0, { message: "cannot be blank" }),
  description: z.string().nullable(),
  prepTime: z.number().int().min(0),
  cookTime: z.number().int().min(0).nullable(),
  serves: z.number().int().min(1),
  category: z.enum(RECIPE_CATEGORIES),
  ingredients: z.array(
    z.object({
      name: z
        .string()
        .refine((value) => value.trim().length > 0, { message: "cannot be blank" }),
      amount: z
        .number()
        .nullable()
        .refine((value) => value == null || value > 0, {
          message: "must be positive",
        }),
      unit: z.string().nullable(),
      preparation: z.string().nullable(),
    }),
  ),
  method: z.array(
    z.object({
      title: z
        .string()
        .refine((value) => value.trim().length > 0, { message: "cannot be blank" }),
      description: z.string().nullable(),
    }),
  ),
  nutrition: z.object({
    calories: z.number().min(0),
    protein: z.number().min(0),
    fat: z.number().min(0),
    carbohydrates: z.number().min(0),
  }),
  primaryProtein: z.enum(PRIMARY_PROTEINS).nullable(),
  complexityTier: z.enum(COMPLEXITY_TIERS).nullable(),
  cuisine: z.array(z.enum(CUISINES)).min(1).max(CUISINE_MAX_SELECTIONS),
});

async function loadRecipeGenerationGuidance(): Promise<string> {
  const promptPath = path.join(
    process.cwd(),
    "docs",
    "RECIPE-GENERATION-PROMPT.md",
  );
  const methodPath = path.join(
    process.cwd(),
    "docs",
    "RECIPE_AUTHORING_METHODOLOGY.md",
  );
  const [promptDoc, methodDoc] = await Promise.all([
    fs.readFile(promptPath, "utf8"),
    fs.readFile(methodPath, "utf8"),
  ]);
  return `${promptDoc.trim()}\n\n${methodDoc.trim()}`;
}

type MethodStepPayload = {
  title: string;
  description?: string;
};

export type GeneratedSystemRecipePayload = {
  title: string;
  description: string | null;
  prepTime: number;
  cookTime: number | null;
  serves: number;
  category: (typeof RECIPE_CATEGORIES)[number];
  ingredients: StructuredIngredient[];
  method: MethodStepPayload[];
  nutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
  };
  primaryProtein?: (typeof PRIMARY_PROTEINS)[number];
  complexityTier?: (typeof COMPLEXITY_TIERS)[number];
  cuisine?: (typeof CUISINES)[number][];
};

export async function generateSystemRecipeWithAI(
  rawInput: unknown,
): Promise<
  | { success: true; recipe: GeneratedSystemRecipePayload }
  | { success: false; error: string }
> {
  await requireSuperUser();

  const parsed = GenerateSystemRecipeInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: "Guidance is required." };
  }

  try {
    const [guidanceDoc, unitsString, preparationsString] = await Promise.all([
      loadRecipeGenerationGuidance(),
      Promise.resolve(generateUnitsString()),
      Promise.resolve(generatePreparationsString()),
    ]);

    const result = await generateText({
      model: getSystemRecipeModel(),
      system: `You generate production-ready system recipes for Foodedo.

You MUST follow this guidance:
${guidanceDoc}

Additional output requirements:
- Return exactly one recipe.
- Keep recipe language natural and practical.
- Do not include pantry staples such as salt, pepper, or generic oil in ingredients.
- Use only allowed units and preparation values.
- Ensure method steps are clear and complete for a home cook.
- Use null where optional values do not apply.
- Category must be one of the allowed schema values.
- If uncertain on metadata fields, prefer null (for nullable) instead of inventing data.

${unitsString}

${preparationsString}`,
      prompt: `Create one system recipe using this guidance:

${parsed.data.guidance}

Return JSON only.`,
      output: Output.object({
        schema: GeneratedSystemRecipeSchema,
        name: "foodedo_system_recipe",
      }),
      temperature: 0.4,
    });

    const validation = GeneratedSystemRecipeSchema.safeParse(result.output);
    if (!validation.success) {
      return { success: false, error: "AI returned invalid recipe data." };
    }

    const raw = validation.data;

    const ingredients = cleanIngredients(
      raw.ingredients.map((ingredient) => ({
        name: ingredient.name.trim(),
        amount: ingredient.amount,
        unit: ingredient.unit,
        preparation: ingredient.preparation,
      })),
    ).filter((ingredient) => ingredient.name.trim().length > 0);

    const method = cleanMethodSteps(
      raw.method.map((step) => ({
        title: step.title.trim(),
        description: step.description,
      })),
    ).filter((step) => step.title.trim().length > 0);

    if (ingredients.length === 0 || method.length === 0) {
      return {
        success: false,
        error: "Generated recipe must include ingredients and method steps.",
      };
    }

    const recipe: GeneratedSystemRecipePayload = {
      title: raw.title.trim(),
      description:
        raw.description && raw.description.trim().length > 0
          ? raw.description.trim()
          : null,
      prepTime: Math.max(0, Math.round(raw.prepTime)),
      cookTime:
        raw.cookTime == null ? null : Math.max(0, Math.round(raw.cookTime)),
      serves: Math.max(1, Math.round(raw.serves)),
      category: raw.category,
      ingredients: ingredients.map((ingredient) => ({
        name: ingredient.name,
        ...(ingredient.amount != null && { amount: ingredient.amount }),
        ...(ingredient.unit != null && { unit: ingredient.unit }),
        ...(ingredient.preparation != null && {
          preparation: ingredient.preparation,
        }),
      })),
      method: method.map((step) => ({
        title: step.title,
        ...(step.description != null && { description: step.description }),
      })),
      nutrition: {
        calories: Math.max(0, Math.round(raw.nutrition.calories)),
        protein: Math.max(0, Math.round(raw.nutrition.protein)),
        fat: Math.max(0, Math.round(raw.nutrition.fat)),
        carbohydrates: Math.max(0, Math.round(raw.nutrition.carbohydrates)),
      },
      ...(raw.primaryProtein != null && { primaryProtein: raw.primaryProtein }),
      ...(raw.complexityTier != null && { complexityTier: raw.complexityTier }),
      ...(raw.cuisine.length > 0 && { cuisine: raw.cuisine }),
    };

    return { success: true, recipe };
  } catch (error) {
    console.error("generateSystemRecipeWithAI error:", error);
    return {
      success: false,
      error: "Something went wrong while generating the system recipe.",
    };
  }
}
