import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { canAccessRecipe } from "./households";
import {
  categoriesUnion,
  creationSourceUnion,
  preparationUnion,
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
};

async function resolveMethodImageUrls(
  ctx: QueryCtx,
  method: MethodStepWithImage[] = [],
): Promise<
  (MethodStepWithImage & { imageUrl?: string | null })[]
> {
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

    const image = recipe.image
      ? await ctx.storage.getUrl(recipe.image)
      : null;

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
 * Get recipe data for editing (includes storage IDs, not just URLs)
 * This is used when initializing the edit form
 */
export const getRecipeForEdit = query({
  args: {
    recipeId: v.id("recipes"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new ConvexError("User not found");
    const recipe = await ctx.db.get(args.recipeId);

    if (!recipe) return null;

    // Check if user can access this recipe
    const { canAccess, isOwner } = await canAccessRecipe(
      ctx,
      user._id,
      args.recipeId,
    );
    if (!canAccess || !isOwner) return null; // Only owner can edit

    // Return recipe with storage IDs (not URLs) for form initialization
    // Include all fields required by RecipeEditFormData schema
    return {
      title: recipe.title || "",
      description: recipe.description || "",
      prepTime: recipe.prepTime ?? 0,
      cookTime: recipe.cookTime ?? undefined,
      serves: recipe.serves ?? 1,
      category: recipe.category,
      ingredients: recipe.ingredients || [],
      method: recipe.method || [],
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

    return Promise.all(
      recipes.map(async (r) => ({
        ...r,
        image: r.image ? await ctx.storage.getUrl(r.image) : null,
      })),
    );
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
    // Map ingredients to database ingredients if possible
    if (ingredients?.length) {
      const allIngredients = await ctx.db.query("ingredients").collect();
      const ingredientMap = new Map(
        allIngredients.map((ing) => [ing.name.trim().toLowerCase(), ing._id]),
      );

      ingredients = ingredients.map((ing) => {
        const ingredientId = ingredientMap.get(ing.name.trim().toLowerCase());

        return {
          ...ing,
          ingredientId,
        };
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

    const recipeId = await ctx.db.insert("recipes", {
      userId: user._id,
      title: args.title,
      description: args.description,
      prepTime: args.prepTime,
      cookTime: args.cookTime,
      serves: args.serves,
      category: args.category,
      ingredients,
      method: args.method,
      creationSource: args.creationSource,
      nutrition: args.nutrition,
      originalUrl: args.originalUrl,
      originalAuthor: args.originalAuthor,
      importedAt: args.originalUrl ? now : undefined,
      originalPublishedDate,
      updatedAt: now,
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
    description: v.optional(v.string()),
    prepTime: v.optional(v.number()),
    cookTime: v.optional(v.number()),
    serves: v.optional(v.number()),
    category: v.optional(categoriesUnion),
    ingredients: v.optional(
      v.array(
        v.object({
          name: v.string(),
          amount: v.optional(v.number()),
          unit: v.optional(unitsUnion),
          preparation: v.optional(preparationUnion),
        }),
      ),
    ),
    method: v.optional(
      v.array(
        v.object({
          title: v.string(),
          description: v.optional(v.string()),
          image: v.optional(v.id("_storage")),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe) {
      throw new ConvexError("Recipe not found");
    }
    if (recipe.userId !== user._id) {
      throw new ConvexError("Unauthorised - only the recipe owner can edit it");
    }

    let ingredients = recipe.ingredients;
    // Map ingredients to database ingredients if possible
    if (args.ingredients?.length) {
      const allIngredients = await ctx.db.query("ingredients").collect();
      const ingredientMap = new Map(
        allIngredients.map((ing) => [ing.name.trim().toLowerCase(), ing._id]),
      );

      ingredients = await Promise.all(
        args.ingredients.map((ing) => {
          const ingredientId = ingredientMap.get(ing.name.trim().toLowerCase());

          return {
            ...ing,
            ingredientId,
            amount: ing.amount ?? 0,
          };
        }),
      );
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

    await ctx.db.patch(args.recipeId, {
      title: args.title ?? recipe.title,
      description: args.description ?? recipe.description,
      prepTime: args.prepTime ?? recipe.prepTime,
      cookTime: args.cookTime ?? recipe.cookTime,
      serves: args.serves ?? recipe.serves,
      category: args.category ?? recipe.category,
      ingredients,
      method: args.method ?? recipe.method,
      updatedAt: Date.now(),
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
    if (recipe.userId !== user._id) {
      throw new ConvexError("Unauthorised");
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
