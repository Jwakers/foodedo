import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import {
  COMPLEXITY_TIERS,
  ComplexityTier,
  Cuisine,
  CUISINES,
  PreparationOption,
  PRIMARY_PROTEINS,
  PrimaryProtein,
  RecipeCategory,
  RecipeSource,
  Unit,
} from "./lib/constants";

import { WithoutSystemFields } from "convex/server";
import {
  buildCanonicalIngredientDocsMap,
  recipeLinesForMatcher,
} from "./lib/applyMethodIngredientRefs";
import {
  normaliseIngredientName,
  resolveIngredientIdFromList,
} from "./ingredients";
import { generateRecipeIngredientId } from "./recipes";
import { INGREDIENT_FOOD_GROUPS } from "./lib/ingredientFoodGroups";
import { getSuggestedIngredientRefsForStep } from "./lib/recipeStepIngredientMatch";
import ingredientsSeedData from "./ingredients-seed.json";
import ingredientsSeedManualData from "./ingredients-seed-manual.json";
import { SYSTEM_RECIPES } from "./lib/systemRecipes";

/**
 * Several exports below are historical one-off ops (e.g. `backfillRecipeIngredientRowIds`,
 * `backfillRecipeIngredientIds`, `clearRecipeIngredientIds`, `deleteCategoryIngredients`,
 * `getRecipeIngredientAssociations`). They stay in-repo for rare DB maintenance; confirm
 * production/staging state before deleting any of them. See AGENTS.md for day-to-day ops.
 */

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
 * Migration to remove the createdAt field from all mealPlans.
 * One-off cleanup after schema change; no longer related to ingredients.
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
  foodGroup?: Doc<"ingredients">["foodGroup"];
  foodSubGroup?: Doc<"ingredients">["foodSubGroup"];
  displayName?: string;
  aliases: string[];
};

/**
 * Seed ingredients table from convex/ingredients-seed.json. Upserts by externalId.
 * This reads the existing, manually curated seed file without regenerating it.
 *
 * Run: npx convex run migrations:seedIngredients
 *
 * Uses whatever deployment is active (dev by default); run with npx convex dev
 * first for local/dev so changes apply to the correct environment.
 */
export const seedIngredients = internalMutation({
  args: {},
  handler: async (ctx) => {
    const baseItems: SeedItem[] =
      (ingredientsSeedData as { items: SeedItem[] }).items ?? [];
    const manualItems: SeedItem[] =
      (ingredientsSeedManualData as { items: SeedItem[] }).items ?? [];
    // Combine base seed and manual additions into a single list.
    // Manual items come last so they can override by name when no externalId is present.
    const items: SeedItem[] = [...baseItems, ...manualItems];

    // Load all existing ingredients once to stay under Convex read limits.
    const existingIngredients = await ctx.db.query("ingredients").collect();
    const byExternalId = new Map<string, Doc<"ingredients">>();
    const byNormalisedName = new Map<string, Doc<"ingredients">>();
    for (const ing of existingIngredients) {
      if (ing.externalId) {
        byExternalId.set(ing.externalId, ing);
      }
      const key = normaliseIngredientName(ing.name);
      if (!byNormalisedName.has(key)) {
        byNormalisedName.set(key, ing);
      }
    }

    let inserted = 0;
    let updated = 0;
    for (const item of items) {
      const trimmed = item.externalId?.trim();
      const extId =
        trimmed !== undefined && trimmed !== "" ? trimmed : undefined;
      let existing: Doc<"ingredients"> | null = null;
      if (extId) {
        existing = byExternalId.get(extId) ?? null;
      } else {
        existing = byNormalisedName.get(normaliseIngredientName(item.name)) ?? null;
      }

      // Normalise foodGroup to schema value (e.g. "Herbs and Spices" -> "Herbs and spices")
      const rawGroup = item.foodGroup;
      const foodGroup: Doc<"ingredients">["foodGroup"] | undefined =
        rawGroup && typeof rawGroup === "string"
          ? ((INGREDIENT_FOOD_GROUPS as readonly string[]).find(
              (g) => g.toLowerCase() === rawGroup.toLowerCase()
            ) as Doc<"ingredients">["foodGroup"] | undefined) ?? undefined
          : (rawGroup as Doc<"ingredients">["foodGroup"] | undefined);

      const doc = {
        name: item.name,
        foodGroup,
        displayName: item.displayName,
        foodSubGroup: (item.foodSubGroup ?? undefined) as
          | Doc<"ingredients">["foodSubGroup"]
          | undefined,
        externalId: extId,
        aliases: item.aliases ?? [],
      };
      if (existing) {
        await ctx.db.patch(existing._id, doc);
        updated++;
      } else {
        const id = await ctx.db.insert("ingredients", doc);
        inserted++;
        // So subsequent items in this run with the same name (e.g. manual override of base) update instead of re-inserting
        const insertedDoc = await ctx.db.get(id);
        if (insertedDoc) {
          byNormalisedName.set(normaliseIngredientName(insertedDoc.name), insertedDoc);
          if (insertedDoc.externalId) {
            byExternalId.set(insertedDoc.externalId, insertedDoc);
          }
        }
      }
    }
    return { inserted, updated, total: items.length };
  },
});

