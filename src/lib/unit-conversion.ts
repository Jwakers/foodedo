/**
 * Unit conversion for shopping list aggregation (client mirror of convex/lib/unitConversion).
 * Normalise: weight in g, volume in ml. Per-item units combine only when same unit.
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

function toBaseAmount(
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

function fromBaseAmount(
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
  const normUnitA = (existingUnit ?? "").trim().toLowerCase();
  const normUnitB = (newUnit ?? "").trim().toLowerCase();
  const sameUnit = normUnitA === normUnitB;

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
      sameUnit
    ) {
      return {
        amount: existingNum + newNum,
        unit: existingUnit ?? newUnit,
      };
    }
  }

  const parts: string[] = [];
  if (existingAmount !== null && existingAmount !== undefined) {
    parts.push(
      existingUnit?.trim()
        ? `${existingAmount} ${existingUnit}`
        : String(existingAmount)
    );
  }
  if (newAmount !== null && newAmount !== undefined) {
    parts.push(
      newUnit?.trim() ? `${newAmount} ${newUnit}` : String(newAmount)
    );
  }
  const amount = parts.length > 0 ? parts.join(" + ") : null;
  const unit = sameUnit ? (existingUnit ?? newUnit) : undefined;
  return { amount, unit };
}
