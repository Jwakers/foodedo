type NumericAmount = number | string | null | undefined;

type ScaleOptions = {
  ingredientName?: string;
  unit?: string;
};

const COUNT_LIKE_UNITS = new Set([
  "clove",
  "cloves",
  "stalk",
  "stalks",
  "shallot",
  "shallots",
  "onion",
  "onions",
  "piece",
  "pieces",
  "sprig",
  "sprigs",
  "leaf",
  "leaves",
]);

const COUNT_LIKE_INGREDIENT_HINTS = [
  "clove",
  "garlic",
  "stalk",
  "lemongrass",
  "shallot",
  "onion",
  "spring onion",
  "scallion",
  "chilli",
  "chili",
  "pepper",
];
const MIN_NON_ZERO_SCALED_AMOUNT = 0.25;

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function isCountLikeIngredientName(name: string | undefined): boolean {
  if (!name) return false;
  const normalised = name.trim().toLowerCase();
  if (!normalised) return false;
  return COUNT_LIKE_INGREDIENT_HINTS.some((hint) => normalised.includes(hint));
}

function isCountLikeUnit(unit: string | undefined): boolean {
  if (!unit) return false;
  return COUNT_LIKE_UNITS.has(unit.trim().toLowerCase());
}

function isCountLike(opts: ScaleOptions): boolean {
  return isCountLikeUnit(opts.unit) || isCountLikeIngredientName(opts.ingredientName);
}

export function normalizeScaledAmount(value: number, opts: ScaleOptions = {}): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;

  if (isCountLike(opts) && value < 0.5) {
    // Avoid confusing tiny decimal counts like 0.167 stalks.
    return 0.25;
  }

  const rounded = roundToStep(value, 0.5);
  // Never collapse a positive scaled amount to zero.
  return rounded <= 0 ? MIN_NON_ZERO_SCALED_AMOUNT : rounded;
}

export function scaleNumericAmountForServings(
  amount: number,
  factor: number,
  opts: ScaleOptions = {},
): number | null {
  if (!Number.isFinite(amount)) return null;
  if (!Number.isFinite(factor) || factor <= 0) return null;
  if (factor === 1) return amount;
  return normalizeScaledAmount(amount * factor, opts);
}

export function scaleAmountForServings(
  rawAmount: NumericAmount,
  factor: number,
  opts: ScaleOptions = {},
): number | string | null {
  if (rawAmount === undefined || rawAmount === null) return null;

  if (typeof rawAmount === "number") {
    return scaleNumericAmountForServings(rawAmount, factor, opts);
  }

  const trimmed = String(rawAmount).trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return trimmed;
  return scaleNumericAmountForServings(parsed, factor, opts);
}