/**
 * Backfill optional `id` on recipe ingredients. Each ingredient without an id
 * gets a unique id (unique only within that recipe). Safe to run multiple times.
 * Run: npx convex run migrations:backfillRecipeIngredientRowIds
 */
export const backfillRecipeIngredientRowIds = internalMutation({
  args: {},
  handler: async (ctx) => {
    const recipes = await ctx.db.query("recipes").collect();
    let updated = 0;
    for (const recipe of recipes) {
      if (!recipe.ingredients || recipe.ingredients.length === 0) continue;
      const existing = new Set<string>();
      const nextIngredients = recipe.ingredients.map((ing) => {
        const trimmed = ing.id?.trim();
        const id =
          !trimmed || existing.has(trimmed)
            ? generateRecipeIngredientId(existing)
            : trimmed;
        existing.add(id);
        return { ...ing, id };
      });
      const changed = nextIngredients.some(
        (n, i) =>
          (recipe.ingredients![i] as { id?: string })?.id !== (n as { id?: string }).id,
      );
      if (changed) {
        await ctx.db.patch(recipe._id, { ingredients: nextIngredients });
        updated++;
      }
    }
    return { updated, totalRecipes: recipes.length };
  },
});

/**
 * Backfill ingredientId on existing recipe ingredients using the current
 * ingredients table (names + aliases). Always overwrites: each ingredient's
 * ingredientId is set to the resolved value or undefined (never left as-is).
 * Run repeatedly as ingredients/aliases change.
 *
 * Prerequisite: run seedIngredients first so the ingredients table is
 * populated from convex/ingredients-seed.json (same deployment as this backfill).
 *
 * Run: npx convex run migrations:backfillRecipeIngredientIds
 */
export const backfillRecipeIngredientIds = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allIngredients = await ctx.db.query("ingredients").collect();
    const recipes = await ctx.db.query("recipes").collect();
    const ingredientIdCache = new Map<string, Id<"ingredients">>();
    let updated = 0;

    for (const recipe of recipes) {
      if (!recipe.ingredients || recipe.ingredients.length === 0) continue;

      const nextIngredients = recipe.ingredients.map((ing) => {
        if (!ing.name) {
          return { ...ing, ingredientId: undefined };
        }
        const key = normaliseIngredientName(ing.name);
        let resolved: Id<"ingredients"> | undefined =
          ingredientIdCache.get(key);
        if (resolved === undefined) {
          const found = resolveIngredientIdFromList(allIngredients, ing.name);
          if (found) {
            ingredientIdCache.set(key, found);
            resolved = found;
          }
        }
        return { ...ing, ingredientId: resolved };
      });

      const changed = nextIngredients.some(
        (n, i) =>
          (recipe.ingredients![i]?.ingredientId ?? undefined) !==
          (n.ingredientId ?? undefined),
      );
      if (changed) {
        await ctx.db.patch(recipe._id, { ingredients: nextIngredients });
        updated++;
      }
    }

    return {
      updated,
      totalRecipes: recipes.length,
      ingredientsTableCount: allIngredients.length,
    };
  },
});

const RECONCILE_BATCH_SIZE = 100;

