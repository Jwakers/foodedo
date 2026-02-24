import {
  COMPLEXITY_TIERS,
  CUISINE_MAX_SELECTIONS,
  CUISINES,
  PREPARATION_OPTIONS,
  PRIMARY_PROTEINS,
  RECIPE_CATEGORIES,
  UNITS_FLAT,
} from "convex/lib/constants";
import { z } from "zod";

// ============================================================================
// BASE RECIPE SCHEMA - Shared fields across all recipe forms
// ============================================================================

const baseIngredientSchema = z.object({
  name: z.string().min(1, "Ingredient name is required"),
  amount: z.number().positive("Amount must be greater than 0").optional(),
  unit: z.enum(UNITS_FLAT).optional(),
  preparation: z.enum(PREPARATION_OPTIONS).optional(),
});

const baseMethodStepSchema = z.object({
  title: z.string().min(1, "Step title is required"),
  description: z.string().optional(),
});

const baseRecipeSchema = z.object({
  title: z.string().trim().min(1, "Recipe title is required"),
  description: z.string().optional(),
  prepTime: z.number().int().min(0, "Prep time must be 0 or greater"),
  cookTime: z
    .number()
    .int()
    .min(0, "Cook time must be 0 or greater")
    .optional(),
  serves: z.number().int().min(1, "Must serve at least 1 person"),
  category: z.enum(RECIPE_CATEGORIES, {
    error: "Please select a valid category",
  }),
  ingredients: z.array(baseIngredientSchema),
  method: z.array(baseMethodStepSchema),
  primaryProtein: z.enum(PRIMARY_PROTEINS).nullable().optional(),
  complexityTier: z.enum(COMPLEXITY_TIERS).nullable().optional(),
  cuisine: z.array(z.enum(CUISINES)).max(CUISINE_MAX_SELECTIONS).optional(),
});

// ============================================================================
// SCHEMA VARIANTS - Extended for specific use cases
// ============================================================================

/**
 * Schema for creating a new recipe (via form)
 * - Uses File for image uploads
 * - Method steps can have File images
 * - Requires prepTime >= 1 (enforced via refine)
 * - No minimum array requirements (user can save incomplete recipes)
 */
export const recipeCreateSchema = baseRecipeSchema
  .extend({
    image: z.instanceof(File).optional(),
    method: z.array(
      baseMethodStepSchema.extend({
        image: z.instanceof(File).optional(),
      }),
    ),
  })
  .refine((data) => data.prepTime >= 1, {
    message: "Prep time must be at least 1 minute",
    path: ["prepTime"],
  });

/**
 * Schema for editing an existing recipe
 * - Uses string for image storage IDs (already uploaded)
 * - Method steps use string for image storage IDs
 * - Allows prepTime = 0 (for no-prep recipes)
 */
export const recipeEditSchema = baseRecipeSchema.extend({
  method: z.array(
    baseMethodStepSchema.extend({
      image: z.string().optional(), // Storage ID for the image
    }),
  ),
});

/**
 * Schema for imported recipes (from AI parsing or URL scraping)
 * - Uses imageUrl (string) instead of File
 * - Includes nutrition data
 * - Includes source metadata (originalUrl, originalAuthor, etc.)
 * - Requires at least 1 ingredient and 1 method step
 * - Requires prepTime >= 1
 */
export const recipeImportSchema = baseRecipeSchema
  .extend({
    imageUrl: z.string().optional(),
    nutrition: z
      .object({
        calories: z.number().int().optional(),
        protein: z.number().int().optional(),
        fat: z.number().int().optional(),
        carbohydrates: z.number().int().optional(),
      })
      .optional(),
    // Source metadata fields - passed through but not editable by user
    originalUrl: z.string().optional(),
    originalAuthor: z.string().optional(),
    originalPublishedDate: z.string().optional(),
  })
  .refine((data) => data.ingredients.length >= 1, {
    message: "Must have at least 1 ingredient",
    path: ["ingredients"],
  })
  .refine((data) => data.method.length >= 1, {
    message: "Must have at least 1 method step",
    path: ["method"],
  })
  .refine((data) => data.prepTime >= 1, {
    message: "Prep time must be at least 1 minute",
    path: ["prepTime"],
  });

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type RecipeCreateFormData = z.infer<typeof recipeCreateSchema>;
export type RecipeEditFormData = z.infer<typeof recipeEditSchema>;
export type RecipeImportFormData = z.infer<typeof recipeImportSchema>;
