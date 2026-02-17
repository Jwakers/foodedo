import { internalMutation } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import {
  ComplexityTier,
  Cuisine,
  PreparationOption,
  PrimaryProtein,
  RecipeCategory,
  RecipeSource,
  Unit,
} from "./lib/constants";

import beefBatch001 from "./generated-recipes/beef_batch_001.json";
import beefBatch002 from "./generated-recipes/beef_batch_002.json";
import beefBatch003 from "./generated-recipes/beef_batch_003.json";
import chickenBatch001 from "./generated-recipes/chicken_batch_001.json";
import chickenBatch002 from "./generated-recipes/chicken_batch_002.json";
import chickenBatch003 from "./generated-recipes/chicken_batch_003.json";
import fishBatch001 from "./generated-recipes/fish_batch_001.json";
import lambBatch001 from "./generated-recipes/lamb_batch_001.json";
import otherBatch001 from "./generated-recipes/other_batch_001.json";
import porkBatch001 from "./generated-recipes/pork_batch_001.json";
import seafoodBatch001 from "./generated-recipes/seafood_batch_001.json";
import turkeyBatch001 from "./generated-recipes/turkey_batch_001.json";
import vegetarianBatch001 from "./generated-recipes/vegetarian_batch_001.json";
import vegetarianBatch002 from "./generated-recipes/vegetarian_batch_002.json";
import vegetarianBatch003 from "./generated-recipes/vegetarian_batch_003.json";
import { WithoutSystemFields } from "convex/server";

/**
 * Migration to remove the status field from all recipes
 * Run this once to clean up existing data after schema change
 */
export const removeRecipeStatusField = internalMutation({
  args: {},
  handler: async (ctx) => {
    const recipes = await ctx.db.query("recipes").collect();

    let updatedCount = 0;

    for (const recipe of recipes) {
      // Check if recipe has a status field (it will exist on old documents)
      if ("status" in recipe) {
        // Patch the recipe to remove the status field by replacing the document
        // Since Convex doesn't allow direct field deletion, we need to reconstruct
        const { status, ...recipeWithoutStatus } = recipe;

        // Delete old document and create new one with same _id
        await ctx.db.replace(recipe._id, recipeWithoutStatus);
        updatedCount++;
      }
    }

    return {
      message: `Migration complete: Updated ${updatedCount} recipes`,
      totalRecipes: recipes.length,
      updatedRecipes: updatedCount,
    };
  },
});

/**
 * Migration to backfill recipe fields for Intelligent Weekly Generator
 * Run optionally: source = "user", totalTimeMinutes = prepTime + cookTime
 */
export const backfillRecipeGeneratorFields = internalMutation({
  args: {},
  handler: async (ctx) => {
    const recipes = await ctx.db.query("recipes").collect();

    let updatedCount = 0;

    for (const recipe of recipes) {
      const updates: { source?: RecipeSource; totalTimeMinutes?: number } = {};
      if (!("source" in recipe) || recipe.source === undefined) {
        updates.source = "user";
      }
      if (
        !("totalTimeMinutes" in recipe) ||
        recipe.totalTimeMinutes === undefined
      ) {
        updates.totalTimeMinutes =
          (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
      }
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(recipe._id, updates);
        updatedCount++;
      }
    }

    return {
      message: `Migration complete: Backfilled ${updatedCount} recipes with source and/or totalTimeMinutes`,
      totalRecipes: recipes.length,
      updatedRecipes: updatedCount,
    };
  },
});

/**
 * Migration to backfill isGenerated: false for existing mealPlans (Intelligent Weekly Generator)
 * Run this once after adding the isGenerated field to the schema
 */
export const backfillMealPlanIsGenerated = internalMutation({
  args: {},
  handler: async (ctx) => {
    const mealPlans = await ctx.db.query("mealPlans").collect();

    let updatedCount = 0;

    for (const plan of mealPlans) {
      if (!("isGenerated" in plan) || plan.isGenerated === undefined) {
        await ctx.db.patch(plan._id, { isGenerated: false });
        updatedCount++;
      }
    }

    return {
      message: `Migration complete: Backfilled isGenerated for ${updatedCount} meal plans`,
      totalMealPlans: mealPlans.length,
      updatedMealPlans: updatedCount,
    };
  },
});

/**
 * Migration to remove the createdAt field from all mealPlans
 * Run this once to clean up existing data after schema change
 */
