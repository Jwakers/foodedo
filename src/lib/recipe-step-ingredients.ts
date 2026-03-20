/**
 * Derive which recipe ingredient lines are mentioned in a method step (title + description).
 * Used in cook mode; matching uses canonical ingredient docs (aliases, displayName) when available.
 */

export type RecipeIngredientLine = {
  id?: string; // Stable id unique within recipe (recipe.ingredients[].id)
  name: string;
  amount?: number;
  unit?: string;
  preparation?: string;
  ingredientId?: string;
};

/** Subset of Convex ingredients doc fields needed for matching */
export type CanonicalIngredientForMatch = {
  name: string;
  displayName?: string | null;
  aliases?: string[] | null;
};

export type MethodStepForIngredientMatch = {
  title: string;
  description?: string | null;
};

/** Match Convex `normaliseIngredientName` (trim, lowercase, collapse internal spaces). */
export function normaliseIngredientName(name: string): string {
  return (name ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Lowercase, replace non-alphanumeric runs with spaces, collapse spaces.
 * Apply to both step text and phrases so punctuation doesn't break matches.
 */
export function normaliseTextForIngredientMatch(text: string): string {
  return (text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const STOP_WORDS = new Set([
  "the", "and", "or", "with", "for", "in", "a", "an", "of", "to", "as", "at",
  "by", "if", "on", "per", "up", "via",
]);

const MIN_TOKEN_LENGTH = 3;

/**
 * Extract significant single-word tokens from a phrase for partial matching.
 * e.g. "cremini mushrooms" -> ["cremini", "mushrooms"]; "red onion" -> ["red", "onion"].
 * Used so steps like "sliced onion" or "add the mushrooms" still match the ingredient line.
 */
function extractSignificantTokens(phrase: string): string[] {
  const normalised = normaliseTextForIngredientMatch(phrase);
  if (!normalised) return [];
  const tokens = normalised
    .split(/\s+/)
    .filter(
      (w) =>
        w.length >= MIN_TOKEN_LENGTH && !STOP_WORDS.has(w),
    );
  return [...new Set(tokens)];
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type Span = { start: number; end: number };

export type IngredientHighlightSpan = Span;

function spansOverlap(a: Span, b: Span): boolean {
  return !(a.end <= b.start || b.end <= a.start);
}

function overlapsAny(used: Span[], span: Span): boolean {
  return used.some((u) => spansOverlap(u, span));
}

/**
 * First match of `phrase` in `normalisedStep` with non-alphanumeric boundaries,
 * whose phrase span does not overlap any `usedSpans`.
 */
function findFirstNonOverlappingSpan(
  normalisedStep: string,
  phrase: string,
  usedSpans: Span[],
): Span | null {
  const normalisedPhrase = normaliseTextForIngredientMatch(phrase);
  if (!normalisedPhrase) return null;

  const re = new RegExp(
    `(^|[^a-z0-9])${escapeRegex(normalisedPhrase)}([^a-z0-9]|$)`,
    "g",
  );
  let m: RegExpExecArray | null;
  while ((m = re.exec(normalisedStep)) !== null) {
    const boundaryLen = m[1]?.length ?? 0;
    const start = m.index + boundaryLen;
    const end = start + normalisedPhrase.length;
    const span = { start, end };
    if (!overlapsAny(usedSpans, span)) {
      return span;
    }
  }
  return null;
}

/**
 * Maps each character of `normaliseTextForIngredientMatch(text)` to its source range in `text`.
 */
function buildNormCharToOriginalMaps(text: string): {
  norm: string;
  origStart: number[];
  origEndExclusive: number[];
} {
  const lower = text.toLowerCase();
  const tokens: { start: number; end: number }[] = [];
  let i = 0;
  while (i < lower.length) {
    const c = lower[i]!;
    if ((c >= "a" && c <= "z") || (c >= "0" && c <= "9")) {
      const start = i;
      while (i < lower.length) {
        const c2 = lower[i]!;
        if (!((c2 >= "a" && c2 <= "z") || (c2 >= "0" && c2 <= "9"))) break;
        i++;
      }
      tokens.push({ start, end: i });
    } else {
      i++;
    }
  }
  let norm = "";
  const origStart: number[] = [];
  const origEndExclusive: number[] = [];
  for (let t = 0; t < tokens.length; t++) {
    if (t > 0) {
      norm += " ";
      const prev = tokens[t - 1]!;
      const cur = tokens[t]!;
      origStart.push(prev.end);
      origEndExclusive.push(cur.start);
    }
    const tok = tokens[t]!;
    for (let k = tok.start; k < tok.end; k++) {
      norm += lower[k]!;
      origStart.push(k);
      origEndExclusive.push(k + 1);
    }
  }
  return { norm, origStart, origEndExclusive };
}

function mapNormSpanToOriginal(
  origStart: number[],
  origEndExclusive: number[],
  span: Span,
): Span | null {
  if (span.start < 0 || span.end > origStart.length || span.start >= span.end)
    return null;
  return {
    start: origStart[span.start]!,
    end: origEndExclusive[span.end - 1]!,
  };
}

/**
 * Non-overlapping ingredient matches in normalised step text (same rules as cook-mode matching).
 * Keys are indices into `recipeIngredients`.
 */
function findIngredientMatchSpansInNormalisedStep(
  normalisedStep: string,
  recipeIngredients: RecipeIngredientLine[],
  canonMap: Map<string, CanonicalIngredientForMatch>,
): Map<number, Span> {
  const usedSpans: Span[] = [];
  const matched = new Map<number, Span>();

  const allPhrasesByLine = recipeIngredients.map((line) =>
    uniquePhrasesLongestFirst(collectPhrasesForLine(line, canonMap)),
  );
  const tokenOccurrenceCount = new Map<string, number>();
  for (const phrases of allPhrasesByLine) {
    const countedThisLine = new Set<string>();
    for (const p of phrases) {
      const norm = normaliseTextForIngredientMatch(p);
      if (norm && norm.split(/\s+/).length === 1) {
        if (!countedThisLine.has(norm)) {
          countedThisLine.add(norm);
          tokenOccurrenceCount.set(
            norm,
            (tokenOccurrenceCount.get(norm) ?? 0) + 1,
          );
        }
      }
    }
  }
  const ambiguousTokens = new Set(
    [...tokenOccurrenceCount.entries()]
      .filter(([, count]) => count > 1)
      .map(([t]) => t),
  );

  const lineIndicesByMaxPhraseLen = recipeIngredients
    .map((line, idx) => {
      const phrases = uniquePhrasesLongestFirst(
        collectPhrasesForLine(line, canonMap),
      );
      const maxLen = phrases.reduce(
        (m, p) => Math.max(m, normaliseTextForIngredientMatch(p).length),
        0,
      );
      return { i: idx, maxLen };
    })
    .sort((a, b) => b.maxLen - a.maxLen)
    .map((x) => x.i);

  for (const i of lineIndicesByMaxPhraseLen) {
    const line = recipeIngredients[i]!;
    const phrases = uniquePhrasesLongestFirst(
      collectPhrasesForLine(line, canonMap),
    );
    for (const phrase of phrases) {
      const normPhrase = normaliseTextForIngredientMatch(phrase);
      const isSingleToken =
        normPhrase && normPhrase.split(/\s+/).length === 1;
      if (isSingleToken && ambiguousTokens.has(normPhrase)) continue;

      const span = findFirstNonOverlappingSpan(
        normalisedStep,
        phrase,
        usedSpans,
      );
      if (span) {
        usedSpans.push(span);
        matched.set(i, span);
        break;
      }
    }
  }

  return matched;
}

/**
 * Character ranges in `originalText` where matched ingredients appear (for inline highlighting).
 * Spans are non-overlapping, sorted by start. Only searches `originalText` (e.g. step description).
 */
export function getIngredientHighlightSpansInText(
  originalText: string,
  recipeIngredientLines: RecipeIngredientLine[],
  ingredientDocsById: Record<string, CanonicalIngredientForMatch> | undefined,
): IngredientHighlightSpan[] {
  if (!originalText || recipeIngredientLines.length === 0) return [];

  const { norm, origStart, origEndExclusive } =
    buildNormCharToOriginalMaps(originalText);
  const normalisedStep = norm;
  if (!normalisedStep) return [];

  const canonMap = new Map<string, CanonicalIngredientForMatch>();
  if (ingredientDocsById) {
    for (const [k, v] of Object.entries(ingredientDocsById)) {
      if (v) canonMap.set(k, v);
    }
  }

  const byLine = findIngredientMatchSpansInNormalisedStep(
    normalisedStep,
    recipeIngredientLines,
    canonMap,
  );

  const out: IngredientHighlightSpan[] = [];
  for (const span of byLine.values()) {
    const mapped = mapNormSpanToOriginal(origStart, origEndExclusive, span);
    if (mapped && mapped.start < mapped.end) out.push(mapped);
  }
  out.sort((a, b) => a.start - b.start);
  return out;
}

function collectPhrasesForLine(
  line: RecipeIngredientLine,
  canonById: Map<string, CanonicalIngredientForMatch>,
): string[] {
  const out: string[] = [];
  const n = line.name?.trim();
  if (n) out.push(n);

  const id = line.ingredientId;
  if (id && canonById.has(id)) {
    const d = canonById.get(id)!;
    if (d.name?.trim()) out.push(d.name.trim());
    if (d.displayName?.trim()) out.push(d.displayName.trim());
    for (const a of d.aliases ?? []) {
      if (a?.trim()) out.push(a.trim());
    }
  }

  // Add significant single-word tokens so "red onion" matches "sliced onion" and
  // "cremini mushrooms" matches "mushrooms"
  const seenPhrases = new Set(out.map((p) => normaliseTextForIngredientMatch(p)));
  for (const p of out) {
    for (const token of extractSignificantTokens(p)) {
      if (!seenPhrases.has(token)) {
        seenPhrases.add(token);
        out.push(token);
      }
    }
  }
  return out;
}

function uniquePhrasesLongestFirst(phrases: string[]): string[] {
  const seen = new Set<string>();
  const normalisedList: string[] = [];
  for (const p of phrases) {
    const key = normaliseTextForIngredientMatch(p);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    normalisedList.push(p);
  }
  return normalisedList.sort(
    (a, b) =>
      normaliseTextForIngredientMatch(b).length -
      normaliseTextForIngredientMatch(a).length,
  );
}

/**
 * Returns indices into `recipeIngredients` that are mentioned in the step, in **recipe list order**
 * (subset of lines that matched, stable order).
 */
export function getRecipeIngredientIndicesForStep(
  step: MethodStepForIngredientMatch,
  recipeIngredients: RecipeIngredientLine[],
  ingredientDocsById: Record<string, CanonicalIngredientForMatch> | undefined,
): number[] {
  const raw =
    `${step.title ?? ""} ${step.description ?? ""}`.trim();
  const normalisedStep = normaliseTextForIngredientMatch(raw);
  if (!normalisedStep || recipeIngredients.length === 0) return [];

  const canonMap = new Map<string, CanonicalIngredientForMatch>();
  if (ingredientDocsById) {
    for (const [k, v] of Object.entries(ingredientDocsById)) {
      if (v) canonMap.set(k, v);
    }
  }

  const matchedSpans = findIngredientMatchSpansInNormalisedStep(
    normalisedStep,
    recipeIngredients,
    canonMap,
  );

  return recipeIngredients
    .map((_, i) => i)
    .filter((i) => matchedSpans.has(i));
}

export function getRecipeIngredientsForStep(
  step: MethodStepForIngredientMatch,
  recipeIngredients: RecipeIngredientLine[],
  ingredientDocsById: Record<string, CanonicalIngredientForMatch> | undefined,
): RecipeIngredientLine[] {
  const indices = getRecipeIngredientIndicesForStep(
    step,
    recipeIngredients,
    ingredientDocsById,
  );
  return indices.map((i) => recipeIngredients[i]!);
}

/**
 * Suggested canonical ingredient IDs for a step (from the matching algorithm).
 * Only includes IDs for recipe lines that have ingredientId set.
 * Use in the editor to pre-fill "suggested" ingredients for a step.
 */
export function getSuggestedIngredientIdsForStep(
  step: MethodStepForIngredientMatch,
  recipeIngredients: RecipeIngredientLine[],
  ingredientDocsById: Record<string, CanonicalIngredientForMatch> | undefined,
): string[] {
  const matched = getRecipeIngredientsForStep(
    step,
    recipeIngredients,
    ingredientDocsById,
  );
  const ids = new Set<string>();
  for (const line of matched) {
    if (line.ingredientId) ids.add(line.ingredientId);
  }
  return [...ids];
}

/**
 * Suggested ingredient names for a step (from the matching algorithm).
 * Unique by normalised name; preserves first-seen order. Use for editor chips.
 */
export function getSuggestedIngredientNamesForStep(
  step: MethodStepForIngredientMatch,
  recipeIngredients: RecipeIngredientLine[],
  ingredientDocsById: Record<string, CanonicalIngredientForMatch> | undefined,
): string[] {
  const matched = getRecipeIngredientsForStep(
    step,
    recipeIngredients,
    ingredientDocsById,
  );
  const seenNorm = new Set<string>();
  const out: string[] = [];
  for (const line of matched) {
    const raw = line.name?.trim();
    if (!raw) continue;
    const key = normaliseIngredientName(raw);
    if (seenNorm.has(key)) continue;
    seenNorm.add(key);
    out.push(raw);
  }
  return out;
}

/**
 * Suggested recipe-ingredient row ids for a step (from the matching algorithm).
 * Only includes ids for lines that have id set. Use for editor step-ingredient refs.
 */
export function getSuggestedIngredientRefsForStep(
  step: MethodStepForIngredientMatch,
  recipeIngredients: RecipeIngredientLine[],
  ingredientDocsById: Record<string, CanonicalIngredientForMatch> | undefined,
): string[] {
  const indices = getRecipeIngredientIndicesForStep(
    step,
    recipeIngredients,
    ingredientDocsById,
  );
  const out: string[] = [];
  const seen = new Set<string>();
  for (const i of indices) {
    const line = recipeIngredients[i];
    if (!line?.id || seen.has(line.id)) continue;
    seen.add(line.id);
    out.push(line.id);
  }
  return out;
}
