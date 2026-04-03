import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { canAccessRecipe } from "./households";
import { resolveIngredientIdFromList } from "./ingredients";
import {
  buildCanonicalIngredientDocsMap,
  finalizeMethodStepsForSave,
  recipeLinesForMatcher,
} from "./lib/applyMethodIngredientRefs";
import {
  clampEditorialBias,
  CUISINE_MAX_SELECTIONS,
  MAX_WEEKLY_PLAN_POOL_SIZE,
} from "./lib/constants";
import { RECIPE_PUBLIC_SLUG_PATTERN } from "./lib/recipePublicSlug";
import { getSuggestedIngredientRefsForStep } from "./lib/recipeStepIngredientMatch";
import {
  categoriesUnion,
  complexityTierUnion,
  creationSourceUnion,
  cuisineUnion,
  preparationUnion,
  primaryProteinUnion,
  unitsUnion,
} from "./schema";
import {
  getCurrentUser,
  getCurrentUserOrThrow,
  getUserSubscription,
} from "./users";

type MethodStepWithImage = {
  title: string;
  description?: string;
  image?: Id<"_storage">;
  ingredientRefs?: string[];
  ingredientRefsSource?: "auto" | "user";
};

/** Generate a stable id for a recipe ingredient row; unique within the given set. */
export function generateRecipeIngredientId(existing: Set<string>): string {
  let id: string;
  do {
    id = "ri_" + crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  } while (existing.has(id));
  return id;
}

async function resolveMethodImageUrls(
  ctx: QueryCtx,
  method: MethodStepWithImage[] = [],
): Promise<(MethodStepWithImage & { imageUrl?: string | null })[]> {
  return Promise.all(
    method.map(async (step) => {
      if (step.image) {
        const imageUrl = await ctx.storage.getUrl(step.image);
        return { ...step, imageUrl };
      }
      return { ...step, imageUrl: undefined };
    }),
  );
}

/**
 * Return { _id, title } for recipe IDs (for shopping list dev links). Only returns recipes the user can access.
 */
export const getRecipeTitles = query({
  args: {
    ids: v.array(v.id("recipes")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const result: { _id: Id<"recipes">; title: string }[] = [];
    for (const id of args.ids) {
      const recipe = await ctx.db.get(id);
      if (!recipe) continue;
      if (recipe.source === "system") {
        result.push({ _id: id, title: recipe.title });
        continue;
      }
      if (!user) continue;
      const { canAccess } = await canAccessRecipe(ctx, user._id, id);
      if (canAccess) result.push({ _id: id, title: recipe.title });
    }
    return result;
  },
});

export const getRecipe = query({
  args: {
    recipeId: v.id("recipes"),
  },
  handler: async (ctx, args) => {
    const recipe = await ctx.db.get(args.recipeId);

    if (!recipe) return null;

    // System recipes: public access (no auth required) for SEO and unauthenticated visitors
    if (recipe.source === "system") {
      const image = recipe.image
        ? await ctx.storage.getUrl(recipe.image)
        : null;
      const methodWithUrls = await resolveMethodImageUrls(
        ctx,
        recipe.method ?? [],
      );
      return {
        ...recipe,
        image,
        method: methodWithUrls,
        isOwner: false,
        ownerName: null,
      };
    }

    const user = await getCurrentUser(ctx);
    if (!user) throw new ConvexError("User not found");

    // Check if user can access this recipe (owns it or it's shared to their household)
    const { canAccess, isOwner } = await canAccessRecipe(
      ctx,
      user._id,
      args.recipeId,
    );
    if (!canAccess) return null;

    const image = recipe.image ? await ctx.storage.getUrl(recipe.image) : null;

    const methodWithUrls = await resolveMethodImageUrls(
      ctx,
      recipe.method ?? [],
    );

    let ownerName: string | null = null;
    if (!isOwner) {
      const owner = recipe.userId ? await ctx.db.get(recipe.userId) : null;
      ownerName = owner?.name ?? "Unknown User";
    }

    return { ...recipe, image, method: methodWithUrls, isOwner, ownerName };
  },
});

/**
 * Public discover page: load a system recipe by URL slug (indexed).
 */
export const getSystemRecipeBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const slug = args.slug.trim();
    if (!slug || !RECIPE_PUBLIC_SLUG_PATTERN.test(slug)) {
      return null;
    }

    const matches = await ctx.db
      .query("recipes")
      .withIndex("by_publicSlug", (q) => q.eq("publicSlug", slug))
      .collect();

    const recipe = matches.find((r) => r.source === "system") ?? null;
    if (!recipe) {
      return null;
    }

    const image = recipe.image
      ? await ctx.storage.getUrl(recipe.image)
      : null;
    const methodWithUrls = await resolveMethodImageUrls(
      ctx,
      recipe.method ?? [],
    );
    return {
      ...recipe,
      image,
      method: methodWithUrls,
      isOwner: false,
      ownerName: null,
    };
  },
});

