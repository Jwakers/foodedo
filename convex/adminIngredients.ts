import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { normaliseIngredientName } from "./ingredients";
import { getCurrentUser } from "./users";
import { INGREDIENT_FOOD_GROUPS } from "./lib/ingredientFoodGroups";
import { INGREDIENT_FOOD_SUB_GROUPS } from "./lib/ingredientFoodSubGroups";

/** Throws if the current user is not a super user. Use in admin queries/mutations. */
async function requireSuperUser(ctx: QueryCtx) {
  const user = await getCurrentUser(ctx);
  if (!user?.isSuperUser) {
    throw new ConvexError("Super user access required");
  }
  return user;
}

export const listForAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperUser(ctx);
    return await ctx.db.query("ingredients").collect();
  },
});

export const getBrokenOrUnlinkedIngredientReferences = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperUser(ctx);

    const allIngredientIds = new Set<Id<"ingredients">>();
    const recipes = await ctx.db.query("recipes").collect();
    for (const recipe of recipes) {
      for (const ing of recipe.ingredients ?? []) {
        if (ing.ingredientId) {
          allIngredientIds.add(ing.ingredientId);
        }
      }
    }
    const shoppingListItems = await ctx.db.query("shoppingListItems").collect();
    for (const item of shoppingListItems) {
      if (item.ingredientId) {
        allIngredientIds.add(item.ingredientId);
      }
    }

    const existingIngredients = new Set<string>();
    for (const id of allIngredientIds) {
      const doc = await ctx.db.get(id);
      if (doc) {
        existingIngredients.add(id);
      }
    }

    type RecipeRef = {
      type: "recipe";
      recipeId: Id<"recipes">;
      recipeTitle: string;
      ingredientIndex: number;
      lineName: string;
      ingredientId: Id<"ingredients"> | null;
      status: "unlinked" | "broken";
    };
    type ShoppingRef = {
      type: "shopping_list_item";
      itemId: Id<"shoppingListItems">;
      shoppingListId: Id<"shoppingLists">;
      lineName: string;
      ingredientId: Id<"ingredients"> | null;
      status: "unlinked" | "broken";
    };

    const recipeRefs: RecipeRef[] = [];
    const shoppingRefs: ShoppingRef[] = [];

    for (const recipe of recipes) {
      const ingredients = recipe.ingredients ?? [];
      ingredients.forEach((ing, index) => {
        const id = ing.ingredientId ?? null;
        if (!id) {
          recipeRefs.push({
            type: "recipe",
            recipeId: recipe._id,
            recipeTitle: recipe.title ?? "",
            ingredientIndex: index,
            lineName: ing.name ?? "",
            ingredientId: null,
            status: "unlinked",
          });
          return;
        }
        if (!existingIngredients.has(id)) {
          recipeRefs.push({
            type: "recipe",
            recipeId: recipe._id,
            recipeTitle: recipe.title ?? "",
            ingredientIndex: index,
            lineName: ing.name ?? "",
            ingredientId: id,
            status: "broken",
          });
        }
      });
    }

    for (const item of shoppingListItems) {
      const id = item.ingredientId ?? null;
      if (!id) {
        shoppingRefs.push({
          type: "shopping_list_item",
          itemId: item._id,
          shoppingListId: item.shoppingListId,
          lineName: item.name,
          ingredientId: null,
          status: "unlinked",
        });
        continue;
      }
      if (!existingIngredients.has(id)) {
        shoppingRefs.push({
          type: "shopping_list_item",
          itemId: item._id,
          shoppingListId: item.shoppingListId,
          lineName: item.name,
          ingredientId: id,
          status: "broken",
        });
      }
    }

    return { recipeRefs, shoppingRefs };
  },
});

function normalizeToSchemaFoodGroup(
  value: string | undefined
): Doc<"ingredients">["foodGroup"] | undefined {
  if (!value?.trim()) return undefined;
  const found = (INGREDIENT_FOOD_GROUPS as readonly string[]).find(
    (g) => g.toLowerCase() === value.trim().toLowerCase()
  );
  return found as Doc<"ingredients">["foodGroup"] | undefined;
}

function normalizeToSchemaFoodSubGroup(
  value: string | undefined
): Doc<"ingredients">["foodSubGroup"] | undefined {
  if (!value?.trim()) return undefined;
  const found = (INGREDIENT_FOOD_SUB_GROUPS as readonly string[]).find(
    (g) => g.toLowerCase() === value.trim().toLowerCase()
  );
  return found as Doc<"ingredients">["foodSubGroup"] | undefined;
}

const adminIngredientCreateArgs = {
  name: v.string(),
  displayName: v.optional(v.string()),
  foodGroup: v.optional(v.string()),
  foodSubGroup: v.optional(v.string()),
  externalId: v.optional(v.string()),
  aliases: v.optional(v.array(v.string())),
};

