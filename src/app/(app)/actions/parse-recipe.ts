"use server";

import {
  type ParsedRecipeForDB,
  type ParsedRecipeFromText,
  type StructuredIngredient,
} from "@/lib/types/recipe-parser";
import {
  validatePreparation,
  validateUnit,
} from "@/lib/utils/recipe-validation";
import { validateUrlForSSRF } from "@/lib/utils/secure-fetch";
import { openai } from "@ai-sdk/openai";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import * as cheerio from "cheerio";
import { RECIPE_CATEGORIES, TEXT_LIMITS } from "convex/lib/constants";
import {
  cleanIngredients,
  cleanMethodSteps,
  generatePreparationsString,
  generateUnitsString,
} from "./recipe-parsing-helpers";
import { HtmlRecipeSchema, TextRecipeSchema } from "./recipe-schemas";

// ============================================================================
// Shared Model Configuration
// ============================================================================

// API key is automatically read from process.env.OPENAI_API_KEY
const model = openai("gpt-4o-mini");

// ============================================================================
// Shared Helper Functions (imported from shared module)
// ============================================================================
// Helper functions are imported from recipe-parsing-helpers.ts

/**
 * Helper functions for safe data extraction from partial responses
 */
function safeExtractString<T extends Record<string, unknown>>(
  data: T,
  key: keyof T,
): string | undefined {
  const value = data[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function safeExtractNumber<T extends Record<string, unknown>>(
  data: T,
  key: keyof T,
): number | undefined {
  const value = data[key];
  return typeof value === "number" ? value : undefined;
}

function safeExtractArray<T extends Record<string, unknown>, U>(
  data: T,
  key: keyof T,
  validator: (item: unknown) => item is U,
  mapper: (item: U) => unknown,
): unknown[] | undefined {
  const value = data[key];
  if (!Array.isArray(value)) {
    return undefined;
  }

  const validItems = value.filter(validator).map(mapper);
  return validItems.length > 0 ? validItems : undefined;
}

function safeExtractObject<T extends Record<string, unknown>>(
  data: T,
  key: keyof T,
): Record<string, unknown> | undefined {
  const value = data[key];
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

// ============================================================================
// Shared Prompt Building
// ============================================================================

/**
 * Builds the base system prompt for recipe parsing
 */
function buildBaseRecipePrompt(
  options: {
    includeValidation?: boolean;
    includeNutrition?: boolean;
    includeImageUrl?: boolean;
    includeAuthor?: boolean;
  } = {},
): string {
  const {
    includeValidation = false,
    includeNutrition = false,
    includeImageUrl = false,
    includeAuthor = false,
  } = options;

  const unitsString = generateUnitsString();
  const preparationsString = generatePreparationsString();

  let prompt = `You are an expert recipe parser extracting structured recipe data${includeValidation ? " and validator" : ""}.

Return a JSON object with this exact structure:
{
  "title": "string",
  "description": "string",
  "prepTime": number (in minutes),
  "cookTime": number (in minutes),
  "serves": number,
  "category": "string (one of: ${RECIPE_CATEGORIES.join(", ")})",
  "ingredients": [
    {"name": "string", "amount": number, "unit": "string", "preparation": "string"}
  ],
  "method": [
    {"title": "string (3-5 words)", "description": "string (complete instruction)"}
  ]`;

  if (includeValidation) {
    prompt += `,
  "success": boolean,
  "errorMessage": "string"`;
  }

  if (includeNutrition) {
    prompt += `,
  "nutrition": {
    "calories": number,
    "protein": number (in grams),
    "fat": number (in grams),
    "carbohydrates": number (in grams)
  }`;
  }

  if (includeImageUrl) {
    prompt += `,
  "imageUrl": "string (empty string if not found)"`;
  }

  if (includeAuthor) {
    prompt += `,
  "author": "string (empty string if not found)"`;
  }

  prompt += `
}

${unitsString}

${preparationsString}

CRITICAL INSTRUCTIONS:

For title (REQUIRED):
- Extract the recipe name${includeValidation ? " or create a descriptive name" : ""}
- NEVER leave this empty`;

  if (includeValidation) {
    prompt += `
- If the text is NOT a recipe, set "success" to false and provide an "errorMessage"`;
  }

  prompt += `

For description (REQUIRED):
- Extract the recipe description or introduction
- If not present, generate an engaging 2-3 sentence description
- NEVER leave this empty

For timing (REQUIRED):
- Extract prep and cook times if mentioned
- Convert to minutes (e.g., "1 hour 30 minutes" = 90)
- If not stated, estimate based on recipe complexity
- Use 0 for cookTime if it's a no-cook recipe
- NEVER leave these undefined

For ingredients (CRITICAL):
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
- Keep ALL original instruction steps - DO NOT combine or condense
- For EACH step, create a short descriptive title (3-5 words)
- PRESERVE the COMPLETE original instruction text in the "description" field
- DO NOT shorten, summarize, or paraphrase instructions
- DO NOT merge multiple steps into one
- Titles should be action-oriented: "Prepare the sauce", "Brown the meat"
- MUST have at least one step`;

  if (includeNutrition) {
    prompt += `

For nutrition (ALWAYS REQUIRED - ALL FOUR FIELDS):
- calories: REQUIRED (must be a number, not undefined)
- protein: REQUIRED (must be a number in grams, not undefined)
- fat: REQUIRED (must be a number in grams, not undefined)
- carbohydrates: REQUIRED (must be a number in grams, not undefined)
- If nutrition facts are provided, use them
- If NOT provided, calculate estimates based on the ingredients:
  * Consider all ingredients and their quantities
  * Account for cooking methods (frying adds fat, etc.)
  * Use standard USDA values for common ingredients
  * Return integers (whole numbers)
- NEVER leave any nutrition field undefined`;
  }

  if (includeImageUrl) {
    prompt += `

For imageUrl:
- Look for recipe image URLs in the page text or metadata
- Use empty string "" if no image found`;
  }

  if (includeAuthor) {
    prompt += `

For author:
- Look for recipe author/creator name in the page text
- Use empty string "" if no author found`;
  }

  prompt += `

You MUST return valid JSON with ALL fields present.`;

  return prompt;
}

// ============================================================================
// Text Recipe Parsing
// ============================================================================

/**
 * Extracts whatever partial recipe data we can from incomplete AI response
 * This allows users to edit and complete the recipe manually
 */
function extractPartialRecipeData(
  jsonData: unknown,
): Partial<ParsedRecipeFromText> | null {
  try {
    if (!jsonData || typeof jsonData !== "object") {
      return null;
    }

    const data = jsonData as Record<string, unknown>;
    const partial: Partial<ParsedRecipeFromText> = {};

    // Extract basic fields
    const title = safeExtractString(data, "title");
    if (title) partial.title = title;

    const description = safeExtractString(data, "description");
    if (description) partial.description = description;

    const prepTime = safeExtractNumber(data, "prepTime");
    if (prepTime !== undefined) partial.prepTime = prepTime;

    const cookTime = safeExtractNumber(data, "cookTime");
    if (cookTime !== undefined) partial.cookTime = cookTime;

    const serves = safeExtractNumber(data, "serves");
    if (serves !== undefined) partial.serves = serves;

    const category = safeExtractString(data, "category");
    if (category) {
      partial.category = category as (typeof RECIPE_CATEGORIES)[number];
    }

    // Extract ingredients
    const ingredients = safeExtractArray(
      data,
      "ingredients",
      (ing: unknown): ing is { name: string; amount?: number } =>
        typeof ing === "object" &&
        ing !== null &&
        "name" in ing &&
        typeof ing.name === "string",
      (ing) => ({
        name: ing.name,
        amount:
          "amount" in ing && typeof ing.amount === "number"
            ? ing.amount
            : undefined,
        unit: validateUnit(
          "unit" in ing && typeof ing.unit === "string" ? ing.unit : undefined,
        ),
        preparation: validatePreparation(
          "preparation" in ing && typeof ing.preparation === "string"
            ? ing.preparation
            : undefined,
        ),
      }),
    );

    if (ingredients) {
      partial.ingredients = ingredients as StructuredIngredient[];
    }

    // Extract method steps
    const method = safeExtractArray(
      data,
      "method",
      (step: unknown): step is { title: string } =>
        typeof step === "object" &&
        step !== null &&
        "title" in step &&
        typeof step.title === "string",
      (step) => ({
        title: step.title,
        description:
          "description" in step && typeof step.description === "string"
            ? step.description
            : undefined,
      }),
    );

    if (method) {
      partial.method = method as Array<{
        title: string;
        description?: string;
      }>;
    }

    // Extract nutrition
    const nutritionObj = safeExtractObject(data, "nutrition");
    if (nutritionObj) {
      const calories = safeExtractNumber(nutritionObj, "calories");
      const protein = safeExtractNumber(nutritionObj, "protein");
      const fat = safeExtractNumber(nutritionObj, "fat");
      const carbohydrates = safeExtractNumber(nutritionObj, "carbohydrates");

      if (
        calories !== undefined &&
        protein !== undefined &&
        fat !== undefined &&
        carbohydrates !== undefined
      ) {
        partial.nutrition = {
          calories,
          protein,
          fat,
          carbohydrates,
        };
      }
    }

    // Only return if we got at least some meaningful data
    if (Object.keys(partial).length >= 2) {
      return partial;
    }

    return null;
  } catch (error) {
    console.error("Error extracting partial data:", error);
    return null;
  }
}

/**
 * Parses raw text into a structured recipe using AI (includes validation)
 */
async function parseTextWithAI(text: string): Promise<
  | { success: true; recipe: ParsedRecipeFromText }
  | {
      success: false;
      error: string;
      partialRecipe?: Partial<ParsedRecipeFromText>;
    }
> {
  const systemPrompt = buildBaseRecipePrompt({
    includeValidation: true,
    includeNutrition: true,
  });

  // Add validation-specific instructions
  const validationInstructions = `

CRITICAL: If the text is NOT a recipe or lacks sufficient information:
- Set "success" to false
- Provide a clear "errorMessage" explaining why (e.g., "This looks like a shopping list, not a recipe" or "Not enough information - please include cooking instructions")
- Set all other fields to empty/default values:
  * title: "" (empty string)
  * description: "" (empty string)
  * prepTime: 0
  * cookTime: 0
  * serves: 4
  * category: "main"
  * ingredients: [] (empty array)
  * method: [] (empty array)
  * nutrition: {calories: 0, protein: 0, fat: 0, carbohydrates: 0}

If the text IS a valid recipe, set "success" to true, set "errorMessage" to "" (empty string), and provide all fields with actual data.

A text is a valid recipe if it has:
- At least 2-3 ingredients (or clear ingredient information)
- Some form of cooking/preparation instructions
- Enough context to understand what dish is being made

NOT valid recipes:
- Shopping lists without preparation context
- Restaurant menus
- Food reviews or descriptions without recipes
- Vague or incomplete information`;

  const fullPrompt = systemPrompt + validationInstructions;

  try {
    const result = await generateText({
      model,
      system: fullPrompt,
      prompt: `Parse this recipe:\n\n${text}`,
      output: Output.object({
        schema: TextRecipeSchema,
        name: "recipe_parser",
      }),
      temperature: 0.2,
    });

    // AI SDK validates the output against the schema, but we keep Zod validation as a safety check
    const validationResult = TextRecipeSchema.safeParse(result.output);

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
          "The AI returned incomplete recipe data. Please try again with more detailed recipe information.",
      };
    }

    const validatedData = validationResult.data;

    // Check if validation failed
    if (!validatedData.success) {
      return {
        success: false,
        error:
          validatedData.errorMessage ||
          "This doesn't look like a recipe. Please include ingredients and cooking steps.",
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
      const partialData = extractPartialRecipeData(result.output);
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
          "The AI couldn't extract enough recipe information. Please provide more details.",
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
      },
    };
  } catch (error) {
    console.error("Error parsing text with AI:", error);

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
          "The AI couldn't parse the recipe. Please try again with more detailed information.",
      };
    }

    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}