const recipeCursorValidator = v.object({
  creationTime: v.number(),
  id: v.id("recipes"),
});
const shoppingCursorValidator = v.object({
  creationTime: v.number(),
  id: v.id("shoppingListItems"),
});

/**
 * Re-resolve ingredientId on all recipe ingredients and shopping list items
 * using the current ingredients table (names + aliases). Processes one batch of
 * recipes and one batch of shopping list items per run, then schedules a
 * continuation so each run stays within mutation limits. Accepts optional
 * cursor args to resume. Call after ingredients are added, updated, removed,
 * or have aliases changed. Used by admin ingredient mutations via scheduler;
 * can also be run manually: npx convex run migrations:reconcileIngredientReferences
 */
export const reconcileIngredientReferences = internalMutation({
  args: {
    recipeCursor: v.optional(recipeCursorValidator),
    shoppingCursor: v.optional(shoppingCursorValidator),
  },
  handler: async (ctx, args) => {
    const allIngredients = await ctx.db.query("ingredients").collect();
    const ingredientIdCache = new Map<string, Id<"ingredients">>();
    let recipesUpdated = 0;
    let shoppingItemsUpdated = 0;

    type RecipeCursor = { creationTime: number; id: Id<"recipes"> };
    type ShoppingCursor = {
      creationTime: number;
      id: Id<"shoppingListItems">;
    };
    let recipeCursor: RecipeCursor | null = args.recipeCursor ?? null;
    let shoppingCursor: ShoppingCursor | null = args.shoppingCursor ?? null;

    const recipesBatch: Doc<"recipes">[] =
      recipeCursor === null
        ? await ctx.db
            .query("recipes")
            .order("asc")
            .take(RECONCILE_BATCH_SIZE)
        : await ctx.db
            .query("recipes")
            .order("asc")
            .filter((q) =>
              q.or(
                q.gt(q.field("_creationTime"), recipeCursor!.creationTime),
                q.and(
                  q.eq(q.field("_creationTime"), recipeCursor!.creationTime),
                  q.gt(q.field("_id"), recipeCursor!.id),
                ),
              ),
            )
            .take(RECONCILE_BATCH_SIZE);

    for (const recipe of recipesBatch) {
      if (!recipe.ingredients || recipe.ingredients.length === 0) continue;

      type RecipeIngredient = Doc<"recipes">["ingredients"] extends
        | (infer I)[]
        | undefined
        ? I
        : never;
      const nextIngredients = recipe.ingredients.map((ing: RecipeIngredient) => {
        if (!ing.name) {
          return { ...ing, ingredientId: undefined };
        }
        const key = normaliseIngredientName(ing.name);
        let resolved: Id<"ingredients"> | undefined =
          ingredientIdCache.get(key);
        if (resolved === undefined) {
          const found = resolveIngredientIdFromList(
            allIngredients,
            ing.name,
          );
          if (found) {
            ingredientIdCache.set(key, found);
            resolved = found;
          }
        }
        return { ...ing, ingredientId: resolved };
      });

      const changed = nextIngredients.some(
        (n: RecipeIngredient, i: number) =>
          (recipe.ingredients![i]?.ingredientId ?? undefined) !==
          (n.ingredientId ?? undefined),
      );
      if (changed) {
        await ctx.db.patch(recipe._id, { ingredients: nextIngredients });
        recipesUpdated++;
      }
    }

    if (recipesBatch.length > 0) {
      const last = recipesBatch[recipesBatch.length - 1]!;
      recipeCursor = { creationTime: last._creationTime, id: last._id };
    }

    const itemsBatch: Doc<"shoppingListItems">[] =
      shoppingCursor === null
        ? await ctx.db
            .query("shoppingListItems")
            .order("asc")
            .take(RECONCILE_BATCH_SIZE)
        : await ctx.db
            .query("shoppingListItems")
            .order("asc")
            .filter((q) =>
              q.or(
                q.gt(q.field("_creationTime"), shoppingCursor!.creationTime),
                q.and(
                  q.eq(q.field("_creationTime"), shoppingCursor!.creationTime),
                  q.gt(q.field("_id"), shoppingCursor!.id),
                ),
              ),
            )
            .take(RECONCILE_BATCH_SIZE);

    for (const item of itemsBatch) {
      let resolved: Id<"ingredients"> | undefined;
      if (!item.name?.trim()) {
        resolved = undefined;
      } else {
        const key = normaliseIngredientName(item.name);
        resolved = ingredientIdCache.get(key);
        if (resolved === undefined) {
          const found = resolveIngredientIdFromList(
            allIngredients,
            item.name,
          );
          if (found) {
            ingredientIdCache.set(key, found);
            resolved = found;
          }
        }
      }
      const currentId = item.ingredientId ?? undefined;
      if (currentId !== resolved) {
        await ctx.db.patch(item._id, {
          ingredientId: resolved,
        });
        shoppingItemsUpdated++;
      }
    }

    if (itemsBatch.length > 0) {
      const lastItem = itemsBatch[itemsBatch.length - 1]!;
      shoppingCursor = {
        creationTime: lastItem._creationTime,
        id: lastItem._id,
      };
    }

    const hasMore =
      recipesBatch.length === RECONCILE_BATCH_SIZE ||
      itemsBatch.length === RECONCILE_BATCH_SIZE;
    if (hasMore) {
      await ctx.scheduler.runAfter(0, internal.migrations.reconcileIngredientReferences, {
        recipeCursor: recipeCursor ?? undefined,
        shoppingCursor: shoppingCursor ?? undefined,
      });
    }

    return {
      recipesUpdated,
      shoppingItemsUpdated,
      ingredientsCount: allIngredients.length,
      scheduled: hasMore,
    };
  },
});

