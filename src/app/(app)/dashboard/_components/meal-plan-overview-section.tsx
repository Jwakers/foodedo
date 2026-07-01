"use client";

import { useCurrentMealPlan } from "@/app/(app)/_components.tsx/current-meal-plan-context";
import { ROUTES } from "@/app/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, startOfDayMs } from "@/lib/utils";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { CalendarCheck, CalendarDays, ChefHat, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "convex/react";

function formatDateShortUtc(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** Column header aligned with plan entry dates (UTC day boundary, same as grouping). */
function formatDayColumnUtc(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

type MealTile = {
  key: string;
  recipeId: Id<"recipes">;
  title: string;
  mealLabel?: string;
  image: string | null;
  totalTimeMinutes?: number;
};

function MealThumbnail({
  image,
  title,
}: {
  image: string | null;
  title: string;
}) {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted ring-1 ring-border/60">
      {image ? (
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          sizes="(max-width: 768px) 28vw, 120px"
          unoptimized
        />
      ) : (
        <div className="flex size-full items-center justify-center">
          <ChefHat className="size-8 text-muted-foreground/70" aria-hidden />
        </div>
      )}
    </div>
  );
}

export function MealPlanOverviewSection() {
  const { currentPlan } = useCurrentMealPlan();
  const now = Date.now();
  const utcTodayStart = startOfDayMs(now);

  const mealsByDate = useMemo(() => {
    if (!currentPlan?.entries) return [];
    const grouped = new Map<number, MealTile[]>();
    const entriesInPlanOrder = [...currentPlan.entries].sort(
      (a, b) =>
        a.date - b.date || (a.order ?? 999) - (b.order ?? 999),
    );
    entriesInPlanOrder.forEach((entry) => {
      const dateKey = startOfDayMs(entry.date);
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      const recipe = entry.recipe;
      if (recipe?._id) {
        grouped.get(dateKey)!.push({
          key: entry._id,
          recipeId: recipe._id,
          title: recipe.title?.trim() || "Recipe",
          mealLabel: entry.mealLabel ?? undefined,
          image: recipe.image ?? null,
          totalTimeMinutes: recipe.totalTimeMinutes ?? undefined,
        });
      }
    });
    return Array.from(grouped.entries())
      .sort(([a], [b]) => a - b)
      .map(([date, meals]) => ({ date, meals }));
  }, [currentPlan?.entries]);

  if (currentPlan === undefined) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-lg" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentPlan) {
    return null;
  }

  const displayStart =
    currentPlan.startDate ??
    (currentPlan.entries?.length
      ? Math.min(...currentPlan.entries.map((e) => e.date))
      : startOfDayMs(now));
  const displayEnd =
    currentPlan.endDate ??
    (currentPlan.entries?.length
      ? Math.max(...currentPlan.entries.map((e) => e.date))
      : startOfDayMs(now));
  const mealCount = currentPlan.entries?.length ?? 0;
  const isDraft = currentPlan.isFinalised !== true;
  const planHref = ROUTES.mealPlanWithId(currentPlan._id);

  return (
    <Card
      className={cn(
        "mb-6 overflow-hidden min-w-0",
        isDraft
          ? "border-amber-500/35 bg-amber-500/5"
          : "border-primary/20 bg-primary/5",
      )}
    >
      <CardContent className="p-4 sm:p-6 min-w-0 overflow-hidden">
        <div className="flex flex-col gap-4 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
            <div className="flex items-start gap-3 min-w-0 flex-1 overflow-hidden">
              <div
                className={cn(
                  "p-2 rounded-lg shrink-0",
                  isDraft ? "bg-amber-500/15" : "bg-primary/15",
                )}
              >
                <CalendarCheck
                  className={cn(
                    "size-6",
                    isDraft
                      ? "text-amber-700 dark:text-amber-400"
                      : "text-primary",
                  )}
                />
              </div>
              <div className="min-w-0 overflow-hidden">
                <h2 className="text-lg font-semibold text-foreground mb-0.5 truncate">
                  {isDraft ? "Draft meal plan" : "This week’s meal plan"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {formatDateShortUtc(displayStart)} –{" "}
                  {formatDateShortUtc(displayEnd)}
                  {" · "}
                  {mealCount} meal{mealCount !== 1 ? "s" : ""} planned
                  {isDraft ? " · save to open recipes" : ""}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button asChild variant="default" size="sm" className="shrink-0">
                <Link href={planHref}>
                  {isDraft ? "Review plan" : "View plan"}
                </Link>
              </Button>
            </div>
          </div>

          {mealsByDate.length > 0 && (
            <div
              className={cn(
                "overflow-x-auto overscroll-x-contain rounded-lg border border-border/60 bg-background/50",
                "snap-x snap-mandatory [-webkit-overflow-scrolling:touch]",
                "[scrollbar-width:thin]",
                "[scrollbar-color:var(--color-muted-foreground)_transparent]",
                "md:snap-none",
              )}
            >
              <div
                className={cn(
                  "grid min-w-0 gap-2 p-2 sm:gap-3 sm:p-3",
                  "grid-flow-col auto-cols-[minmax(8.75rem,10.5rem)] w-max max-w-none",
                  "md:grid-flow-row md:w-full md:max-w-full md:auto-cols-auto",
                  "md:grid-cols-[repeat(auto-fit,minmax(8.75rem,1fr))]",
                )}
              >
                {mealsByDate.map(({ date, meals }) => {
                  const isToday = date === utcTodayStart;
                  return (
                    <div
                      key={date}
                      aria-current={isToday ? "date" : undefined}
                      className={cn(
                        "flex min-h-0 min-w-0 flex-col overflow-visible rounded-lg border bg-card/80 px-2 py-2 sm:px-2.5 sm:py-2.5 snap-start",
                        isToday
                          ? "border-primary/50 ring-2 ring-primary/25 shadow-sm"
                          : "border-border/70",
                      )}
                    >
                      <div className="mb-2 flex min-w-0 shrink-0 items-center justify-between gap-2 border-b border-border/60 pb-1.5">
                        <p
                          className={cn(
                            "min-w-0 flex-1 text-left text-[11px] font-semibold uppercase tracking-wide leading-tight",
                            isToday ? "text-primary" : "text-muted-foreground",
                          )}
                        >
                          {formatDayColumnUtc(date)}
                        </p>
                      </div>
                      <div className="space-y-2 pr-0.5">
                        {meals.map((meal) => (
                          <Link
                            key={meal.key}
                            href={`${ROUTES.RECIPE}/${meal.recipeId}`}
                            className={cn(
                              "group block min-w-0 rounded-md outline-none",
                              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                            )}
                            aria-label={`${meal.title}${meal.mealLabel ? `, ${meal.mealLabel}` : ""}`}
                          >
                            <MealThumbnail
                              image={meal.image}
                              title={meal.title}
                            />
                            <div className="mt-1.5 min-w-0 space-y-0.5">
                              {meal.mealLabel ? (
                                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                  {meal.mealLabel}
                                </p>
                              ) : null}
                              <p className="line-clamp-2 text-xs font-medium leading-snug text-foreground group-hover:text-primary sm:text-[0.8125rem]">
                                {meal.title}
                              </p>
                              {meal.totalTimeMinutes != null &&
                              meal.totalTimeMinutes > 0 ? (
                                <p className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                  <Clock
                                    className="size-2.5 shrink-0"
                                    aria-hidden
                                  />
                                  {meal.totalTimeMinutes} min
                                </p>
                              ) : null}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Shown on the dashboard when the user has no active plan but has at least one
 * past plan. Surfaces the most recent plan as a lightweight nudge so users can
 * quickly jump back in.
 */
export function PreviousMealPlanNudge() {
  const { currentPlan } = useCurrentMealPlan();
  const result = useQuery(
    api.mealPlans.getMealPlanSummariesPaged,
    currentPlan === null ? { limit: 1 } : "skip",
  );

  if (currentPlan !== null) return null;
  if (!result || result.plans.length === 0) return null;

  const plan = result.plans[0];
  const planHref = ROUTES.mealPlanWithId(plan._id);
  const displayStart = plan.startDate;
  const displayEnd = plan.endDate;

  return (
    <Card className="mb-6 border-border/50 bg-muted/20">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 rounded-lg bg-muted shrink-0">
              <CalendarDays className="size-5 text-muted-foreground" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">
                Your last meal plan
              </p>
              <p className="text-sm font-semibold text-foreground truncate">
                {formatDateShortUtc(displayStart ?? displayEnd)} –{" "}
                {formatDateShortUtc(displayEnd)}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {plan.isFinalised ? "Saved" : "Draft"}
                </span>
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0 self-start sm:self-auto">
            <Link href={planHref}>View plan</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