/**
 * Main function to parse text into a recipe
 */
export async function parseTextToRecipe(text: string): Promise<{
  success: boolean;
  recipe?: ParsedRecipeFromText;
  partialRecipe?: Partial<ParsedRecipeFromText>;
  error?: string;
}> {
  // Trim and validate input
  const trimmedText = text.trim();

  if (!trimmedText) {
    return {
      success: false,
      error: "Please enter some recipe text",
    };
  }

  if (trimmedText.length < TEXT_LIMITS.RECIPE_TEXT_MIN_LENGTH) {
    return {
      success: false,
      error:
        "We need a bit more information. Please add at least a few sentences about your recipe.",
    };
  }

  if (trimmedText.length > TEXT_LIMITS.RECIPE_TEXT_MAX_LENGTH) {
    return {
      success: false,
      error: `That's a lot of text! Please keep it under ${TEXT_LIMITS.RECIPE_TEXT_MAX_LENGTH.toLocaleString()} characters.`,
    };
  }

  // Single AI call validates and parses in one step
  const result = await parseTextWithAI(trimmedText);

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      partialRecipe: result.partialRecipe,
    };
  }

  return {
    success: true,
    recipe: result.recipe,
  };
}

// ============================================================================
// HTML/URL Recipe Parsing
// ============================================================================

