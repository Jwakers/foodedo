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