export const create = mutation({
  args: adminIngredientCreateArgs,
  handler: async (ctx, args) => {
    await requireSuperUser(ctx);
    const name = args.name.trim();
    if (!name) {
      throw new ConvexError("name is required");
    }
    const foodGroup = normalizeToSchemaFoodGroup(args.foodGroup);
    const foodSubGroup = normalizeToSchemaFoodSubGroup(args.foodSubGroup);
    if (args.foodGroup && !foodGroup) {
      throw new ConvexError(
        `Invalid foodGroup. Must be one of: ${INGREDIENT_FOOD_GROUPS.join(", ")}`
      );
    }
    if (args.foodSubGroup && !foodSubGroup) {
      throw new ConvexError(
        `Invalid foodSubGroup. Must be one of: ${INGREDIENT_FOOD_SUB_GROUPS.slice(0, 5).join(", ")}...`
      );
    }
    const existingIngredients = await ctx.db.query("ingredients").collect();
    const reservedNormalised = new Set<string>();
    for (const ing of existingIngredients) {
      reservedNormalised.add(normaliseIngredientName(ing.name));
      if (ing.displayName?.trim()) {
        reservedNormalised.add(normaliseIngredientName(ing.displayName));
      }
    }
    const normalisedName = normaliseIngredientName(name);
    if (reservedNormalised.has(normalisedName)) {
      throw new ConvexError("An ingredient with this name already exists.");
    }
    const displayNameTrimmed = args.displayName?.trim();
    if (displayNameTrimmed) {
      const normalisedDisplayName = normaliseIngredientName(displayNameTrimmed);
      if (reservedNormalised.has(normalisedDisplayName)) {
        throw new ConvexError("An ingredient with this display name already exists.");
      }
    }
    await ctx.db.insert("ingredients", {
      name,
      displayName: args.displayName?.trim() || undefined,
      foodGroup,
      foodSubGroup,
      externalId: args.externalId?.trim() || undefined,
      aliases: args.aliases?.length ? args.aliases.map((a) => a.trim()).filter(Boolean) : undefined,
    });
    await ctx.scheduler.runAfter(0, internal.migrations.reconcileIngredientReferences, {});
  },
});

const adminIngredientUpdateArgs = {
  id: v.id("ingredients"),
  name: v.optional(v.string()),
  displayName: v.optional(v.union(v.string(), v.null())),
  foodGroup: v.optional(v.union(v.string(), v.null())),
  foodSubGroup: v.optional(v.union(v.string(), v.null())),
  externalId: v.optional(v.union(v.string(), v.null())),
  aliases: v.optional(v.array(v.string())),
};

export const update = mutation({
  args: adminIngredientUpdateArgs,
  handler: async (ctx, args) => {
    await requireSuperUser(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new ConvexError("Ingredient not found");
    }
    const patch: Partial<Doc<"ingredients">> = {};
    if (args.name !== undefined) {
      const name = args.name.trim();
      if (!name) throw new ConvexError("name cannot be empty");
      patch.name = name;
    }
    if (args.displayName !== undefined) {
      patch.displayName = args.displayName?.trim() || undefined;
    }
    if (args.foodGroup !== undefined) {
      if (args.foodGroup === null || args.foodGroup === "") {
        patch.foodGroup = undefined;
      } else {
        const foodGroup = normalizeToSchemaFoodGroup(args.foodGroup);
        if (!foodGroup) {
          throw new ConvexError(
            `Invalid foodGroup. Must be one of: ${INGREDIENT_FOOD_GROUPS.join(", ")}`
          );
        }
        patch.foodGroup = foodGroup;
      }
    }
    if (args.foodSubGroup !== undefined) {
      if (args.foodSubGroup === null || args.foodSubGroup === "") {
        patch.foodSubGroup = undefined;
      } else {
        const foodSubGroup = normalizeToSchemaFoodSubGroup(args.foodSubGroup);
        if (!foodSubGroup) {
          throw new ConvexError("Invalid foodSubGroup");
        }
        patch.foodSubGroup = foodSubGroup;
      }
    }
    if (args.externalId !== undefined) {
      patch.externalId = args.externalId?.trim() || undefined;
    }
    if (args.aliases !== undefined) {
      patch.aliases = args.aliases?.length
        ? args.aliases.map((a) => a.trim()).filter(Boolean)
        : undefined;
    }
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(args.id, patch);
      await ctx.scheduler.runAfter(0, internal.migrations.reconcileIngredientReferences, {});
    }
  },
});

export const remove = mutation({
  args: { id: v.id("ingredients") },
  handler: async (ctx, args) => {
    await requireSuperUser(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc) {
      throw new ConvexError("Ingredient not found");
    }
    const id = args.id;

    const recipes = await ctx.db.query("recipes").collect();
    for (const recipe of recipes) {
      if (!recipe.ingredients?.length) continue;
      const updated = recipe.ingredients.map((ing) =>
        ing.ingredientId === id ? { ...ing, ingredientId: undefined } : ing
      );
      if (updated.some((ing, i) => (recipe.ingredients![i]?.ingredientId ?? null) !== (ing.ingredientId ?? null))) {
        await ctx.db.patch(recipe._id, { ingredients: updated });
      }
    }

    const shoppingListItems = await ctx.db.query("shoppingListItems").collect();
    for (const item of shoppingListItems) {
      if (item.ingredientId === id) {
        await ctx.db.patch(item._id, { ingredientId: undefined });
      }
    }

    await ctx.db.delete(args.id);
    await ctx.scheduler.runAfter(0, internal.migrations.reconcileIngredientReferences, {});
  },
});

export const addAlias = mutation({
  args: {
    ingredientId: v.id("ingredients"),
    alias: v.string(),
  },
  handler: async (ctx, args) => {
    await requireSuperUser(ctx);
    const doc = await ctx.db.get(args.ingredientId);
    if (!doc) {
      throw new ConvexError("Ingredient not found");
    }
    const trimmed = args.alias.trim();
    if (!trimmed) {
      throw new ConvexError("Alias cannot be empty");
    }
    const normalised = normaliseIngredientName(trimmed);
    const existing = [
      doc.name,
      doc.displayName,
      ...(doc.aliases ?? []),
    ].filter(Boolean) as string[];
    const existingNormalised = new Set(
      existing.map((s) => normaliseIngredientName(s))
    );
    if (existingNormalised.has(normalised)) {
      return; // Already present (name, displayName, or alias)
    }
    const nextAliases = [...(doc.aliases ?? []), trimmed];
    await ctx.db.patch(args.ingredientId, { aliases: nextAliases });
    await ctx.scheduler.runAfter(0, internal.migrations.reconcileIngredientReferences, {});
  },
});