/**
 * Extracts image URL from HTML meta tags
 */
function extractImageFromMeta($: cheerio.CheerioAPI): string | undefined {
  const selectors = [
    'meta[property="og:image"]',
    'meta[property="og:image:url"]',
    'meta[property="og:image:secure_url"]',
    'meta[name="twitter:image"]',
    'meta[name="twitter:image:src"]',
    'meta[itemprop="image"]',
    'link[rel="image_src"]',
  ];

  for (const selector of selectors) {
    const content = $(selector).attr("content") || $(selector).attr("href");
    if (content && content.trim()) {
      if (content.startsWith("http") || content.startsWith("//")) {
        return content.startsWith("//") ? `https:${content}` : content;
      }
    }
  }

  return undefined;
}

/**
 * Uses AI to parse recipe from raw HTML content
 */
async function parseHtmlWithAI(
  pageText: string,
  imageUrl?: string,
): Promise<ParsedRecipeForDB | null> {
  const systemPrompt = buildBaseRecipePrompt({
    includeImageUrl: true,
    includeAuthor: true,
  });

  try {
    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: `Extract the recipe from this webpage text:\n\n${pageText}`,
      output: Output.object({
        schema: HtmlRecipeSchema,
        name: "html_recipe_parser",
      }),
      temperature: 0.1,
    });

    // AI SDK validates the output against the schema, but we keep Zod validation as a safety check
    const validationResult = HtmlRecipeSchema.safeParse(result.output);

    if (!validationResult.success) {
      console.error("Schema validation failed:", validationResult.error);
      return null;
    }

    const validatedData = validationResult.data;

    // Clean up and validate units and preparations
    const cleanedIngredients = cleanIngredients(validatedData.ingredients);
    const cleanedMethod = cleanMethodSteps(validatedData.method);

    const recipe: ParsedRecipeForDB = {
      title: validatedData.title,
      description: validatedData.description || undefined,
      prepTime: validatedData.prepTime,
      cookTime: validatedData.cookTime,
      serves: validatedData.serves,
      category: validatedData.category,
      ingredients: cleanedIngredients,
      method: cleanedMethod,
      // Prefer image extracted from meta tags over AI-extracted (more reliable)
      imageUrl: imageUrl || validatedData.imageUrl || undefined,
      originalAuthor: validatedData.author || undefined,
      importedAt: Date.now(),
    };

    return recipe;
  } catch (error) {
    console.error("Error parsing HTML with AI:", error);

    // Handle AI SDK specific errors
    if (NoObjectGeneratedError.isInstance(error)) {
      console.error(
        "Failed to generate structured recipe object:",
        error.cause,
      );
    }

    return null;
  }
}

