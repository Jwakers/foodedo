/**
 * Shared helper functions for recipe parsing
 * Used by both text and image-based recipe parsing
 */

import {
  type ParsedRecipeFromText,
  type StructuredIngredient,
} from "@/lib/types/recipe-parser";
import {
  validatePreparation,
  validateUnit,
} from "@/lib/utils/recipe-validation";
import {
  COMPLEXITY_TIERS,
  CUISINE_MAX_SELECTIONS,
  CUISINES,
  PREPARATION_OPTIONS,
  PRIMARY_PROTEINS,
  RECIPE_CATEGORIES,
  UNITS,
} from "convex/lib/constants";

/**
 * Generates units string from constants for AI prompts
 */
export function generateUnitsString(): string {
  return `Available units (CHOOSE FROM THESE ONLY): 
  Volume: ${UNITS.volume.join(", ")}
  Weight: ${UNITS.weight.join(", ")}
  Count: ${UNITS.count.join(", ")}
  Items: ${UNITS.items.join(", ")}`;
}

/**
 * Generates preparations string from constants for AI prompts
 */
export function generatePreparationsString(): string {
  return `Available preparations (CHOOSE FROM THESE ONLY - if no exact match, omit preparation): 
  ${PREPARATION_OPTIONS.join(", ")}`;
}

/**
 * Cleans and validates ingredients from AI response
 * Converts null values to undefined for optional fields
 */
export function cleanIngredients(
  ingredients: Array<{
    name: string;
    amount?: number | null;
    unit?: string | null;
    preparation?: string | null;
  }>,
): StructuredIngredient[] {
  return ingredients.map((ing) => ({
    name: ing.name,
    amount: ing.amount ?? undefined,
    unit: validateUnit(ing.unit ?? undefined),
    preparation: validatePreparation(ing.preparation ?? undefined),
  }));
}

/**
 * Cleans method steps from AI response
 * Converts null descriptions to undefined for optional fields
 */
export function cleanMethodSteps(
  method: Array<{
    title: string;
    description?: string | null;
  }>,
): Array<{
  title: string;
  description?: string;
}> {
  return method.map((step) => ({
    title: step.title,
    ...(step.description != null && { description: step.description }),
  }));
}

/**
 * Extracts partial recipe data from incomplete AI responses
 * Allows users to edit and complete the recipe manually
 */
export function extractPartialRecipeData(
  jsonData: unknown,
): Partial<ParsedRecipeFromText> | null {
  try {
    if (!jsonData || typeof jsonData !== "object") {
      return null;
    }

    const data = jsonData as Record<string, unknown>;
    const partial: Partial<ParsedRecipeFromText> = {};

    const title =
      typeof data.title === "string" && data.title.length > 0
        ? data.title
        : undefined;
    if (title) partial.title = title;

    const description =
      typeof data.description === "string" && data.description.length > 0
        ? data.description
        : undefined;
    if (description) partial.description = description;

    const prepTime =
      typeof data.prepTime === "number" ? data.prepTime : undefined;
    if (prepTime !== undefined) partial.prepTime = prepTime;

    const cookTime =
      typeof data.cookTime === "number" ? data.cookTime : undefined;
    if (cookTime !== undefined) partial.cookTime = cookTime;

    const serves = typeof data.serves === "number" ? data.serves : undefined;
    if (serves !== undefined) partial.serves = serves;

    const category =
      typeof data.category === "string" ? data.category : undefined;
    if (
      category &&
      RECIPE_CATEGORIES.includes(category as (typeof RECIPE_CATEGORIES)[number])
    ) {
      partial.category = category as (typeof RECIPE_CATEGORIES)[number];
    }

    if (Array.isArray(data.ingredients)) {
      const ingredients = data.ingredients
        .filter(
          (ing: unknown): ing is Record<string, unknown> & { name: string } =>
            typeof ing === "object" &&
            ing !== null &&
            "name" in ing &&
            typeof ing.name === "string",
        )
        .map((ing) => ({
          name: ing.name,
          amount: typeof ing.amount === "number" ? ing.amount : undefined,
          unit: validateUnit(
            typeof ing.unit === "string" ? ing.unit : undefined,
          ),
          preparation: validatePreparation(
            typeof ing.preparation === "string" ? ing.preparation : undefined,
          ),
        }));
      if (ingredients.length > 0) {
        partial.ingredients = ingredients as StructuredIngredient[];
      }
    }

    if (Array.isArray(data.method)) {
      const method = data.method
        .filter(
          (
            step: unknown,
          ): step is Record<string, unknown> & { title: string } =>
            typeof step === "object" &&
            step !== null &&
            "title" in step &&
            typeof step.title === "string",
        )
        .map((step) => ({
          title: step.title,
          description:
            typeof step.description === "string" ? step.description : undefined,
        }));
      if (method.length > 0) {
        partial.method = method as Array<{
          title: string;
          description?: string;
        }>;
      }
    }

    if (data.nutrition && typeof data.nutrition === "object") {
      const nutrition = data.nutrition as Record<string, unknown>;
      const calories =
        typeof nutrition.calories === "number" ? nutrition.calories : undefined;
      const protein =
        typeof nutrition.protein === "number" ? nutrition.protein : undefined;
      const fat = typeof nutrition.fat === "number" ? nutrition.fat : undefined;
      const carbohydrates =
        typeof nutrition.carbohydrates === "number"
          ? nutrition.carbohydrates
          : undefined;

      if (
        calories !== undefined &&
        protein !== undefined &&
        fat !== undefined &&
        carbohydrates !== undefined
      ) {
        partial.nutrition = { calories, protein, fat, carbohydrates };
      }
    }

    // Meal-plan optional fields
    const primaryProtein = typeof data.primaryProtein === "string" ? data.primaryProtein : undefined;
    if (
      primaryProtein &&
      PRIMARY_PROTEINS.includes(primaryProtein as (typeof PRIMARY_PROTEINS)[number])
    ) {
      partial.primaryProtein = primaryProtein as (typeof PRIMARY_PROTEINS)[number];
    }
    const complexityTier = typeof data.complexityTier === "string" ? data.complexityTier : undefined;
    if (
      complexityTier &&
      COMPLEXITY_TIERS.includes(
        complexityTier as (typeof COMPLEXITY_TIERS)[number],
      )
    ) {
      partial.complexityTier = complexityTier as (typeof COMPLEXITY_TIERS)[number];
    }
    if (Array.isArray(data.cuisine) && data.cuisine.length > 0) {
      const valid = data.cuisine
        .filter(
          (c: unknown): c is string =>
            typeof c === "string" && CUISINES.includes(c as (typeof CUISINES)[number]),
        )
        .slice(0, CUISINE_MAX_SELECTIONS) as (typeof CUISINES)[number][];
      if (valid.length > 0) {
        partial.cuisine = valid;
      }
    }

    if (Object.keys(partial).length >= 2) {
      return partial;
    }

    return null;
  } catch (error) {
    console.error("Error extracting partial data:", error);
    return null;
  }
}
