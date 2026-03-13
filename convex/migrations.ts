import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import {
  COMPLEXITY_TIERS,
  CUISINES,
  PRIMARY_PROTEINS,
  ComplexityTier,
  Cuisine,
  PreparationOption,
  PrimaryProtein,
  RecipeCategory,
  RecipeSource,
  Unit,
} from "./lib/constants";

import { WithoutSystemFields } from "convex/server";
import { resolveIngredientIdFromList } from "./ingredients";
import ingredientsSeedData from "./ingredients-seed.json";
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

// ---------------------------------------------------------------------------
// Helpers for backfillUserRecipeMealPlanFields (keyword derivation from text)
// ---------------------------------------------------------------------------

/** Keywords that suggest a primary protein (checked in order; first match wins). */
const PRIMARY_PROTEIN_KEYWORDS: {
  keywords: string[];
  value: PrimaryProtein;
}[] = [
  { keywords: ["vegan", "plant-based"], value: "vegan" },
  { keywords: ["vegetarian", "veg"], value: "vegetarian" },
  {
    keywords: [
      "seafood",
      "shrimp",
      "prawn",
      "crab",
      "lobster",
      "scallop",
      "mussel",
      "calamari",
    ],
    value: "seafood",
  },
  { keywords: ["chicken", "poultry"], value: "chicken" },
  { keywords: ["beef", "steak"], value: "beef" },
  { keywords: ["pork", "bacon", "ham", "sausage"], value: "pork" },
  { keywords: ["lamb"], value: "lamb" },
  { keywords: ["turkey"], value: "turkey" },
  {
    keywords: [
      "fish",
      "salmon",
      "tuna",
      "cod",
      "trout",
      "mackerel",
      "white fish",
    ],
    value: "fish",
  },
];

/** Keywords that suggest a cuisine (first match wins). */
const CUISINE_KEYWORDS: { keywords: string[]; value: Cuisine }[] = [
  {
    keywords: ["italian", "pasta", "risotto", "pizza", "carbonara"],
    value: "italian",
  },
  {
    keywords: ["indian", "curry", "tikka", "naan", "biryani", "dal"],
    value: "indian",
  },
  {
    keywords: ["mexican", "taco", "burrito", "quesadilla", "enchilada"],
    value: "mexican",
  },
  { keywords: ["thai", "pad thai"], value: "thai" },
  { keywords: ["chinese", "stir-fry", "wok", "dim sum"], value: "chinese" },
  {
    keywords: ["japanese", "sushi", "ramen", "teriyaki", "miso"],
    value: "japanese",
  },
  { keywords: ["korean", "kimchi", "bibimbap", "gochujang"], value: "korean" },
  { keywords: ["french"], value: "french" },
  { keywords: ["mediterranean", "mezze"], value: "mediterranean" },
  {
    keywords: [
      "middle eastern",
      "middle_eastern",
      "falafel",
      "hummus",
      "shawarma",
    ],
    value: "middle_eastern",
  },
  { keywords: ["british"], value: "british" },
  { keywords: ["american"], value: "american" },
  { keywords: ["caribbean", "jerk"], value: "caribbean" },
  { keywords: ["african"], value: "african" },
  { keywords: ["vietnamese", "pho", "banh mi"], value: "vietnamese" },
  { keywords: ["greek", "gyro", "feta", "tzatziki"], value: "greek" },
  { keywords: ["spanish", "paella", "tapas"], value: "spanish" },
];

/**
 * @param text - Combined recipe text; must already be lowercased for keyword matching.
 */
function derivePrimaryProteinFromText(
  text: string,
): PrimaryProtein | undefined {
  for (const { keywords, value } of PRIMARY_PROTEIN_KEYWORDS) {
    if (
      keywords.some((k) =>
        k === "veg" ? /\bveg\b/.test(text) : text.includes(k),
      )
    )
      return value;
  }
  return undefined;
}

/**
 * @param text - Combined recipe text; must already be lowercased for keyword matching.
 */
function deriveCuisineFromText(text: string): Cuisine | undefined {
  for (const { keywords, value } of CUISINE_KEYWORDS) {
    if (keywords.some((k) => text.includes(k))) return value;
  }
  return undefined;
}