export const removeMealPlanCreatedAtField = internalMutation({
  args: {},
  handler: async (ctx) => {
    const mealPlans = await ctx.db.query("mealPlans").collect();

    let updatedCount = 0;

    for (const plan of mealPlans) {
      // Check if mealPlan has a createdAt field (it will exist on old documents)
      if ("createdAt" in plan) {
        // Remove the createdAt field by replacing the document
        // Since Convex doesn't allow direct field deletion, we need to reconstruct
        const { createdAt, ...planWithoutCreatedAt } = plan;

        // Replace the document without the createdAt field
        await ctx.db.replace(plan._id, planWithoutCreatedAt);
        updatedCount++;
      }
    }

    return {
      message: `Migration complete: Updated ${updatedCount} meal plans`,
      totalMealPlans: mealPlans.length,
      updatedMealPlans: updatedCount,
    };
  },
});

const ALL_RECIPE_BATCHES = [
  beefBatch001,
  beefBatch002,
  beefBatch003,
  chickenBatch001,
  chickenBatch002,
  chickenBatch003,
  fishBatch001,
  lambBatch001,
  otherBatch001,
  porkBatch001,
  seafoodBatch001,
  turkeyBatch001,
  vegetarianBatch001,
  vegetarianBatch002,
  vegetarianBatch003,
] as const;

type JsonRecipe = (typeof ALL_RECIPE_BATCHES)[number]["recipes"][number];

function mapJsonRecipeToDb(r: JsonRecipe): WithoutSystemFields<Doc<"recipes">> {
  const now = Date.now();

  const ingredients = r.ingredients?.map((ing) => {
    const obj: {
      name: string;
      amount?: number;
      unit?: Unit;
      preparation?: PreparationOption;
    } = { name: ing.name };
    if (ing.amount != null) obj.amount = ing.amount;
    if (ing.unit != null) obj.unit = ing.unit as Unit;
    if (ing.preparation != null)
      obj.preparation = ing.preparation as PreparationOption;
    return obj;
  });

  const method = r.method?.map((m) => {
    const obj: { title: string; description?: string } = { title: m.title };
    if (m.description != null && m.description !== "") obj.description = m.description;
    return obj;
  });

  const result: Record<string, unknown> = {
    title: r.title,
    prepTime: r.prepTime,
    serves: r.serves,
    category: r.category as RecipeCategory,
    source: "system" as const,
    totalTimeMinutes: r.prepTime + (r.cookTime ?? 0),
    isGeneratorEligible: true,
    updatedAt: now,
  };
  if (r.description != null && r.description !== "")
    result.description = r.description;
  if (r.cookTime != null) result.cookTime = r.cookTime;
  if (ingredients) result.ingredients = ingredients;
  if (method) result.method = method;
  if (r.nutrition) result.nutrition = r.nutrition;
  if (r.primaryProtein != null)
    result.primaryProtein = r.primaryProtein as PrimaryProtein;
  if (r.complexityTier != null)
    result.complexityTier = r.complexityTier as ComplexityTier;
  if (r.cuisine != null && r.cuisine.length > 0)
    result.cuisine = r.cuisine as Cuisine[];

  return result as WithoutSystemFields<Doc<"recipes">>;
}

/**
 * Migration to import generated recipes from JSON files into the recipes table.
 * Run: npx convex run migrations:importGeneratedRecipes
 */
export const importGeneratedRecipes = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allRecipes: JsonRecipe[] = [];
    for (const batch of ALL_RECIPE_BATCHES) {
      allRecipes.push(...batch.recipes);
    }

    const existingRecipes = await ctx.db.query("recipes").collect();
    const existingTitles = new Set(
      existingRecipes.map((r) => r.title.toLowerCase().trim()),
    );

    let inserted = 0;
    let skipped = 0;

    for (const r of allRecipes) {
      const normalizedTitle = r.title.toLowerCase().trim();
      if (existingTitles.has(normalizedTitle)) {
        skipped++;
        continue;
      }
      const doc = mapJsonRecipeToDb(r);
      // Cast: JSON values validated by scripts; unit/preparation are valid schema values
      await ctx.db.insert(
        "recipes",
        doc as Omit<Doc<"recipes">, "_id" | "_creationTime">,
      );
      existingTitles.add(normalizedTitle);
      inserted++;
    }

    return {
      message: `Import complete: Inserted ${inserted} recipes, skipped ${skipped} (title already exists)`,
      totalInFiles: allRecipes.length,
      inserted,
      skipped,
    };
  },
});
