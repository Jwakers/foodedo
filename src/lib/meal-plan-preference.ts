import type { Id } from "convex/_generated/dataModel";

/** UTC calendar day YYYY-MM-DD (matches Convex meal plan boundaries). */
export function utcDayKeyFromMs(ms: number): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type MealPlanSummaryForPick = {
  _id: Id<"mealPlans">;
  startDate?: number;
  endDate: number;
  isFinalised: boolean;
  updatedAt: number;
  entryMinDate: number | null;
  entryMaxDate: number | null;
};

function planCoversLocalDateKey(
  summary: MealPlanSummaryForPick,
  localDateKey: string,
): boolean {
  const startKey =
    summary.startDate !== undefined
      ? utcDayKeyFromMs(summary.startDate)
      : summary.entryMinDate !== null
        ? utcDayKeyFromMs(summary.entryMinDate)
        : null;
  const endKey = utcDayKeyFromMs(summary.endDate);
  if (startKey === null) return false;
  return localDateKey >= startKey && localDateKey <= endKey;
}

/** Mirrors Convex `pickPreferredPlanDoc` for URL defaults without an extra round trip. */
export function pickPreferredMealPlanIdFromSummaries(
  summaries: MealPlanSummaryForPick[],
  localDateKey: string | undefined,
): Id<"mealPlans"> | null {
  if (summaries.length === 0) return null;
  if (localDateKey) {
    const finalisedCovering = summaries.filter(
      (s) =>
        s.isFinalised === true && planCoversLocalDateKey(s, localDateKey),
    );
    if (finalisedCovering.length > 0) {
      finalisedCovering.sort(
        (a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0),
      );
      return finalisedCovering[0]!._id;
    }
  }
  const sorted = [...summaries].sort(
    (a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0),
  );
  return sorted[0]!._id;
}