/**
 * Get recipe data for editing (includes storage IDs, not just URLs)
 * This is used when initializing the edit form
 */
export const getRecipeForEdit = query({
  args: {
    recipeId: v.id("recipes"),
  },
  handler: async (ctx, args) => {
    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe) return null;

    if (recipe.source === "system") {
      const user = await getCurrentUser(ctx);
      if (user?.isSuperUser !== true) return null;
      return {
        title: recipe.title || "",
        description: recipe.description || "",
        prepTime: recipe.prepTime ?? 0,
        cookTime: recipe.cookTime ?? undefined,
        serves: recipe.serves ?? 1,
        category: recipe.category,
        ingredients: recipe.ingredients || [],
        method: recipe.method || [],
        primaryProtein: recipe.primaryProtein ?? undefined,
        complexityTier: recipe.complexityTier ?? undefined,
        cuisine: recipe.cuisine ?? [],
      };
    }

    const user = await getCurrentUser(ctx);
    if (!user) throw new ConvexError("User not found");

    // Check if user can access this recipe
    const { canAccess, isOwner } = await canAccessRecipe(
      ctx,
      user._id,
      args.recipeId,
    );
    if (!canAccess || !isOwner) return null; // Only owner can edit

    // Return recipe with storage IDs (not URLs) for form initialization
    // User-editable only; totalTimeMinutes is system-only (derived from prep + cook)
    return {
      title: recipe.title || "",
      description: recipe.description || "",
      prepTime: recipe.prepTime ?? 0,
      cookTime: recipe.cookTime ?? undefined,
      serves: recipe.serves ?? 1,
      category: recipe.category,
      ingredients: recipe.ingredients || [],
      method: recipe.method || [],
      primaryProtein: recipe.primaryProtein ?? undefined,
      complexityTier: recipe.complexityTier ?? undefined,
      cuisine: recipe.cuisine ?? [],
    };
  },
});

export const getAllUserRecipes = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    // Return empty array if user doesn't exist yet (race condition on sign-in)
    if (!user) {
      return [];
    }

    const recipes = await ctx.db
      .query("recipes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return await Promise.all(
      recipes.map(async (recipe) => ({
        ...recipe,
        image: recipe.image ? await ctx.storage.getUrl(recipe.image) : null,
      })),
    );
  },
});

/**
 * Get system recipes without images for the image generation script.
 * Returns minimal fields: _id, title, description.
 * Used by: pnpm run generate-recipe-images
 */
export const getSystemRecipesForImageGeneration = query({
  args: {},
  handler: async (ctx) => {
    const recipes = await ctx.db
      .query("recipes")
      .withIndex("by_source", (q) => q.eq("source", "system"))
      .collect();

    return recipes
      .filter((r) => !r.image)
      .map((r) => ({
        _id: r._id,
        title: r.title,
        description: r.description ?? null,
        method: (r.method ?? []).map((step) => ({
          title: step.title,
          description: step.description ?? null,
        })),
      }));
  },
});

/**
 * List all system recipes (public, no auth required).
 * Used by Discover page for SEO and unauthenticated visitors.
 */
