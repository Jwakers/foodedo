"use server";

import {
  type ParsedRecipeForDB,
  type ParsedRecipeFromText,
} from "@/lib/types/recipe-parser";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import {
  COMPLEXITY_TIERS,
  CUISINES,
  PRIMARY_PROTEINS,
  RECIPE_LIMITS,
} from "convex/lib/constants";
import {
  cleanIngredients,
  cleanMethodSteps,
  extractPartialRecipeData,
  generatePreparationsString,
  generateUnitsString,
} from "./recipe-parsing-helpers";
import { ImageRecipeSchema } from "./recipe-schemas";

// ============================================================================
// Helper Functions (imported from shared module)
// ============================================================================
// Helper functions are imported from recipe-parsing-helpers.ts

function buildImageRecipePrompt(): string {
  const unitsString = generateUnitsString();
  const preparationsString = generatePreparationsString();

  return `You are an expert recipe parser extracting structured recipe data from photographs of recipe pages.

You will receive one or more images of recipe pages. Extract all recipe information from these images and return a structured recipe.

${unitsString}

${preparationsString}

Allowed values for meal-plan fields (USE THESE EXACT VALUES ONLY):

Primary protein (primaryProtein) - CHOOSE EXACTLY ONE FROM: ${PRIMARY_PROTEINS.join(", ")}

Complexity tier (complexityTier) - CHOOSE EXACTLY ONE FROM: ${COMPLEXITY_TIERS.join(", ")}

Cuisine (cuisine) - CHOOSE EXACTLY ONE FROM for the single-element array: ${CUISINES.join(", ")}

CRITICAL INSTRUCTIONS:

For success (REQUIRED):
- If the images contain a valid recipe, set "success" to true and "errorMessage" to "" (empty string)
- If the images do NOT contain a recipe (e.g., blank pages, non-recipe content, unreadable text), set "success" to false and provide a clear "errorMessage"
- If the images are too blurry or unreadable, set "success" to false with errorMessage explaining the issue

For title (REQUIRED):
- Extract the recipe name from the images
- If multiple recipes are visible, focus on the primary/complete recipe
- NEVER leave this empty if success is true

For description (REQUIRED):
- Extract the recipe description or introduction from the images
- If not present, generate an engaging 2-3 sentence description based on the recipe
- NEVER leave this empty if success is true

For timing (REQUIRED):
- Extract prep and cook times if mentioned in the images
- Convert to minutes (e.g., "1 hour 30 minutes" = 90)
- If not stated, estimate based on recipe complexity
- Use 0 for cookTime if it's a no-cook recipe
- NEVER leave these undefined if success is true

For ingredients (CRITICAL):
- Extract ALL ingredients visible in the images
- EVERY ingredient MUST have a "name" field - NEVER leave it undefined
- Extract numeric amount (convert fractions: 1/2 = 0.5, 1/4 = 0.25, 1/3 = 0.33)
- If amount is 0, missing, or unclear, use sensible defaults:
  * Garlic cloves: use "clove" unit, amount 2-4 typical
  * Fresh herbs: use "sprig" or "bunch" or "handful"
  * Spices/seasonings: use "pinch" or "dash" or 1 tsp
  * Vegetables: use "piece" or "whole" or standard weight
  * Canned/packaged items: use "can", "jar", "packet"
- ALWAYS match units to available units above
- Extract ingredient name (without amount, unit, or preparation)
- Identify preparation method from available options
- Remove parenthetical notes like "(28 ounce)" from the name
- Remove trailing text like "divided", "or to taste", "optional"
- If an ingredient has multiple preparations, combine with commas
- If the preparation term doesn't exactly match an available option, omit it
- Quality over quantity - better to have fewer complete ingredients than many with missing names

For method steps (VERY IMPORTANT):
- Extract ALL cooking/preparation steps visible in the images
- Keep ALL original instruction steps - DO NOT combine or condense
- For EACH step, create a short descriptive title (3-5 words)
- PRESERVE the COMPLETE original instruction text in the "description" field
- DO NOT shorten, summarize, or paraphrase instructions
- DO NOT merge multiple steps into one
- Titles should be action-oriented: "Prepare the sauce", "Brown the meat"
- MUST have at least one step if success is true

For nutrition (ALWAYS REQUIRED - ALL FOUR FIELDS):
- calories: REQUIRED (must be a number, not undefined)
- protein: REQUIRED (must be a number in grams, not undefined)
- fat: REQUIRED (must be a number in grams, not undefined)
- carbohydrates: REQUIRED (must be a number in grams, not undefined)
- If nutrition facts are provided in the images, use them
- If NOT provided, calculate estimates based on the ingredients:
  * Consider all ingredients and their quantities
  * Account for cooking methods (frying adds fat, etc.)
  * Use standard USDA values for common ingredients
  * Return integers (whole numbers)
- NEVER leave any nutrition field undefined if success is true

For primaryProtein (REQUIRED):
- Always set; infer from main protein in title/ingredients
- Use ONLY a value from the "Primary protein" list above
- Use "none" only when the recipe has no primary protein; use "other" only if truly unclear

For complexityTier (REQUIRED):
- Always set based on conceptual difficulty and technique level (not time); use ONLY a value from the "Complexity tier" list above
- simple: straightforward techniques, few components, easy to follow (beginner-friendly)
- moderate: more involved techniques, multiple components or stages, some skill required
- complex: advanced techniques, many components or stages, professional or experienced-cook level

For cuisine (REQUIRED):
- Always set exactly one value in the cuisine array; infer from dish type
- Use ONLY a value from the "Cuisine" list above (single-element array, e.g. ["italian"])`;
}

