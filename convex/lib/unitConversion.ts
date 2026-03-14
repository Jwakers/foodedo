/**
 * Unit conversion for shopping list aggregation.
 * Normalise policy: weight in grams (g), volume in millilitres (ml).
 * Per-item/count units: combine only when same unit; otherwise concatenate amounts.
 */

export type UnitCategory = "weight" | "volume" | "count" | "items";

const WEIGHT_TO_G: Record<string, number> = {
  g: 1,
  kg: 1000,
  mg: 0.001,
  oz: 28.3495,
  lbs: 453.592,
};

const VOLUME_TO_ML: Record<string, number> = {
  ml: 1,
  l: 1000,
  "fl oz": 29.5735,
  cups: 236.588,
  tbsp: 14.787,
  tsp: 4.929,
  gal: 3785.41,
  pt: 473.176,
  qt: 946.353,
};

const WEIGHT_UNITS = new Set(Object.keys(WEIGHT_TO_G));
const VOLUME_UNITS = new Set(Object.keys(VOLUME_TO_ML));

export function getUnitCategory(unit: string | undefined): UnitCategory {
  const u = (unit ?? "").trim().toLowerCase();
  if (!u) return "items";
  if (WEIGHT_UNITS.has(u)) return "weight";
  if (VOLUME_UNITS.has(u)) return "volume";
  if (u === "pinch" || u === "dash" || u === "handful" || u === "drop")
    return "count";
  return "items";
}

/** Convert amount to base unit (g for weight, ml for volume). Returns null if unit not convertible. */
export function toBaseAmount(
  amount: number,
  unit: string | undefined
): { amount: number; category: "weight" | "volume" } | null {
  const u = (unit ?? "").trim().toLowerCase();
  if (WEIGHT_TO_G[u] != null) {
    return { amount: amount * WEIGHT_TO_G[u], category: "weight" };
  }
  if (VOLUME_TO_ML[u] != null) {
    return { amount: amount * VOLUME_TO_ML[u], category: "volume" };
  }
  return null;
}

/** Convert from base amount to normal display unit (g or ml). */
export function fromBaseAmount(
  amount: number,
  category: "weight" | "volume"
): { amount: number; unit: string } {
  if (category === "weight") return { amount, unit: "g" };
  return { amount, unit: "ml" };
}

export interface CombineResult {
  amount: number | string | null;
  unit?: string;
}

/**
 * Combine two amounts when merging same-ingredient lines.
 * - Same category (both weight or both volume): convert to normal unit, sum, return (amount, normalUnit).
 * - Same items unit (e.g. both "clove"): sum amounts, same unit.
 * - Different categories or one non-numeric: concatenate as "a + b" string.
 */
export function combineAmounts(
  existingAmount: number | string | null,
  existingUnit: string | undefined,
  newAmount: number | string | null,
  newUnit: string | undefined
): CombineResult {
  const existingNum =
    typeof existingAmount === "number" && Number.isFinite(existingAmount)
      ? existingAmount
      : null;
  const newNum =
    typeof newAmount === "number" && Number.isFinite(newAmount)
      ? newAmount
      : null;

  const catA = getUnitCategory(existingUnit);
  const catB = getUnitCategory(newUnit);

  if (existingNum !== null && newNum !== null) {
    const baseA = toBaseAmount(existingNum, existingUnit);
    const baseB = toBaseAmount(newNum, newUnit);
    if (baseA && baseB && baseA.category === baseB.category) {
      const totalBase = baseA.amount + baseB.amount;
      const { amount, unit } = fromBaseAmount(totalBase, baseA.category);
      return { amount: Math.round(amount * 100) / 100, unit };
    }
    if (
      (catA === "items" || catA === "count") &&
      (catB === "items" || catB === "count") &&
      existingUnit === newUnit
    ) {
      return {
        amount: existingNum + newNum,
        unit: existingUnit,
      };
    }
  }

  const parts = [existingAmount, newAmount]
    .filter((v) => v !== null && v !== undefined)
    .map(String);
  return {
    amount: parts.length > 0 ? parts.join(" + ") : null,
    unit: existingUnit ?? newUnit,
  };
}
