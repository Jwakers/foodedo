import type { Doc, Id } from "../_generated/dataModel";
import { normaliseIngredientName } from "../ingredients";

type RecipeIngredientLine = {
  ingredientId?: Id<"ingredients">;
  name: string;
};

/** Normalise a user-entered leftover phrase for storage and matching keys. */
export function normaliseLeftoverPhraseForStorage(phrase: string): string {
  return normaliseIngredientName(phrase);
}

/** Dedupe, drop empties, sort for stable keys. */
export function normaliseLeftoverPhrasesList(raw: string[] | undefined): string[] {
  if (!raw?.length) return [];
  const out = new Set<string>();
  for (const s of raw) {
    const n = normaliseLeftoverPhraseForStorage(s);
    if (n) out.add(n);
  }
  return [...out].sort((a, b) => a.localeCompare(b));
}

export function idTargetKey(id: Id<"ingredients">): string {
  return `id:${id as string}`;
}

export function phraseTargetKey(normalisedPhrase: string): string {
  return `phr:${normalisedPhrase}`;
}

/**
 * Fuzzy match of a recipe line label against a user phrase (non-catalog).
 * Uses equality, substring (min length 4), or all significant tokens (length ≥ 3) as substrings.
 */
export function lineMatchesLeftoverPhrase(
  lineName: string,
  phrase: string,
): boolean {
  const p = normaliseIngredientName(phrase);
  return lineMatchesNormalisedPhrase(lineName, p);
}

/** Match a phrase token to ingredient line text (handles minced/mince, etc.). */
export function phraseTokenMatchesInLine(line: string, token: string): boolean {
  if (!token || !line) return false;
  if (line.includes(token)) return true;
  // "minced" vs "beef mince", "diced" vs "diced" already hit includes
  if (token.length >= 5 && token.endsWith("ed")) {
    const withoutEd = token.slice(0, -2);
    if (withoutEd.length >= 3 && line.includes(withoutEd)) return true;
  }
  return false;
}

function lineMatchesNormalisedPhrase(
  lineName: string,
  normalisedPhrase: string,
): boolean {
  const line = normaliseIngredientName(lineName);
  const p = normalisedPhrase;
  if (!p || !line) return false;
  if (p === line) return true;

  const MIN_SUB = 4;
  if (p.length >= MIN_SUB && line.includes(p)) return true;
  if (
    line.length >= MIN_SUB &&
    p.length >= MIN_SUB &&
    p.includes(line)
  ) {
    return true;
  }

  const tokens = p.split(/\s+/).filter((t) => t.length >= 3);
  if (tokens.length === 0) {
    return p.length < 3 ? p === line : false;
  }
  return tokens.every((t) => phraseTokenMatchesInLine(line, t));
}

/**
 * Which target ingredients appear in this recipe (distinct ids, sorted).
 * Primary: ingredientId on a line is in the target set.
 * Fallback: line has no ingredientId but normalised line name matches a target doc’s name, displayName, or alias.
 */
export function collectLeftoverMatchIds(
  ingredients: RecipeIngredientLine[] | undefined,
  targetIds: Id<"ingredients">[],
  targetDocs: Doc<"ingredients">[],
): Id<"ingredients">[] {
  if (!targetIds.length) return [];
  const targetSet = new Set<string>(targetIds.map((id) => id as string));
  const matched = new Set<string>();

  const tryMatchDoc = (normalisedLine: string) => {
    for (const doc of targetDocs) {
      const id = doc._id as string;
      if (matched.has(id)) continue;
      if (normaliseIngredientName(doc.name) === normalisedLine) {
        matched.add(id);
        return;
      }
      if (
        doc.displayName &&
        normaliseIngredientName(doc.displayName) === normalisedLine
      ) {
        matched.add(id);
        return;
      }
      if (
        doc.aliases?.some(
          (a) => a && normaliseIngredientName(a) === normalisedLine,
        )
      ) {
        matched.add(id);
        return;
      }
    }
  };

  for (const line of ingredients ?? []) {
    if (line.ingredientId && targetSet.has(line.ingredientId as string)) {
      matched.add(line.ingredientId as string);
      continue;
    }
    const n = normaliseIngredientName(line.name);
    if (!n) continue;
    tryMatchDoc(n);
  }

  return (Array.from(matched) as Id<"ingredients">[]).sort((a, b) =>
    (a as string).localeCompare(b as string),
  );
}

/**
 * Distinct leftover targets matched by this recipe: canonical ids (`id:…`) and
 * free-text phrases (`phr:…`), sorted.
 */
export function collectLeftoverMatchKeys(
  ingredients: RecipeIngredientLine[] | undefined,
  targetIds: Id<"ingredients">[],
  targetDocs: Doc<"ingredients">[],
  normalisedPhrases: string[],
): string[] {
  const keys = new Set<string>();
  if (targetIds.length > 0) {
    for (const id of collectLeftoverMatchIds(
      ingredients,
      targetIds,
      targetDocs,
    )) {
      keys.add(idTargetKey(id));
    }
  }
  const phraseSet = normaliseLeftoverPhrasesList(normalisedPhrases);
  for (const phrase of phraseSet) {
    for (const line of ingredients ?? []) {
      if (lineMatchesNormalisedPhrase(line.name, phrase)) {
        keys.add(phraseTargetKey(phrase));
        break;
      }
    }
  }
  return Array.from(keys).sort((a, b) => a.localeCompare(b));
}

/**
 * How many distinct target ingredients appear in this recipe (0 … targetIds.length).
 */
export function countRecipeLeftoverMatches(
  ingredients: RecipeIngredientLine[] | undefined,
  targetIds: Id<"ingredients">[],
  targetDocs: Doc<"ingredients">[],
): number {
  return collectLeftoverMatchIds(ingredients, targetIds, targetDocs).length;
}

/** Distinct matched targets when using both canonical ids and free-text phrases. */
export function countRecipeLeftoverTargetMatches(
  ingredients: RecipeIngredientLine[] | undefined,
  targetIds: Id<"ingredients">[],
  targetDocs: Doc<"ingredients">[],
  normalisedPhrases: string[],
): number {
  return collectLeftoverMatchKeys(
    ingredients,
    targetIds,
    targetDocs,
    normalisedPhrases,
  ).length;
}

/**
 * Multiplier applied to meal-plan generator weight when boosting leftover matches.
 * Full match → strongest boost; partial → intermediate; none → 1.
 */
export function leftoverWeightMultiplier(
  matchCount: number,
  targetCount: number,
): number {
  if (targetCount <= 0) return 1;
  if (matchCount <= 0) return 1;
  const ratio = matchCount / targetCount;
  // Smooth curve: 1 + up to ~4.5x extra weight at full match
  return 1 + 4.5 * ratio * ratio;
}