export const getSystemRecipes = query({
  args: {},
  handler: async (ctx) => {
    const recipes = await ctx.db
      .query("recipes")
      .withIndex("by_source", (q) => q.eq("source", "system"))
      .collect();

    const withUrls = await Promise.all(
      recipes.map(async (r) => ({
        ...r,
        image: r.image ? await ctx.storage.getUrl(r.image) : null,
      })),
    );

    withUrls.sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
    );
    return withUrls;
  },
});

/**
 * Public discover URLs for sitemap.xml only: `publicSlug` + `updatedAt`.
 * Does not call storage (no image URLs) and returns a small payload vs `getSystemRecipes`.
 */
export const getSystemRecipeSitemapEntries = query({
  args: {},
  handler: async (ctx) => {
    const recipes = await ctx.db
      .query("recipes")
      .withIndex("by_source", (q) => q.eq("source", "system"))
      .collect();

    return recipes
      .filter(
        (r): r is Doc<"recipes"> & { publicSlug: string } =>
          typeof r.publicSlug === "string" && r.publicSlug.length > 0,
      )
      .map((r) => ({ publicSlug: r.publicSlug, updatedAt: r.updatedAt }))
      .sort((a, b) =>
        a.publicSlug.localeCompare(b.publicSlug, undefined, {
          sensitivity: "base",
        }),
      );
  },
});

/**
 * Get up to N recipes from the user's pool (system + user + household) for weekly plan generation.
 * No intelligent selection—deterministic order by _id, take first `limit`. Used by "Generate My Week".
 */
export const getRecipesForWeeklyPlan = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const limit = Math.min(Math.max(1, args.limit), MAX_WEEKLY_PLAN_POOL_SIZE);

    // 1. System recipe ids
    const systemRecipes = await ctx.db
      .query("recipes")
      .withIndex("by_source", (q) => q.eq("source", "system"))
      .collect();
    const systemIds = new Set(systemRecipes.map((r) => r._id));

    // 2. User recipe ids
    const userRecipes = await ctx.db
      .query("recipes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const userIds = new Set(userRecipes.map((r) => r._id));

    // 3. Household recipe ids (user is member of household that has access)
    const memberships = await ctx.db
      .query("householdMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const householdIds = [...new Set(memberships.map((m) => m.householdId))];
    const sharedPerHousehold = await Promise.all(
      householdIds.map((householdId) =>
        ctx.db
          .query("householdRecipes")
          .withIndex("by_household", (q) => q.eq("householdId", householdId))
          .collect(),
      ),
    );
    const householdRecipeIds = new Set<Id<"recipes">>();
    for (const shared of sharedPerHousehold) {
      for (const s of shared) {
        householdRecipeIds.add(s.recipeId);
      }
    }

    // 4. Dedupe and sort deterministically
    const allIds = [
      ...new Set([...systemIds, ...userIds, ...householdRecipeIds]),
    ].sort();

    // 5. Take first `limit` and fetch full docs (with access check for household recipes)
    const idsToFetch = allIds.slice(0, limit);
    const recipeDocs = await Promise.all(
      idsToFetch.map((id) => ctx.db.get(id)),
    );
    const withAccessAndUrl = await Promise.all(
      recipeDocs.map(async (recipe, i) => {
        if (!recipe) return null;
        const recipeId = idsToFetch[i];
        if (recipe.source !== "system" && recipe.userId !== user._id) {
          const { canAccess } = await canAccessRecipe(ctx, user._id, recipeId);
          if (!canAccess) return null;
        }
        const image = recipe.image
          ? await ctx.storage.getUrl(recipe.image)
          : null;
        const totalMin =
          recipe.totalTimeMinutes ??
          (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
        return {
          _id: recipe._id,
          title: recipe.title,
          image,
          prepTime: recipe.prepTime ?? 0,
          cookTime: recipe.cookTime,
          totalTimeMinutes: totalMin > 0 ? totalMin : undefined,
          nutrition: recipe.nutrition,
          category: recipe.category,
        };
      }),
    );
    const results = withAccessAndUrl.filter(
      (r): r is NonNullable<typeof r> => r != null,
    );

    return results;
  },
});