/**
 * Parses recipe from a URL when schema.org parsing fails
 */
export async function parseRecipeFromSiteWithAI(
  url: string,
): Promise<ParsedRecipeForDB | null> {
  if (!url) {
    console.error("No URL provided to parseRecipeFromSiteWithAI");
    return null;
  }

  try {
    // 1️⃣ Validate URL for SSRF protection
    const validation = await validateUrlForSSRF(url);
    if (!validation.valid) {
      console.error(
        `SSRF Protection: URL validation failed - ${validation.reason}`,
      );
      return null;
    }

    // 2️⃣ Fetch page HTML with manual redirect handling for SSRF protection
    const MAX_REDIRECTS = 5;
    if (!validation.url) {
      console.error("SSRF Protection: URL missing after validation");
      return null;
    }
    let currentUrl = validation.url;
    let response: Response | null = null;
    let redirectCount = 0;

    while (redirectCount < MAX_REDIRECTS) {
      // Validate current URL before fetching
      const currentValidation = await validateUrlForSSRF(currentUrl.toString());
      if (!currentValidation.valid) {
        console.error(
          `SSRF Protection: Redirect target validation failed - ${currentValidation.reason}`,
        );
        return null;
      }

      // Fetch with manual redirect handling
      response = await fetch(currentValidation.url!.toString(), {
        signal: AbortSignal.timeout(10000), // 10 second timeout
        redirect: "manual", // Handle redirects manually
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; RecipeBot/1.0; +https://foodedo.app)",
        },
      });

      // Check if we need to follow a redirect
      if (
        response.status >= 300 &&
        response.status < 400 &&
        response.headers.get("location")
      ) {
        const location = response.headers.get("location")!;
        try {
          // Resolve relative redirects against current URL
          currentUrl = new URL(location, currentUrl);
          redirectCount++;
          continue; // Follow the redirect
        } catch (error) {
          console.error(
            `Invalid redirect location: ${location}`,
            error instanceof Error ? error.message : "Unknown error",
          );
          return null;
        }
      }

      // Not a redirect, break the loop
      break;
    }

    if (redirectCount >= MAX_REDIRECTS) {
      console.error(`Too many redirects (max ${MAX_REDIRECTS})`);
      return null;
    }

    if (!response || !response.ok) {
      console.error(
        `Failed to fetch URL: ${response?.status || "unknown"} ${response?.statusText || "unknown"}`,
      );
      return null;
    }

    const html = await response.text();

    // 3️⃣ Load into Cheerio
    const $ = cheerio.load(html);

    // Extract image from meta tags (before removing scripts)
    const imageUrl = extractImageFromMeta($);

    // Remove script and style tags for cleaner text
    $("script, style, noscript").remove();

    // Extract text from body
    const pageText = $("body").text().replace(/\s+/g, " ").trim();

    // Truncate if too long
    const truncatedText = pageText.slice(0, 15000);

    if (truncatedText.length < 100) {
      console.error("Page text too short, likely failed to fetch properly");
      return null;
    }

    // 4️⃣ Parse with AI (pass extracted image)
    const recipe = await parseHtmlWithAI(truncatedText, imageUrl);

    if (!recipe) {
      return null;
    }

    // Add source URL
    return {
      ...recipe,
      originalUrl: url,
    };
  } catch (error) {
    console.error("Error fetching or parsing recipe from URL:", error);
    return null;
  }
}
