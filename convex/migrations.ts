import { internalMutation } from "./_generated/server";
import { RecipeSource } from "./lib/constants";

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
      if (!("totalTimeMinutes" in recipe) || recipe.totalTimeMinutes === undefined) {
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