export const getRecentActivity = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    // Return empty activity if user doesn't exist yet (race condition on sign-in)
    if (!user) {
      return { recent: [] };
    }

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Get recently updated recipes (last 7 days)
    const recentRecipes = await ctx.db
      .query("recipes")
      .withIndex("by_user_updatedAt", (q) =>
        q.eq("userId", user._id).gte("updatedAt", sevenDaysAgo),
      )
      .order("desc")
      .take(5);

    // Process images
    const processRecipes = async (recipes: Doc<"recipes">[]) => {
      return await Promise.all(
        recipes.map(async (recipe) => ({
          ...recipe,
          image: recipe.image ? await ctx.storage.getUrl(recipe.image) : null,
        })),
      );
    };

    const recent = await processRecipes(recentRecipes);

    return {
      recent,
    };
  },
});

export const createEmptyRecipe = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    const subscription = await getUserSubscription(user, ctx);

    // Check recipe limit
    const recipes = await ctx.db
      .query("recipes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    if (
      subscription.maxRecipes !== -1 &&
      recipes.length >= subscription.maxRecipes
    ) {
      return {
        error: `You've reached the limit of ${subscription.maxRecipes} recipes on this plan.`,
        recipeId: null,
      };
    }

    const recipeId = await ctx.db.insert("recipes", {
      userId: user._id,
      title: "",
      prepTime: 0,
      cookTime: undefined,
      serves: 1, // Must be at least 1 to match frontend schema validation
      category: "main",
      creationSource: "manual",
      source: "user",
      updatedAt: Date.now(),
    });

    return { recipeId, error: null };
  },
});

