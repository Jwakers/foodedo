import type { Id } from "convex/_generated/dataModel";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export type MealPlanSummaryForPick = {
  _id: Id<"mealPlans">;
  startDate?: number;
  endDate: number;
  isFinalised: boolean;
  updatedAt: number;
  entryMinDate: number | null;
  entryMaxDate: number | null;
};

/** Same overlap rule as Convex `planOverlapsLocalCalendarDay` (local day vs plan UTC span). */
export function planOverlapsLocalCalendarDaySummary(
  summary: MealPlanSummaryForPick,
  localDayStartMs: number,
): boolean {
  const planStart =
    summary.startDate ?? summary.entryMinDate ?? summary.endDate;
  const planEndExclusive = summary.endDate + ONE_DAY_MS;
  const localEndExclusive = localDayStartMs + ONE_DAY_MS;
  return localDayStartMs < planEndExclusive && localEndExclusive > planStart;
}

/** Mirrors Convex `pickPreferredPlanDoc` for URL defaults without an extra round trip. */
export function pickPreferredMealPlanIdFromSummaries(
  summaries: MealPlanSummaryForPick[],
  localDayStartMs: number | undefined,
): Id<"mealPlans"> | null {
  if (summaries.length === 0) return null;
  if (localDayStartMs !== undefined) {
    const finalisedCovering = summaries.filter(
      (s) =>
        s.isFinalised === true &&
        planOverlapsLocalCalendarDaySummary(s, localDayStartMs),
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
