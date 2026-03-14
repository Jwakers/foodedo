import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { query } from "./_generated/server";
import { v } from "convex/values";

/** Normalise ingredient name for lookup: lowercase, trim, collapse spaces */
export function normaliseIngredientName(name: string): string {
  return (name ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Resolve a free-text name to a canonical ingredient id using a pre-fetched list.
 * Matches by normalised name first, then by any alias. No DB calls.
 * Use this when you already have all ingredients (e.g. in recipe create/update).
 */
export function resolveIngredientIdFromList(
  ingredients: Doc<"ingredients">[],
  name: string
): Id<"ingredients"> | null {
  const normalised = normaliseIngredientName(name);
  if (!normalised) return null;

  const byName = ingredients.find(
    (ing) => normaliseIngredientName(ing.name) === normalised
  );
  if (byName) return byName._id;

  const byAlias = ingredients.find((ing) =>
    ing.aliases?.some((a) => normaliseIngredientName(a ?? "") === normalised)
  );
  return byAlias?._id ?? null;
}

/**
 * Resolve a free-text ingredient name to a canonical ingredient id (one DB query).
 * Use for single lookups (e.g. the resolveByName query). For batch matching,
 * fetch ingredients once and use resolveIngredientIdFromList instead.
 */
export async function resolveIngredientIdByName(
  ctx: { db: QueryCtx["db"] },
  name: string
): Promise<Id<"ingredients"> | null> {
  const all = await ctx.db.query("ingredients").collect();
  return resolveIngredientIdFromList(all, name);
}

/**
 * Resolve a free-text ingredient name to the canonical ingredient document, if any.
 * For use in the UI (e.g. autocomplete, showing "matched to: Garlic") or from other functions.
 */
export const resolveByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const id = await resolveIngredientIdByName(ctx, args.name);
    if (!id) return null;
    return await ctx.db.get(id);
  },
});

/**
 * Fetch ingredients by IDs (e.g. for shopping list display names).
 * Returns a map keyed by id for easy lookup; missing ids are omitted.
 */
export const getByIds = query({
  args: { ids: v.array(v.id("ingredients")) },
  handler: async (ctx, args) => {
    const uniq = [...new Set(args.ids)];
    const docs = await Promise.all(uniq.map((id) => ctx.db.get(id)));
    const result: Record<string, Doc<"ingredients">> = {};
    docs.forEach((doc) => {
      if (doc) result[doc._id] = doc;
    });
    return result;
  },
});

/**
 * Get the distinct foodGroup values currently present on ingredients.
 * Useful for maintaining a schema union and UI category mapping.
 */
export const getDistinctFoodGroups = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("ingredients").collect();
    const set = new Set<string>();
    for (const ing of all) {
      const v = ing.foodGroup?.trim();
      if (v) set.add(v);
    }
    return [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  },
});

/**
 * Get the distinct foodSubGroup values currently present on ingredients.
 * Useful for maintaining a schema union and UI subcategory mapping.
 */
export const getDistinctFoodSubGroups = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("ingredients").collect();
    const set = new Set<string>();
    for (const ing of all) {
      const v = ing.foodSubGroup?.trim();
      if (v) set.add(v);
    }
    return [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  },
});