export const createRecipe = mutation({
  args: {
    creationSource: creationSourceUnion,
    title: v.string(),
    description: v.optional(v.string()),
    prepTime: v.number(),
    cookTime: v.optional(v.number()),
    serves: v.number(),
    category: categoriesUnion,
    ingredients: v.array(
      v.object({
        name: v.string(),
        amount: v.optional(v.number()),
        unit: v.optional(unitsUnion),
        preparation: v.optional(preparationUnion),
      }),
    ),
    method: v.array(
      v.object({
        title: v.string(),
        description: v.optional(v.string()),
        image: v.optional(v.id("_storage")),
      }),
    ),
    nutrition: v.optional(
      v.object({
        calories: v.optional(v.number()),
        protein: v.optional(v.number()),
        fat: v.optional(v.number()),
        carbohydrates: v.optional(v.number()),
      }),
    ),
    originalUrl: v.optional(v.string()),
    originalAuthor: v.optional(v.string()),
    originalPublishedDate: v.optional(v.string()),
    primaryProtein: v.optional(primaryProteinUnion),
    complexityTier: v.optional(complexityTierUnion),
    cuisine: v.optional(v.array(cuisineUnion)),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const subscription = await getUserSubscription(user, ctx);

    // Check recipe limit
    const recipes = await ctx.db
      .query("recipes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    if (
      subscription.maxRecipes !== -1 &&
      recipes.length >= subscription.maxRecipes
    ) {
      return {
        error: `You've reached the limit of ${subscription.maxRecipes} recipes on this plan.`,
        recipeId: null,
        validationErrors: null,
      };
    }

    let ingredients = args.ingredients;
    if (ingredients?.length) {
      const allIngredients = await ctx.db.query("ingredients").collect();
      const usedIds = new Set<string>();
      ingredients = ingredients.map((ing) => {
        const ingredientId =
          resolveIngredientIdFromList(allIngredients, ing.name) ?? undefined;
        const id = generateRecipeIngredientId(usedIds);
        usedIds.add(id);
        return { ...ing, ingredientId, id };
      });
    }

    const now = Date.now();
    let originalPublishedDate: number | undefined;
    if (args.originalPublishedDate) {
      const parsedDate = new Date(args.originalPublishedDate);
      if (isNaN(parsedDate.getTime())) {
        throw new ConvexError("Invalid originalPublishedDate format");
      }
      originalPublishedDate = parsedDate.getTime();
    }

    if (
      args.cuisine !== undefined &&
      args.cuisine.length > CUISINE_MAX_SELECTIONS
    ) {
      throw new ConvexError(
        `cuisine must have at most ${CUISINE_MAX_SELECTIONS} items`,
      );
    }

    // System-only: totalTimeMinutes is always derived from prep + cook
    const totalTimeMinutes = args.prepTime + (args.cookTime ?? 0);
    const hasGeneratorMetadata =
      args.primaryProtein != null && args.complexityTier != null;

    const lines = recipeLinesForMatcher(ingredients);
    const canonMap = await buildCanonicalIngredientDocsMap(
      ctx,
      (ingredients ?? []) as { ingredientId?: Id<"ingredients"> }[],
    );
    const methodWithRefs = args.method.map((step) => {
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

    const recipeId = await ctx.db.insert("recipes", {
      userId: user._id,
      title: args.title,
      description: args.description,
      prepTime: args.prepTime,
      cookTime: args.cookTime,
      serves: args.serves,
      category: args.category,
      ingredients,
      method: methodWithRefs,
      creationSource: args.creationSource,
      source: "user",
      nutrition: args.nutrition,
      originalUrl: args.originalUrl,
      originalAuthor: args.originalAuthor,
      importedAt: args.originalUrl ? now : undefined,
      originalPublishedDate,
      updatedAt: now,
      primaryProtein: args.primaryProtein,
      complexityTier: args.complexityTier,
      cuisine: args.cuisine,
      totalTimeMinutes: totalTimeMinutes > 0 ? totalTimeMinutes : undefined,
      editorialBias: clampEditorialBias(1),
      isGeneratorEligible: hasGeneratorMetadata,
    });

    const recipe = await ctx.db.get(recipeId);
    if (!recipe) throw new ConvexError("Recipe not found");

    const errors = _validateRecipe(recipe);

    return {
      recipeId,
      validationErrors: errors.length > 0 ? errors : null,
      error: null,
    };
  },
});

export const updateRecipe = mutation({
  args: {
    recipeId: v.id("recipes"),
    title: v.optional(v.string()),
    description: v.optional(v.union(v.string(), v.null())),
    prepTime: v.optional(v.number()),
    cookTime: v.optional(v.number()),
    serves: v.optional(v.number()),
    category: v.optional(categoriesUnion),
    ingredients: v.optional(
      v.array(
        v.object({
          id: v.optional(v.string()),
          name: v.string(),
          amount: v.optional(v.number()),
          unit: v.optional(unitsUnion),
          preparation: v.optional(preparationUnion),
          ingredientId: v.optional(v.id("ingredients")),
        }),
      ),
    ),
    method: v.optional(
      v.array(
        v.object({
          title: v.string(),
          description: v.optional(v.string()),
          image: v.optional(v.id("_storage")),
          ingredientRefs: v.optional(v.array(v.string())),
          ingredientRefsSource: v.optional(
            v.union(v.literal("auto"), v.literal("user")),
          ),
        }),
      ),
    ),
    primaryProtein: v.optional(v.union(primaryProteinUnion, v.null())),
    complexityTier: v.optional(v.union(complexityTierUnion, v.null())),
    cuisine: v.optional(v.array(cuisineUnion)),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe) {
      throw new ConvexError("Recipe not found");
    }
    const isOwner = recipe.userId === user._id;
    const isSuperUser = user.isSuperUser === true;
    if (!isOwner && !isSuperUser) {
      throw new ConvexError(
        "Unauthorised - only the recipe owner or a super user can edit it",
      );
    }

    let ingredients = recipe.ingredients;
    let ingredientsUpdated = false;
    if (args.ingredients?.length) {
      ingredientsUpdated = true;
      const allIngredients = await ctx.db.query("ingredients").collect();
      const usedIds = new Set<string>();
      ingredients = args.ingredients.map((ing) => {
        const ingredientId =
          resolveIngredientIdFromList(allIngredients, ing.name) ?? undefined;
        const trimmed = ing.id?.trim();
        if (trimmed && usedIds.has(trimmed)) {
          throw new ConvexError(
            `Duplicate recipe ingredient id: "${trimmed}". Each ingredient row id must be unique within the recipe.`,
          );
        }
        const id = trimmed ? trimmed : generateRecipeIngredientId(usedIds);
        usedIds.add(id);
        return { ...ing, ingredientId, id };
      });
    }

    let methodToPersist: Doc<"recipes">["method"] | undefined;
    const shouldFinalizeMethod =
      args.method !== undefined ||
      (ingredientsUpdated && (recipe.method?.length ?? 0) > 0);

    if (shouldFinalizeMethod) {
      const inputSteps = args.method ?? recipe.method ?? [];
      const ingList = ingredients ?? [];
      const validRefs = new Set(
        ingList.map((ing) => ing.id).filter((id): id is string => !!id),
      );
      const lines = recipeLinesForMatcher(ingList);
      const canonMap = await buildCanonicalIngredientDocsMap(ctx, ingList);
      methodToPersist = finalizeMethodStepsForSave(
        inputSteps,
        lines,
        canonMap,
        recipe.method,
      );
      for (let i = 0; i < methodToPersist.length; i++) {
        const step = methodToPersist[i];
        const refs = step?.ingredientRefs;
        if (refs?.length) {
          for (const ref of refs) {
            if (!validRefs.has(ref)) {
              throw new ConvexError(
                `Method step ${i + 1}: ingredientRefs must reference recipe ingredient ids on this recipe`,
              );
            }
          }
        }
      }
    }

    // Clean up orphaned method step images when method is updated
    if (args.method && recipe.method) {
      const oldImageIds = new Set(
        recipe.method.map((step) => step.image).filter((img) => !!img),
      );

      const newImageIds = new Set(
        args.method.map((step) => step.image).filter((img) => !!img),
      );

      // Delete images that are no longer referenced
      const imagesToDelete = [...oldImageIds].filter(
        (id) => id && !newImageIds.has(id),
      );

      for (const imageId of imagesToDelete) {
        if (imageId) {
          try {
            await ctx.storage.delete(imageId);
          } catch (e) {
            console.error("Failed to delete orphaned method step image", {
              recipeId: args.recipeId,
              imageId,
              error: e,
            });
          }
        }
      }
    }

    if (
      args.cuisine !== undefined &&
      args.cuisine.length > CUISINE_MAX_SELECTIONS
    ) {
      throw new ConvexError(
        `cuisine must have at most ${CUISINE_MAX_SELECTIONS} items`,
      );
    }

    const prepTime = args.prepTime ?? recipe.prepTime;
    const cookTime = args.cookTime ?? recipe.cookTime;
    // Allow null to clear; undefined means "leave unchanged"
    const primaryProtein =
      args.primaryProtein === undefined
        ? recipe.primaryProtein
        : args.primaryProtein === null
          ? undefined
          : args.primaryProtein;
    const complexityTier =
      args.complexityTier === undefined
        ? recipe.complexityTier
        : args.complexityTier === null
          ? undefined
          : args.complexityTier;
    // System-only: totalTimeMinutes is always derived from prep + cook
    const totalTimeMinutes = prepTime + (cookTime ?? 0);
    const hasGeneratorMetadata =
      primaryProtein != null && complexityTier != null;

    await ctx.db.patch(args.recipeId, {
      title: args.title ?? recipe.title,
      description:
        args.description === undefined
          ? recipe.description
          : args.description === null
            ? undefined
            : args.description,
      prepTime,
      cookTime,
      serves: args.serves ?? recipe.serves,
      category: args.category ?? recipe.category,
      ingredients,
      method: methodToPersist ?? recipe.method,
      updatedAt: Date.now(),
      primaryProtein,
      complexityTier,
      cuisine: args.cuisine ?? recipe.cuisine,
      totalTimeMinutes: totalTimeMinutes > 0 ? totalTimeMinutes : undefined,
      isGeneratorEligible: hasGeneratorMetadata,
    });
  },
});

const _validateRecipe = (recipe: Doc<"recipes">) => {
  const errors: {
    field:
      | "title"
      | "prepTime"
      | "cookTime"
      | "serves"
      | "category"
      | "ingredients"
      | "method";
    message: string;
  }[] = [];

  if (!recipe.title) {
    errors.push({
      field: "title",
      message: "Title is required",
    });
  }

  if (!recipe.prepTime || recipe.prepTime < 1) {
    errors.push({
      field: "prepTime",
      message: "Prep time must be at least 1 minute",
    });
  }

  // cookTime is optional, but if provided must be >= 0
  if (
    recipe.cookTime !== undefined &&
    recipe.cookTime !== null &&
    recipe.cookTime < 0
  ) {
    errors.push({
      field: "cookTime",
      message: "Cook time must be 0 or greater",
    });
  }

  if (!recipe.serves || recipe.serves < 1) {
    errors.push({
      field: "serves",
      message: "Must serve at least 1 person",
    });
  }

  if (!recipe.category) {
    errors.push({
      field: "category",
      message: "Category is required",
    });
  }

  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    errors.push({
      field: "ingredients",
      message: "Must have at least 1 ingredient",
    });
  }

  if (recipe.ingredients) {
    for (let i = 0; i < recipe.ingredients.length; i++) {
      const ing = recipe.ingredients[i];
      if (!ing.name || ing.name.trim() === "") {
        errors.push({
          field: "ingredients",
          message: `Ingredient ${i + 1} must have a name`,
        });
      }
      if (ing.amount !== undefined && ing.amount <= 0) {
        errors.push({
          field: "ingredients",
          message: `Ingredient ${i + 1} must have a positive amount if provided`,
        });
      }
    }
  }

  if (!recipe.method || recipe.method.length === 0) {
    errors.push({
      field: "method",
      message: "Must have at least 1 method step",
    });
  }

  if (recipe.method) {
    for (let i = 0; i < recipe.method.length; i++) {
      const step = recipe.method[i];
      if (!step.title || step.title.trim() === "") {
        errors.push({
          field: "method",
          message: `Method step ${i + 1} must have a title`,
        });
      }
    }
  }

  return errors;
};