/**
 * One-off: clear ingredientId on all recipe ingredients.
 *
 * Useful when reseeding the ingredients table such that IDs may change:
 * - Run seedIngredients to upsert the new ingredient catalog.
 * - Run clearRecipeIngredientIds to remove all existing ingredientId links.
 * - Run backfillRecipeIngredientIds to re-resolve ingredientId for each recipe.
 *
 * Run:
 *   npx convex run migrations:clearRecipeIngredientIds
 */
export const clearRecipeIngredientIds = internalMutation({
  args: {},
  handler: async (ctx) => {
    const recipes = await ctx.db.query("recipes").collect();
    let updated = 0;

    for (const recipe of recipes) {
      if (!recipe.ingredients || recipe.ingredients.length === 0) continue;

      const nextIngredients = recipe.ingredients.map((ing) => {
        if (ing.ingredientId === undefined) return ing;
        const { ingredientId, ...rest } = ing;
        return { ...rest, ingredientId: undefined };
      });

      const changed = nextIngredients.some(
        (n, i) =>
          (recipe.ingredients![i]?.ingredientId ?? undefined) !==
          (n.ingredientId ?? undefined),
      );
      if (!changed) continue;

      await ctx.db.patch(recipe._id, { ingredients: nextIngredients });
      updated++;
    }

    return { updated, totalRecipes: recipes.length };
  },
});

/**
 * Report: list all recipe ingredients and their associated canonical ingredient
 * (if any). Intended for manual review of ingredient mappings.
 *
 * Run (prints JSON to stdout; redirect to a file if desired):
 *   npx convex run migrations:getRecipeIngredientAssociations
 *   npx convex run migrations:getRecipeIngredientAssociations > docs/ingredient-associations.json
 */