// ============================================================================
// Image Parsing
// ============================================================================

/**
 * Converts a base64 data URL to a format suitable for OpenAI Vision API
 * Returns just the base64 string (without data URL prefix)
 */
function prepareImageForAPI(dataUrl: string): {
  type: "image";
  image: string;
} {
  // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
  // OpenAI Vision API expects just the base64 string
  const base64Data = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;

  return {
    type: "image",
    image: base64Data,
  };
}

/**
 * Parses recipe images using OpenAI Vision API
 */
async function parseImagesWithAI(images: string[]): Promise<
  | { success: true; recipe: ParsedRecipeFromText }
  | {
      success: false;
      error: string;
      partialRecipe?: Partial<ParsedRecipeFromText>;
    }
> {
  if (images.length === 0) {
    return {
      success: false,
      error: "No images provided",
    };
  }

  const systemPrompt = buildImageRecipePrompt();

  // Prepare images for API (convert base64 data URLs)
  const imageContents = images.map(prepareImageForAPI);

  // For vision API with AI SDK, use messages format with UserModelMessage
  // The content should be an array of TextPart and ImagePart
  const textInstruction =
    imageContents.length === 1
      ? "Extract the recipe from this recipe page image."
      : "Extract the recipe from these recipe page images. Combine information from all pages to create a complete recipe.";

  // Build user message with text and images as content parts
  const userMessage = {
    role: "user" as const,
    content: [
      { type: "text" as const, text: textInstruction },
      ...imageContents.map((img) => ({
        type: "image" as const,
        image: img.image,
      })),
    ],
  };

  try {
    const result = await generateText({
      model: "openai/gpt-4o-mini",
      system: systemPrompt,
      messages: [userMessage],
      output: Output.object({
        schema: ImageRecipeSchema,
        name: "image_recipe_parser",
      }),
      temperature: 0.2,
    });

    // AI SDK validates the output against the schema, but we keep Zod validation as a safety check
    const validationResult = ImageRecipeSchema.safeParse(result.output);

    if (!validationResult.success) {
      console.error("Zod validation failed:", validationResult.error);

      // Try to extract whatever partial data we can for edit mode
      const partialData = extractPartialRecipeData(result.output);
      if (partialData) {
        return {
          success: false,
          error:
            "The AI returned incomplete data. Please complete the missing fields in edit mode.",
          partialRecipe: partialData,
        };
      }

      return {
        success: false,
        error:
          "The AI returned incomplete recipe data. Please try again with clearer images.",
      };
    }

    const validatedData = validationResult.data;

    // Check if validation failed
    if (!validatedData.success) {
      return {
        success: false,
        error:
          validatedData.errorMessage ||
          "The images don't appear to contain a valid recipe. Please ensure the images show clear recipe text.",
      };
    }

    // Check if we have enough data for a valid recipe
    if (
      validatedData.ingredients.length === 0 ||
      validatedData.method.length === 0
    ) {
      console.error("Missing critical recipe data:", {
        ingredientsCount: validatedData.ingredients.length,
        methodStepsCount: validatedData.method.length,
      });

      // Try to use partial data for edit mode if we have some data
      const partialData = extractPartialRecipeData(validatedData);
      if (
        partialData &&
        (partialData.ingredients?.length || partialData.method?.length)
      ) {
        return {
          success: false,
          error:
            "The AI couldn't extract all recipe details. Please complete the missing fields in edit mode.",
          partialRecipe: partialData,
        };
      }

      return {
        success: false,
        error:
          "The AI couldn't extract enough recipe information. Please ensure the images are clear and contain both ingredients and cooking instructions.",
      };
    }

    // Clean up and validate units and preparations
    const cleanedIngredients = cleanIngredients(validatedData.ingredients);
    const cleanedMethod = cleanMethodSteps(validatedData.method);

    return {
      success: true,
      recipe: {
        title: validatedData.title,
        description: validatedData.description,
        prepTime: validatedData.prepTime,
        cookTime: validatedData.cookTime,
        serves: validatedData.serves,
        category: validatedData.category,
        ingredients: cleanedIngredients,
        method: cleanedMethod,
        nutrition: validatedData.nutrition,
        primaryProtein: validatedData.primaryProtein ?? undefined,
        complexityTier: validatedData.complexityTier,
        cuisine: validatedData.cuisine,
      },
    };
  } catch (error) {
    console.error("Error parsing images with AI:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      cause: error instanceof Error ? error.cause : undefined,
    });

    // Handle AI SDK specific errors
    if (NoObjectGeneratedError.isInstance(error)) {
      // Try to extract partial data if available from error text
      let partialData: Partial<ParsedRecipeFromText> | null = null;
      if (error.text && typeof error.text === "string") {
        try {
          const parsedText = JSON.parse(error.text);
          partialData = extractPartialRecipeData(parsedText);
        } catch {
          // JSON parsing failed, no partial data available
        }
      }

      if (partialData) {
        return {
          success: false,
          error:
            "The AI couldn't generate a complete recipe. Please complete the missing fields in edit mode.",
          partialRecipe: partialData,
        };
      }
      return {
        success: false,
        error:
          "The AI couldn't parse the recipe from the images. Please try again with clearer images.",
      };
    }

    // Return more detailed error message
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to parse images: ${errorMessage}. Please ensure images are clear and contain readable recipe text.`,
    };
  }
}

/**
 * Main function to parse images into a recipe
 * Accepts base64 data URLs (from client-side image conversion)
 */
export async function parseImagesToRecipe(images: string[]): Promise<{
  success: boolean;
  recipe?: ParsedRecipeForDB;
  partialRecipe?: Partial<ParsedRecipeFromText>;
  error?: string;
}> {
  // Validate input
  if (!images || images.length === 0) {
    return {
      success: false,
      error: "Please provide at least one image",
    };
  }

  if (images.length > RECIPE_LIMITS.MAX_PHOTO_IMAGES) {
    return {
      success: false,
      error: `Please provide no more than ${RECIPE_LIMITS.MAX_PHOTO_IMAGES} images at once`,
    };
  }

  // Validate that images are base64 data URLs
  const validImages = images.filter((img) => {
    return (
      typeof img === "string" &&
      (img.startsWith("data:image/") || img.length > 100)
    );
  });

  if (validImages.length === 0) {
    return {
      success: false,
      error:
        "Invalid image format. Please ensure images are properly formatted.",
    };
  }

  // Parse images with AI
  const result = await parseImagesWithAI(validImages);

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      partialRecipe: result.partialRecipe,
    };
  }

  // Convert to ParsedRecipeForDB format
  const totalTimeMinutes =
    result.recipe.prepTime + (result.recipe.cookTime ?? 0);
  const recipeForDB: ParsedRecipeForDB = {
    title: result.recipe.title,
    description: result.recipe.description,
    prepTime: result.recipe.prepTime,
    cookTime: result.recipe.cookTime,
    serves: result.recipe.serves,
    category: result.recipe.category,
    ingredients: result.recipe.ingredients,
    method: result.recipe.method,
    nutrition: result.recipe.nutrition,
    importedAt: Date.now(),
    primaryProtein: result.recipe.primaryProtein ?? undefined,
    complexityTier: result.recipe.complexityTier,
    cuisine: result.recipe.cuisine,
    totalTimeMinutes:
      totalTimeMinutes > 0 ? totalTimeMinutes : undefined,
  };

  return {
    success: true,
    recipe: recipeForDB,
  };
}
