"use server";

import { requireSuperUser } from "@/lib/require-super-user";
import { generateText, Output } from "ai";
import { z } from "zod";
import type { Doc } from "convex/_generated/dataModel";
import type { StructuredIngredient } from "@/lib/types/recipe-parser";
import {
  cleanIngredients,
  cleanMethodSteps,
  generatePreparationsString,
  generateUnitsString,
} from "./recipe-parsing-helpers";
const EnhanceRecipeInputSchema = z.object({
  recipeId: z.string(),
  title: z.string(),
  description: z.string().optional().nullable(),
  ingredients: z.array(
    z.object({
      name: z.string(),
      amount: z.number().optional(),
      unit: z.string().optional().nullable(),
      preparation: z.string().optional().nullable(),
    }),
  ),
  method: z.array(
    z.object({
      title: z.string(),
      description: z.string().optional().nullable(),
    }),
  ),
  prompt: z.string().min(1, "Enhancement prompt is required"),
});

const EnhanceRecipeOutputSchema = z.object({
  description: z.string().nullable(),
  ingredients: z.array(
    z.object({
      name: z
        .string()
        .refine((s) => s.trim().length > 0, { message: "cannot be blank" }),
      amount: z
        .number()
        .nullable()
        .refine((v) => v === null || v > 0, { message: "must be positive" }),
      unit: z.string().nullable(),
      preparation: z.string().nullable(),
    }),
  ),
  method: z.array(
    z.object({
      title: z
        .string()
        .refine((s) => s.trim().length > 0, { message: "cannot be blank" }),
      description: z.string().nullable(),
    }),
  ),
});

export type EnhanceRecipeInput = z.infer<typeof EnhanceRecipeInputSchema>;

type RecipeMethodStep = NonNullable<Doc<"recipes">["method"]>[number];

/** Success payload: uses undefined/null to work with Convex updateRecipe. */
export type EnhancedRecipePayload = {
  description: string | null;
  ingredients: StructuredIngredient[];
  method: RecipeMethodStep[];
};

export async function enhanceRecipeWithAI(
  rawInput: unknown,
): Promise<
  | { success: true } & EnhancedRecipePayload
  | { success: false; error: string }
> {
  await requireSuperUser();

  const parsed = EnhanceRecipeInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: "Invalid input. Please provide a recipe and enhancement prompt." };
  }

  const { title, description: currentDescription, ingredients, method, prompt } = parsed.data;

  const unitsString = generateUnitsString();
  const preparationsString = generatePreparationsString();

  const ingredientsText =
    ingredients.length > 0
      ? ingredients
          .map(
            (ing) =>
              `- ${ing.name}${ing.amount != null ? ` ${ing.amount}` : ""}${ing.unit ? ` ${ing.unit}` : ""}${ing.preparation ? ` (${ing.preparation})` : ""}`,
          )
          .join("\n")
      : "(none)";

  const methodText =
    method.length > 0
      ? method
          .map((step, i) => `${i + 1}. ${step.title}${step.description ? `\n   ${step.description}` : ""}`)
          .join("\n\n")
      : "(none)";

  const systemPrompt = `You are an expert recipe editor. Your task is to improve a recipe's description, ingredients list, and method based on the user's feedback.

RULES:
- Preserve the recipe's intent and all existing information unless the user asks to change it.
- Apply the user's enhancement prompt precisely (e.g. clarify timings, add notes, fix wording, add missing steps, improve the recipe description).
- Keep the same structure: a short recipe description (if present), an ingredients list, and numbered method steps.
- The recipe description is a short summary or intro (1-3 sentences). Update it if the user's feedback implies it should be clearer or more accurate.
- For ingredients: use only the allowed units and preparations below. If an ingredient has no unit or preparation, omit those fields.
- For method steps: each step has a short title (3-5 words) and a longer description. Keep steps clear and in order.

${unitsString}

${preparationsString}

Return a JSON object with exactly three keys: "description" (string, the improved recipe description; use null if the recipe had no description and none is needed), "ingredients" (array of objects with name, amount, unit, preparation), and "method" (array of objects with title, description). Use null for optional fields when not applicable.`;

  try {
    const result = await generateText({
      model: "openai/gpt-4o-mini",
      system: systemPrompt,
      prompt: `Recipe: ${title}

CURRENT DESCRIPTION:
${currentDescription?.trim() || "(none)"}

CURRENT INGREDIENTS:
${ingredientsText}

CURRENT METHOD:
${methodText}

ENHANCEMENT REQUEST:
${prompt}

Return the improved description, ingredients, and method as JSON.`,
      output: Output.object({
        schema: EnhanceRecipeOutputSchema,
        name: "enhanced_recipe",
      }),
      temperature: 0.3,
    });

    const validation = EnhanceRecipeOutputSchema.safeParse(result.output);
    if (!validation.success) {
      return { success: false, error: "AI returned invalid recipe data. Please try again." };
    }

    const raw = validation.data;

    const cleanedIngredients = cleanIngredients(
      raw.ingredients.map((ing) => ({
        name: ing.name.trim(),
        amount: ing.amount,
        unit: ing.unit,
        preparation: ing.preparation,
      })),
    );

    const cleanedMethod = cleanMethodSteps(
      raw.method.map((step) => ({
        title: step.title.trim(),
        description: step.description ?? undefined,
      })),
    );

    const filteredIngredients = cleanedIngredients.filter((ing) => {
      if (!ing.name?.trim()) return false;
      if (ing.amount != null && ing.amount <= 0) return false;
      return true;
    });

    const filteredMethod = cleanedMethod.filter((step) => {
      if (!step.title?.trim()) return false;
      return true;
    });

    if (filteredIngredients.length === 0 || filteredMethod.length === 0) {
      return {
        success: false,
        error: "AI returned empty ingredients or method. Please try again with a different prompt.",
      };
    }

    const description =
      raw.description === null
        ? null
        : String(raw.description).trim().length > 0
          ? String(raw.description).trim()
          : null;

    return {
      success: true,
      description,
      ingredients: filteredIngredients.map((ing) => ({
        name: ing.name,
        ...(ing.amount != null && { amount: ing.amount }),
        ...(ing.unit != null && { unit: ing.unit }),
        ...(ing.preparation != null && { preparation: ing.preparation }),
      })),
      method: filteredMethod.map((step) => ({
        title: step.title,
        ...(step.description != null && { description: step.description }),
      })),
    };
  } catch (e) {
    console.error("enhanceRecipeWithAI error:", e);
    return {
      success: false,
      error: "Something went wrong while enhancing the recipe. Please try again.",
    };
  }
}
