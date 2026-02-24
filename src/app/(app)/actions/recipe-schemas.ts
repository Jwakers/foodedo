/**
 * Shared Zod schemas for recipe parsing
 * Used by both text and image-based recipe parsing
 */

import {
  COMPLEXITY_TIERS,
  CUISINES,
  PRIMARY_PROTEINS,
  RECIPE_CATEGORIES,
} from "convex/lib/constants";
import { z } from "zod";

// Zod schemas for validation (single source of truth)
// Note: Using nullable() instead of optional() for OpenAI strict mode compatibility
// OpenAI strict mode requires all properties to be in the required array
export const IngredientSchemaForAI = z.object({
  name: z.string(),
  amount: z.number().nullable(),
  unit: z.string().nullable(),
  preparation: z.string().nullable(),
});

// Method step schema for AI (description is nullable for OpenAI strict mode)
export const MethodStepSchemaForAI = z.object({
  title: z.string().describe("Short descriptive title (3-5 words)"),
  description: z.string().nullable().describe("Complete instruction text"),
});

export const TextRecipeSchema = z.object({
  success: z.boolean(),
  errorMessage: z.string(),
  title: z.string(),
  description: z.string(),
  prepTime: z.number(),
  cookTime: z.number(),
  serves: z.number(),
  category: z.enum(RECIPE_CATEGORIES),
  ingredients: z.array(IngredientSchemaForAI),
  method: z.array(MethodStepSchemaForAI),
  nutrition: z.object({
    calories: z.number(),
    protein: z.number(),
    fat: z.number(),
    carbohydrates: z.number(),
  }),
  primaryProtein: z.enum(PRIMARY_PROTEINS).nullable().optional(),
  complexityTier: z.enum(COMPLEXITY_TIERS),
  cuisine: z.array(z.enum(CUISINES)).min(1).max(1),
});

export const HtmlRecipeSchema = z.object({
  title: z.string(),
  description: z.string(),
  prepTime: z.number(),
  cookTime: z.number(),
  serves: z.number(),
  category: z.enum(RECIPE_CATEGORIES),
  ingredients: z.array(IngredientSchemaForAI),
  method: z.array(MethodStepSchemaForAI),
  imageUrl: z.string(),
  author: z.string(),
  primaryProtein: z.enum(PRIMARY_PROTEINS).nullable().optional(),
  complexityTier: z.enum(COMPLEXITY_TIERS),
  cuisine: z.array(z.enum(CUISINES)).min(1).max(1),
});

// Image recipe schema (same as TextRecipeSchema but kept separate for clarity)
export const ImageRecipeSchema = TextRecipeSchema;
