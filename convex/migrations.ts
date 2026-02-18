import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import {
  ComplexityTier,
  Cuisine,
  PreparationOption,
  PrimaryProtein,
  RecipeCategory,
  RecipeSource,
  Unit,
} from "./lib/constants";

import { WithoutSystemFields } from "convex/server";
import { SYSTEM_RECIPES } from "./lib/systemRecipes";

/**
 * Migration to clear image on all system recipes (e.g. before regenerating images).
 * Run: npx convex run migrations:clearSystemRecipeImages
 */
export const clearSystemRecipeImages = internalMutation({
  args: {},
  handler: async (ctx) => {
    const recipes = await ctx.db
      .query("recipes")
      .withIndex("by_source", (q) => q.eq("source", "system"))
      .collect();

    let updatedCount = 0;
    for (const recipe of recipes) {
      if (recipe.image != null) {
        const { _id, _creationTime, image, ...rest } = recipe;
        await ctx.db.replace(_id, rest as WithoutSystemFields<Doc<"recipes">>);
        updatedCount++;
        try {
          await ctx.storage.delete(image);
        } catch (e) {
          console.warn("Old image delete failed", { image, e });
        }
      }
    }

    return {
      message: `Cleared image on ${updatedCount} system recipes`,
      totalSystemRecipes: recipes.length,
      updatedCount,
    };
  },
});

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
        const { _id, _creationTime, status, ...recipeWithoutStatus } = recipe;
        await ctx.db.replace(
          _id,
          recipeWithoutStatus as WithoutSystemFields<Doc<"recipes">>,
        );
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
        const { _id, _creationTime, createdAt, ...planWithoutCreatedAt } = plan;
        await ctx.db.replace(
          _id,
          planWithoutCreatedAt as WithoutSystemFields<Doc<"mealPlans">>,
        );
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

/**
 * Migration to patch or create system recipes from convex/lib/system-recipes.ts.
 * - If a recipe with the same _id exists: replace its ingredients and method (image unchanged).
 * - If it does not exist: insert a new recipe with all fields except image.
 * Run: npx convex run migrations:patchSystemRecipesFromFile
 */
export const patchSystemRecipesFromFile = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let patched = 0;
    let inserted = 0;

    for (const r of SYSTEM_RECIPES) {
      const id = r._id as Id<"recipes">;
      const existing = await ctx.db.get(id);

      const ingredients = (r.ingredients ?? []).map((ing) => ({
        name: ing.name,
        ...(ing.amount != null && { amount: ing.amount }),
        ...(ing.unit != null && { unit: ing.unit as Unit }),
        ...(ing.preparation != null && {
          preparation: ing.preparation as PreparationOption,
        }),
      }));

      const method = (r.method ?? []).map((step) => ({
        title: step.title,
        ...(step.description != null &&
          step.description !== "" && { description: step.description }),
      }));

      if (existing) {
        await ctx.db.patch(id, {
          ingredients,
          method,
          updatedAt: r.updatedAt ?? now,
        });
        patched++;
      } else {
        await ctx.db.insert("recipes", {
          title: r.title,
          prepTime: r.prepTime,
          serves: r.serves,
          category: r.category as RecipeCategory,
          updatedAt: r.updatedAt ?? now,
          ...(r.description != null &&
            r.description !== "" && { description: r.description }),
          ...(r.cookTime != null && { cookTime: r.cookTime }),
          ...(ingredients.length > 0 && { ingredients }),
          ...(method.length > 0 && { method }),
          ...(r.nutrition != null && { nutrition: r.nutrition }),
          ...(r.primaryProtein != null && {
            primaryProtein: r.primaryProtein as PrimaryProtein,
          }),
          ...(r.complexityTier != null && {
            complexityTier: r.complexityTier as ComplexityTier,
          }),
          ...(r.cuisine != null &&
            r.cuisine.length > 0 && { cuisine: r.cuisine as Cuisine[] }),
          totalTimeMinutes: r.prepTime + (r.cookTime ?? 0),
          ...(r.isGeneratorEligible != null && {
            isGeneratorEligible: r.isGeneratorEligible,
          }),
          source: (r.source as RecipeSource) ?? "system",
        });
        inserted++;
      }
    }

    return {
      message: `Patch complete: ${patched} updated, ${inserted} created`,
      totalInFile: SYSTEM_RECIPES.length,
      patched,
      inserted,
    };
  },
});

/**
 * Internal: Generate upload URL for recipe image script.
 * No auth - only callable from Convex (HTTP action).
 */
export const getStorageUploadUrl = internalMutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Internal: Set image on a system recipe. Only allows system recipes.
 * Callable from Convex (HTTP action) only.
 */
export const setSystemRecipeImage = internalMutation({
  args: {
    recipeId: v.id("recipes"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe) throw new Error("Recipe not found");
    if (recipe.source !== "system") {
      throw new Error("Only system recipes can be updated by this mutation");
    }

    const oldImageId = recipe.image;
    await ctx.db.patch(args.recipeId, {
      image: args.storageId,
      updatedAt: Date.now(),
    });

    if (oldImageId) {
      try {
        await ctx.storage.delete(oldImageId);
      } catch (e) {
        console.warn("Old image delete failed", { oldImageId, e });
      }
    }
  },
});
