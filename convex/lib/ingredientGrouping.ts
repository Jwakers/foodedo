/**
 * Normalisation for shopping list ingredient grouping (fallback when no ingredientId).
 * Used only when computing the aggregation key—not for display or storage.
 */

/**
 * Normalise ingredient name for grouping: trim, lowercase, collapse spaces,
 * replace hyphens with spaces, strip "freshly ground" prefix.
 */
export function normaliseNameForGrouping(name: string): string {
  let s = (name ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, " ")
    .replace(/\s+/g, " ");
  return s.trim() || "";
}