export const getRecipeIngredientAssociations = internalMutation({
  args: {},
  handler: async (ctx) => {
    const recipes = await ctx.db.query("recipes").collect();

    const ingredientIdSet = new Set<Id<"ingredients">>();
    for (const recipe of recipes) {
      for (const ing of recipe.ingredients ?? []) {
        if (ing.ingredientId) {
          ingredientIdSet.add(ing.ingredientId);
        }
      }
    }

    const ingredientDocs: Record<string, Doc<"ingredients">> = {};
    for (const id of ingredientIdSet) {
      const doc = await ctx.db.get(id);
      if (doc) {
        ingredientDocs[id] = doc;
      }
    }

    const withReference: {
      recipeId: Id<"recipes">;
      recipeTitle: string;
      ingredientIndex: number;
      ingredientName: string;
      ingredientId: Id<"ingredients">;
      canonicalName: string | null;
      canonicalDisplayName: string | null;
    }[] = [];

    const withoutReference: {
      recipeId: Id<"recipes">;
      recipeTitle: string;
      ingredientIndex: number;
      ingredientName: string;
    }[] = [];

    for (const recipe of recipes) {
      const ingredients = recipe.ingredients ?? [];
      ingredients.forEach((ing, index) => {
        const id = ing.ingredientId ?? null;
        if (!id) {
          withoutReference.push({
            recipeId: recipe._id,
            recipeTitle: recipe.title ?? "",
            ingredientIndex: index,
            ingredientName: ing.name ?? "",
          });
          return;
        }
        const canonical = ingredientDocs[id];
        withReference.push({
          recipeId: recipe._id,
          recipeTitle: recipe.title ?? "",
          ingredientIndex: index,
          ingredientName: ing.name ?? "",
          ingredientId: id,
          canonicalName: canonical?.name ?? null,
          canonicalDisplayName: canonical?.displayName ?? null,
        });
      });
    }

    return { withReference, withoutReference };
  },
});

/**
 * One-off: delete ingredient rows that are category labels (e.g. top-level
 * groups like "Fruits" or "Cereals and cereal products") that should not
 * exist as individual ingredients.
 *
 * Run once if these labels were imported into the ingredients table:
 *   npx convex run migrations:deleteCategoryIngredients
 */
const INGREDIENT_CATEGORY_NAMES = new Set([
  "Alcoholic beverages",
  "Beverages",
  "Brassicas",
  "Cereals and cereal products",
  "Citrus",
  "Cocoa and cocoa products",
  "Coffee",
  "Coffee and coffee products",
  "Crustaceans",
  "Eggs",
  "Fats and oils",
  "Fishes",
  "Fruits",
  "Green vegetables",
  "Herbs and spices",
  "Lentils",
  "Milk and milk products",
  "Mollusks",
  "Mushrooms",
  "Nuts",
  "Onion-family vegetables",
  "Pomes",
  "Pulses",
  "Roe",
  "Root vegetables",
]);

export const deleteCategoryIngredients = internalMutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("ingredients").collect();
    const toDelete = all.filter((ing) =>
      INGREDIENT_CATEGORY_NAMES.has(ing.name),
    );
    const idsToDelete = new Set(toDelete.map((d) => d._id));

    // Clear recipe.ingredients[].ingredientId and shoppingListItems.ingredientId before delete
    const recipes = await ctx.db.query("recipes").collect();
    for (const recipe of recipes) {
      const ingredients = recipe.ingredients ?? [];
      const updated = ingredients.map((ing) =>
        ing.ingredientId && idsToDelete.has(ing.ingredientId)
          ? { ...ing, ingredientId: undefined }
          : ing
      );
      if (updated.some((ing, i) => (ingredients[i]?.ingredientId ?? null) !== (ing.ingredientId ?? null))) {
        await ctx.db.patch(recipe._id, { ingredients: updated });
      }
    }
    const allItems = await ctx.db.query("shoppingListItems").collect();
    for (const item of allItems) {
      if (item.ingredientId && idsToDelete.has(item.ingredientId)) {
        await ctx.db.patch(item._id, { ingredientId: undefined });
      }
    }

    for (const doc of toDelete) {
      await ctx.db.delete(doc._id);
    }
    return { deleted: toDelete.length, names: toDelete.map((d) => d.name) };
  },
});

const METHOD_INGREDIENT_REFS_BATCH = 50;

function methodStepsIngredientBackfillPatchNeeded(
  old: Doc<"recipes">["method"] | undefined,
  next: NonNullable<Doc<"recipes">["method"]>,
): boolean {
  if ((old?.length ?? 0) !== next.length) return true;
  for (let i = 0; i < next.length; i++) {
    const a = old![i]!;
    const b = next[i]!;
    if (
      a.title !== b.title ||
      (a.description ?? "") !== (b.description ?? "") ||
      a.image !== b.image
    ) {
      return true;
    }
    if (a.ingredientRefsSource !== b.ingredientRefsSource) return true;
    const ar = [...(a.ingredientRefs ?? [])].sort().join("\0");
    const br = [...(b.ingredientRefs ?? [])].sort().join("\0");
    if (ar !== br) return true;
    const legacy = a as { ingredientIds?: Id<"ingredients">[] };
    if (legacy.ingredientIds && legacy.ingredientIds.length > 0) return true;
  }
  return false;
}