export const deleteRecipe = mutation({
  args: {
    recipeId: v.id("recipes"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe) {
      throw new ConvexError("Recipe not found");
    }
    if (recipe.userId !== user._id) {
      throw new ConvexError(
        "Unauthorised - only the recipe owner can delete it",
      );
    }

    // Delete any household shares of this recipe
    const householdShares = await ctx.db
      .query("householdRecipes")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.recipeId))
      .collect();

    for (const share of householdShares) {
      await ctx.db.delete(share._id);
    }

    // Delete the recipe from the database
    await ctx.db.delete(args.recipeId);

    // Delete main recipe image
    if (recipe.image) {
      try {
        await ctx.storage.delete(recipe.image);
      } catch (e) {
        console.warn("Failed to delete recipe image", {
          recipeId: args.recipeId,
          imageId: recipe.image,
          error: e,
        });
      }
    }

    // Delete method step images
    if (recipe.method && recipe.method.length > 0) {
      for (const [index, step] of recipe.method.entries()) {
        if (step.image) {
          try {
            await ctx.storage.delete(step.image);
          } catch (e) {
            console.warn("Failed to delete method step image", {
              recipeId: args.recipeId,
              stepIndex: index,
              imageId: step.image,
              error: e,
            });
          }
        }
      }
    }
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    await getCurrentUserOrThrow(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const updateRecipeImageAndDeleteOld = mutation({
  args: {
    recipeId: v.id("recipes"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe) {
      throw new ConvexError("Recipe not found");
    }
    const isOwner = recipe.userId === user._id;
    const isSuperUser = user.isSuperUser === true;
    if (!isOwner && !isSuperUser) {
      throw new ConvexError(
        "Unauthorised - only the recipe owner or a super user can edit it",
      );
    }

    // Store the old image ID before updating
    const oldImageId = recipe.image;

    // Update recipe with new image
    await ctx.db.patch(args.recipeId, {
      image: args.storageId,
      updatedAt: Date.now(),
    });

    // Best-effort delete of the old image
    if (oldImageId) {
      try {
        await ctx.storage.delete(oldImageId);
      } catch (e) {
        console.warn("Old image delete failed", {
          recipeId: args.recipeId,
          oldImageId,
          e,
        });
      }
    }
  },
});
