/**
 * Strict kebab-case slugs for public discover URLs (aligned with blog slug rules).
 */

import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

export const RECIPE_PUBLIC_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function titleToRecipePublicSlugBase(title: string): string {
  const s = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return s.length > 0 ? s : "recipe";
}

export function normaliseRecipePublicSlugInput(raw: string): string {
  return titleToRecipePublicSlugBase(raw);
}

export type PublicSlugAllocationItem = {
  id: string;
  title: string;
  seedSlug?: string | undefined;
  existingSlug?: string | null | undefined;
};

/**
 * Deterministic unique slugs: seed override > existing DB slug > title-derived base; collisions get `-2`, `-3`, …
 */
export function allocateUniquePublicSlugs(
  items: PublicSlugAllocationItem[],
): Map<string, string> {
  const used = new Set<string>();
  const out = new Map<string, string>();

  for (const item of items) {
    let base: string;
    if (item.seedSlug != null && item.seedSlug.trim() !== "") {
      base = normaliseRecipePublicSlugInput(item.seedSlug);
    } else if (item.existingSlug != null && item.existingSlug.trim() !== "") {
      base = normaliseRecipePublicSlugInput(item.existingSlug);
    } else {
      base = titleToRecipePublicSlugBase(item.title);
    }

    if (!RECIPE_PUBLIC_SLUG_PATTERN.test(base)) {
      base = "recipe";
    }

    let candidate = base;
    let n = 2;
    while (used.has(candidate)) {
      candidate = `${base}-${n}`;
      n += 1;
    }
    used.add(candidate);
    out.set(item.id, candidate);
  }

  return out;
}

/**
 * Allocates a `publicSlug` that does not collide with any other system recipe.
 * Used when inserting a new system recipe; optional `seedSlug` matches seed-file `publicSlug`.
 */
export async function nextUniqueSystemRecipePublicSlug(
  ctx: QueryCtx,
  input: {
    title: string;
    seedSlug?: string | undefined;
    /** When re-slugging an existing doc, ignore its current slug so the base can be reused */
    ignoreSlugOfRecipeId?: Id<"recipes">;
  },
): Promise<string> {
  const system = await ctx.db
    .query("recipes")
    .withIndex("by_source", (q) => q.eq("source", "system"))
    .collect();

  const used = new Set<string>();
  for (const r of system) {
    if (!r.publicSlug) continue;
    if (input.ignoreSlugOfRecipeId != null && r._id === input.ignoreSlugOfRecipeId) {
      continue;
    }
    used.add(r.publicSlug);
  }

  let base: string;
  if (input.seedSlug != null && input.seedSlug.trim() !== "") {
    base = normaliseRecipePublicSlugInput(input.seedSlug);
  } else {
    base = titleToRecipePublicSlugBase(input.title);
  }

  if (!RECIPE_PUBLIC_SLUG_PATTERN.test(base)) {
    base = "recipe";
  }

  let candidate = base;
  let n = 2;
  while (used.has(candidate)) {
    candidate = `${base}-${n}`;
    n += 1;
  }
  return candidate;
}