function deriveComplexityTier(
  methodSteps: number,
  totalMinutes: number,
): ComplexityTier {
  if (methodSteps <= 4 && totalMinutes < 35) return "simple";
  if (methodSteps >= 8 || totalMinutes >= 60) return "complex";
  return "moderate";
}

/**
 * Migration to backfill meal-plan fields (primaryProtein, complexityTier, cuisine,
 * totalTimeMinutes, isGeneratorEligible) for user recipes from existing data.
 * - primaryProtein: derived from title + description + ingredient names (keyword match).
 * - complexityTier: derived from number of method steps and total time (prep + cook).
 * - cuisine: derived from title + description (keyword match); single value.
 * - totalTimeMinutes: prepTime + (cookTime ?? 0).
 * - isGeneratorEligible: true when both primaryProtein and complexityTier are set.
 * Includes recipes with source === "user" and treats source === undefined as user
 * recipes (e.g. created before the field existed). Sets source to "user" when it was
 * undefined. Run: npx convex run migrations:backfillUserRecipeMealPlanFields
 */
export const backfillUserRecipeMealPlanFields = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allRecipes = await ctx.db.query("recipes").collect();
    const userRecipes = allRecipes.filter(
      (r) => r.source === "user" || r.source === undefined,
    );
    let updatedCount = 0;
    const now = Date.now();
    for (const recipe of userRecipes) {
      const cuisineText = [recipe.title ?? "", recipe.description ?? ""]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const proteinText = [
        recipe.title ?? "",
        recipe.description ?? "",
        ...(recipe.ingredients ?? []).map((i) => i.name ?? ""),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const methodSteps = (recipe.method ?? []).length;
      const totalMinutes = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
      const updates: {
        source?: RecipeSource;
        primaryProtein?: PrimaryProtein;
        complexityTier?: ComplexityTier;
        cuisine?: Cuisine[];
        totalTimeMinutes?: number;
        isGeneratorEligible?: boolean;
        updatedAt: number;
      } = { updatedAt: now };
      let changed = false;

      if (recipe.source === undefined) {
        updates.source = "user";
        changed = true;
      }
      if (
        recipe.primaryProtein == null ||
        !PRIMARY_PROTEINS.includes(recipe.primaryProtein as PrimaryProtein)
      ) {
        const derived = derivePrimaryProteinFromText(proteinText);
        if (derived) {
          updates.primaryProtein = derived;
          changed = true;
        }
      }
      if (
        recipe.complexityTier == null ||
        !COMPLEXITY_TIERS.includes(recipe.complexityTier as ComplexityTier)
      ) {
        updates.complexityTier = deriveComplexityTier(
          methodSteps,
          totalMinutes,
        );
        changed = true;
      }
      if (
        !recipe.cuisine?.length ||
        !recipe.cuisine.every((c) => CUISINES.includes(c as Cuisine))
      ) {
        const derived = deriveCuisineFromText(cuisineText);
        if (derived) {
          updates.cuisine = [derived];
          changed = true;
        }
      }

      const totalTime = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
      if (totalTime > 0 && totalTime !== recipe.totalTimeMinutes) {
        updates.totalTimeMinutes = totalTime;
        changed = true;
      }

      const primaryProtein = updates.primaryProtein ?? recipe.primaryProtein;
      const complexityTier = updates.complexityTier ?? recipe.complexityTier;
      const hasGeneratorMetadata =
        primaryProtein != null && complexityTier != null;
      if (recipe.isGeneratorEligible !== hasGeneratorMetadata) {
        updates.isGeneratorEligible = hasGeneratorMetadata;
        changed = true;
      }

      if (changed) {
        await ctx.db.patch(recipe._id, updates);
        updatedCount++;
      }
    }

    return {
      message: `Backfilled meal-plan fields for ${updatedCount} user recipes`,
      totalUserRecipes: userRecipes.length,
      updatedCount,
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
        const doc = {
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
        };
        await ctx.db.replace(id, doc as Doc<"recipes">);
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

/**
 * Validate and set isGeneratorEligible on all recipes.
 * Eligibility matches buildPool (meal plan generator): true when primaryProtein and complexityTier are both set and non-empty, or when isGeneratorEligible was already true.
 * Run from the dashboard to backfill or correct isGeneratorEligible after bulk imports or schema changes.
 */
export const validateRecipesGeneratorEligibility = internalMutation({
  args: {},
  handler: async (ctx) => {
    const recipes = await ctx.db.query("recipes").collect();
    let updated = 0;
    const now = Date.now();

    for (const recipe of recipes) {
      const hasMetadata =
        recipe.primaryProtein != null && recipe.complexityTier != null;
      const eligible = recipe.isGeneratorEligible === true || hasMetadata;
      const current = recipe.isGeneratorEligible === true;
      if (eligible !== current) {
        await ctx.db.patch(recipe._id, {
          isGeneratorEligible: eligible,
          updatedAt: now,
        });
        updated++;
      }
    }

    return { total: recipes.length, updated };
  },
});

type SeedItem = {
  name: string;
  externalId?: string;
  foodGroup?: string;
  foodSubGroup?: string;
  displayName?: string;
  aliases: string[];
};

/**
 * Seed ingredients table from convex/ingredients-seed.json. Upserts by externalId.
 * Regenerate the seed file with: pnpm run ingredients-seed-preview
 * Then run: npx convex run migrations:seedIngredients
 * Uses whatever deployment is active (dev by default); run with npx convex dev first for local/dev.
 */
export const seedIngredients = internalMutation({
  args: {},
  handler: async (ctx) => {
    const items: SeedItem[] = (ingredientsSeedData as { items: SeedItem[] }).items ?? [];
    let inserted = 0;
    let updated = 0;
    for (const item of items) {
      let existing: Doc<"ingredients"> | null = null;
      if (item.externalId && item.externalId.trim() !== "") {
        existing = await ctx.db
          .query("ingredients")
          .withIndex("by_externalId", (q) => q.eq("externalId", item.externalId as string))
          .first();
      } else {
        existing = await ctx.db
          .query("ingredients")
          .filter((q) => q.eq(q.field("name"), item.name))
          .first();
      }
      const doc = {
        name: item.name,
        foodGroup: item.foodGroup,
        displayName: item.displayName,
        foodSubGroup: item.foodSubGroup ?? undefined,
        isCustom: false,
        externalId: item.externalId?.trim() ? item.externalId : undefined,
        aliases: item.aliases,
      };
      if (existing) {
        await ctx.db.patch(existing._id, doc);
        updated++;
      } else {
        await ctx.db.insert("ingredients", doc);
        inserted++;
      }
    }
    return { inserted, updated, total: items.length };
  },
});

const BACKFILL_BATCH_SIZE = 100;

/**
 * Backfill ingredientId on existing recipe ingredients using the current
 * ingredients table (names + aliases). Processes recipes in batches to avoid
 * exceeding read limits.
 *
 * Run: npx convex run migrations:backfillRecipeIngredientIds
 */
export const backfillRecipeIngredientIds = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allIngredients = await ctx.db.query("ingredients").collect();
    let cursor: string | null = null;
    let updated = 0;
    let totalRecipes = 0;

    while (true) {
      const result = await ctx.db
        .query("recipes")
        .order("asc")
        .paginate({
          numItems: BACKFILL_BATCH_SIZE,
          cursor,
        });
      const batch = result.page;
      totalRecipes += batch.length;
      if (batch.length === 0) break;

      for (const recipe of batch) {
        if (!recipe.ingredients || recipe.ingredients.length === 0) continue;

        let changed = false;
        const nextIngredients = recipe.ingredients.map((ing) => {
          if (ing.ingredientId || !ing.name) return ing;
          const ingredientId =
            resolveIngredientIdFromList(allIngredients, ing.name) ?? undefined;
          if (ingredientId) {
            changed = true;
            return { ...ing, ingredientId };
          }
          return ing;
        });

        if (changed) {
          await ctx.db.patch(recipe._id, { ingredients: nextIngredients });
          updated++;
        }
      }

      if (result.isDone) break;
      cursor = result.continueCursor ?? null;
    }

    return { updated, totalRecipes };
  },
});