/**
 * Backfill `method[].ingredientRefs` + `ingredientRefsSource` for all recipes using the shared matcher;
 * strips legacy `method[].ingredientIds` from stored steps.
 *
 * Run: `npx convex run migrations:backfillMethodStepIngredientRefs`
 * Re-run safe: skips recipes that already match the target shape.
 */
export const backfillMethodStepIngredientRefs = internalMutation({
  args: {
    recipeCursor: v.optional(recipeCursorValidator),
  },
  handler: async (ctx, args) => {
    type RecipeCursor = { creationTime: number; id: Id<"recipes"> };
    let recipeCursor: RecipeCursor | null = args.recipeCursor ?? null;

    const batch: Doc<"recipes">[] =
      recipeCursor === null
        ? await ctx.db
            .query("recipes")
            .order("asc")
            .take(METHOD_INGREDIENT_REFS_BATCH)
        : await ctx.db
            .query("recipes")
            .order("asc")
            .filter((q) =>
              q.or(
                q.gt(q.field("_creationTime"), recipeCursor!.creationTime),
                q.and(
                  q.eq(q.field("_creationTime"), recipeCursor!.creationTime),
                  q.gt(q.field("_id"), recipeCursor!.id),
                ),
              ),
            )
            .take(METHOD_INGREDIENT_REFS_BATCH);

    let recipesUpdated = 0;

    for (const recipe of batch) {
      const lines = recipeLinesForMatcher(recipe.ingredients);
      const canonMap = await buildCanonicalIngredientDocsMap(
        ctx,
        recipe.ingredients,
      );
      const validLineIds = new Set(
        lines.map((l) => l.id).filter((id): id is string => !!id),
      );
      const nextMethod = (recipe.method ?? []).map((step) => {
        const legacyIds = (step as { ingredientIds?: Id<"ingredients">[] })
          .ingredientIds;
        const existingRefs = step.ingredientRefs ?? [];
        if (existingRefs.length > 0) {
          const filteredRefs = existingRefs.filter((r) => validLineIds.has(r));
          if (filteredRefs.length > 0) {
            return {
              title: step.title,
              description: step.description,
              image: step.image,
              ingredientRefs: filteredRefs,
              ingredientRefsSource: "user" as const,
            };
          }
        }
        if (legacyIds?.length) {
          const lineIds: string[] = [];
          const seen = new Set<string>();
          for (const line of lines) {
            if (
              line.id &&
              line.ingredientId &&
              legacyIds.some((lid) => lid === line.ingredientId) &&
              !seen.has(line.id)
            ) {
              seen.add(line.id);
              lineIds.push(line.id);
            }
          }
          return {
            title: step.title,
            description: step.description,
            image: step.image,
            ingredientRefs: lineIds.length ? lineIds : undefined,
            ingredientRefsSource: "auto" as const,
          };
        }
        const suggested = getSuggestedIngredientRefsForStep(
          { title: step.title, description: step.description ?? null },
          lines,
          canonMap,
        );
        return {
          title: step.title,
          description: step.description,
          image: step.image,
          ingredientRefs: suggested.length ? suggested : undefined,
          ingredientRefsSource: "auto" as const,
        };
      });

      if (methodStepsIngredientBackfillPatchNeeded(recipe.method, nextMethod)) {
        await ctx.db.patch(recipe._id, { method: nextMethod });
        recipesUpdated++;
      }
    }

    if (batch.length > 0) {
      const last = batch[batch.length - 1]!;
      recipeCursor = { creationTime: last._creationTime, id: last._id };
    }

    const hasMore = batch.length === METHOD_INGREDIENT_REFS_BATCH;
    if (hasMore) {
      await ctx.scheduler.runAfter(
        0,
        internal.migrations.backfillMethodStepIngredientRefs,
        { recipeCursor: recipeCursor! },
      );
    }

    return { recipesUpdated, scheduled: hasMore };
  },
});
