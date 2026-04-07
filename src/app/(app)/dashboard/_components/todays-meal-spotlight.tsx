"use client";

import { ROUTES, recipeUrlWithCookMode } from "@/app/constants";
import { cn, startOfLocalDayMs } from "@/lib/utils";
import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import {
  ArrowRight,
  CalendarDays,
  ChefHat,
  Clock,
  Flame,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

type CurrentPlan = NonNullable<
  FunctionReturnType<typeof api.mealPlans.getCurrentMealPlan>
>;
type PlanEntry = CurrentPlan["entries"][number];
type EntryWithRecipe = PlanEntry & {
  recipe: NonNullable<PlanEntry["recipe"]>;
};

function planDayMs(ms: number): number {
  return startOfLocalDayMs(ms);
}

/** Next local calendar day start after `localDayStartMs` (handles DST). */
function addLocalCalendarDays(localDayStartMs: number, days: number): number {
  const d = new Date(localDayStartMs);
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function pickFeaturedEntry(
  entries: EntryWithRecipe[],
): EntryWithRecipe | null {
  if (entries.length === 0) return null;
  if (entries.length === 1) return entries[0];

  const hour = new Date().getHours();
  const dinnerish = entries.find((e) =>
    /dinner|supper|evening/i.test(e.mealLabel ?? ""),
  );
  if (dinnerish) return dinnerish;
  if (hour >= 16) {
    return [...entries].sort((a, b) => (b.order ?? 0) - (a.order ?? 0))[0];
  }
  return [...entries].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0];
}

type SpotlightResolved = {
  featured: EntryWithRecipe | null;
  rest: EntryWithRecipe[];
  spotlightDayMs: number | null;
  isSpotlightToday: boolean;
  todayMs: number;
};

function resolveSpotlight(plan: CurrentPlan | null): SpotlightResolved {
  const todayMs = startOfLocalDayMs(Date.now());

  if (!plan?.entries?.length) {
    return {
      featured: null,
      rest: [],
      spotlightDayMs: null,
      isSpotlightToday: true,
      todayMs,
    };
  }

  const withRecipes = plan.entries.filter(
    (e): e is EntryWithRecipe =>
      e.recipe !== null && e.recipe !== undefined,
  );
  const todayList = withRecipes.filter((e) => planDayMs(e.date) === todayMs);

  let spotlightDayMs: number;
  let list: EntryWithRecipe[];

  if (todayList.length > 0) {
    spotlightDayMs = todayMs;
    list = todayList;
  } else {
    const futureDays = new Set<number>();
    for (const e of withRecipes) {
      const d = planDayMs(e.date);
      if (d >= todayMs) futureDays.add(d);
    }
    if (futureDays.size === 0) {
      return {
        featured: null,
        rest: [],
        spotlightDayMs: null,
        isSpotlightToday: true,
        todayMs,
      };
    }
    spotlightDayMs = Math.min(...futureDays);
    list = withRecipes.filter((e) => planDayMs(e.date) === spotlightDayMs);
  }

  const featured = pickFeaturedEntry(list);
  if (!featured) {
    return {
      featured: null,
      rest: [],
      spotlightDayMs,
      isSpotlightToday: spotlightDayMs === todayMs,
      todayMs,
    };
  }

  return {
    featured,
    rest: list.filter((e) => e._id !== featured._id),
    spotlightDayMs,
    isSpotlightToday: spotlightDayMs === todayMs,
    todayMs,
  };
}

function weekdayNameLocal(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    weekday: "long",
  });
}

function primaryHeadline(
  isSpotlightToday: boolean,
  spotlightDayMs: number,
  todayMs: number,
  mealLabel: string | undefined,
): string {
  if (isSpotlightToday) {
    const label = mealLabel?.trim();
    if (label && /dinner|supper|evening/i.test(label)) return "Tonight";
    if (label && /breakfast|morning/i.test(label)) return "This morning";
    if (label && /lunch/i.test(label)) return "Today at lunch";
    return "On the menu today";
  }
  if (spotlightDayMs === addLocalCalendarDays(todayMs, 1)) return "Tomorrow";
  return `${weekdayNameLocal(spotlightDayMs)}'s meal`;
}

function alsoSectionLabel(
  isSpotlightToday: boolean,
  spotlightDayMs: number,
  todayMs: number,
): string {
  if (isSpotlightToday) return "Also today";
  if (spotlightDayMs === addLocalCalendarDays(todayMs, 1)) return "Also tomorrow";
  return `Also on ${weekdayNameLocal(spotlightDayMs)}`;
}

/** Subtle film grain as data-URI (SVG noise), low contrast */
const grainOverlay =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E\")";

export function TodaysMealSpotlight() {
  const currentPlan = useQuery(api.mealPlans.getCurrentMealPlan);

  const { featured, rest, spotlightDayMs, isSpotlightToday, todayMs } = useMemo(
    () => resolveSpotlight(currentPlan ?? null),
    [currentPlan],
  );

  if (currentPlan === undefined) {
    return (
      <div
        className="mb-6 h-72 rounded-2xl border border-primary/20 bg-muted/40 animate-pulse sm:h-80"
        aria-hidden
      />
    );
  }

  if (currentPlan === null) {
    return (
      <article
        className={cn(
          "mb-6 overflow-hidden rounded-2xl border border-primary/25 bg-card text-left shadow-xl shadow-black/10 ring-1 ring-black/5 dark:ring-white/10",
          "bg-linear-to-br from-primary/12 via-card to-card dark:from-primary/20",
        )}
      >
        <div className="relative isolate px-6 py-10 sm:px-10 sm:py-12 md:px-12 md:py-14">
          <div
            className="pointer-events-none absolute inset-0 bg-size-[256px_256px] opacity-[0.08] mix-blend-overlay"
            style={{ backgroundImage: grainOverlay }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-primary/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-10 size-72 rounded-full bg-amber-400/10 blur-3xl dark:bg-amber-300/15"
            aria-hidden
          />

          <div className="relative z-10 max-w-xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary",
                )}
              >
                <Sparkles className="size-3.5" aria-hidden />
                Meal planning
              </span>
            </div>
            <h2 className="mb-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl md:text-4xl">
              Your week starts with a plan
            </h2>
            <p className="mb-8 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Drop in recipes, see what&apos;s cooking day by day, and spin up a
              shopping list in one go. When you&apos;re ready, we&apos;ll put your
              next meal right here.
            </p>
            <Link
              href={ROUTES.MEAL_PLAN}
              className={cn(
                "group/cta inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25",
                "transition-all duration-300 hover:bg-primary/90 hover:shadow-primary/35",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
            >
              <CalendarDays className="size-4 shrink-0" aria-hidden />
              Create a meal plan
              <ArrowRight
                className="size-4 transition-transform duration-300 group-hover/cta:translate-x-1"
                aria-hidden
              />
            </Link>
          </div>
        </div>
      </article>
    );
  }

  if (!featured || spotlightDayMs === null) return null;

  const recipe = featured.recipe;
  const href = `${ROUTES.RECIPE}/${recipe._id}`;
  const cookHref = recipeUrlWithCookMode(recipe._id);
  const totalMins =
    recipe.totalTimeMinutes ?? (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
  const label = featured.mealLabel?.trim();
  const headline = primaryHeadline(
    isSpotlightToday,
    spotlightDayMs,
    todayMs,
    label,
  );
  const secondaryChip = isSpotlightToday
    ? "From your meal plan"
    : "Coming up";

  const hasMore = rest.length > 0;
  const alsoLabel = alsoSectionLabel(
    isSpotlightToday,
    spotlightDayMs,
    todayMs,
  );

  return (
    <article
      className={cn(
        "mb-6 overflow-hidden rounded-2xl border border-border/60 bg-card text-left shadow-2xl shadow-black/15 ring-1 ring-black/5 dark:ring-white/10",
        "transition-[box-shadow,transform] duration-500 hover:shadow-black/25 dark:hover:shadow-black/40",
      )}
    >
      <div
        className={cn(
          "group relative isolate grid min-h-[min(85vw,20rem)] w-full overflow-hidden sm:min-h-96 md:min-h-104",
          hasMore ? "rounded-t-2xl" : "rounded-2xl",
        )}
      >
        {/* —— Full-bleed image —— */}
        <div className="col-start-1 row-start-1 relative min-h-0 size-full overflow-hidden bg-muted">
          {recipe.image ? (
            <Image
              src={recipe.image}
              alt=""
              fill
              className="object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.06]"
              sizes="(max-width: 1280px) 100vw, 1280px"
              priority
              unoptimized
            />
          ) : (
            <div
              className="absolute inset-0 bg-[conic-gradient(at_70%_20%,oklch(0.55_0.14_150),oklch(0.45_0.08_200),oklch(0.5_0.12_55),oklch(0.55_0.14_150))]"
              aria-hidden
            />
          )}
        </div>

        {/* —— Readability stack —— */}
        <div
          className="pointer-events-none col-start-1 row-start-1 bg-linear-to-t from-black via-black/55 to-black/25"
          aria-hidden
        />
        <div
          className="pointer-events-none col-start-1 row-start-1 bg-linear-to-br from-black/75 via-transparent to-transparent sm:from-black/65"
          aria-hidden
        />
        <div
          className="pointer-events-none col-start-1 row-start-1 bg-[radial-gradient(ellipse_120%_80%_at_10%_100%,oklch(0.45_0.14_155/0.55),transparent_65%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none col-start-1 row-start-1 bg-[radial-gradient(ellipse_70%_50%_at_100%_0%,oklch(0.72_0.14_75/0.22),transparent_55%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none col-start-1 row-start-1 bg-size-[256px_256px] opacity-[0.12] mix-blend-overlay"
          style={{ backgroundImage: grainOverlay }}
          aria-hidden
        />
        <div
          className="pointer-events-none col-start-1 row-start-1 bg-linear-to-t from-transparent via-transparent to-black/35"
          aria-hidden
        />

        <div
          className="pointer-events-none col-start-1 row-start-1 h-px self-start bg-linear-to-r from-transparent via-white/25 to-transparent"
          aria-hidden
        />
        <div
          className={cn(
            "pointer-events-none col-start-1 row-start-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]",
            hasMore ? "rounded-t-2xl" : "rounded-2xl",
          )}
          aria-hidden
        />

        <div
          className="pointer-events-none col-start-1 row-start-1 h-full w-[min(55%,18rem)] translate-x-[-18%] self-stretch bg-primary/35 blur-[56px] transition-opacity duration-500 group-hover:opacity-100 sm:w-[40%] sm:max-w-xs"
          aria-hidden
        />

        {/* —— Overlay content —— */}
        <div className="relative z-10 col-start-1 row-start-1 flex flex-col justify-end p-6 pb-8 sm:p-8 sm:pb-10 md:p-10 md:pb-12">
          <div className="max-w-4xl">
            <div className="mb-4 flex flex-wrap items-center gap-2 sm:mb-5">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white backdrop-blur-md",
                  "shadow-lg shadow-black/20 ring-1 ring-white/10",
                )}
              >
                <Flame className="size-3.5 text-amber-300" aria-hidden />
                {headline}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-xs font-medium text-white/85 backdrop-blur-sm">
                <Sparkles className="size-3.5 text-amber-200/90" aria-hidden />
                {secondaryChip}
              </span>
            </div>

            <h2
              className={cn(
                "mb-4 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-[3.5rem]",
                "drop-shadow-[0_2px_16px_rgba(0,0,0,0.9)] [text-shadow:0_1px_2px_rgba(0,0,0,0.8),0_4px_32px_rgba(0,0,0,0.75)]",
                "transition-[filter,transform] duration-300 group-hover:brightness-110 group-hover:[text-shadow:0_2px_20px_rgba(255,255,255,0.25),0_4px_40px_rgba(0,0,0,0.8)]",
              )}
            >
              <Link
                href={href}
                className="rounded-sm text-white no-underline transition-colors hover:text-white/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                {recipe.title ?? "Recipe"}
              </Link>
            </h2>

            <div className="mb-5 flex flex-wrap items-center gap-3 text-sm text-white/90">
              {label ? (
                <span className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 font-semibold text-white backdrop-blur-sm">
                  {label}
                </span>
              ) : null}
              {totalMins > 0 ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-white/80">
                  <Clock className="size-4 shrink-0 text-white/70" aria-hidden />
                  {totalMins} min
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={href}
                className={cn(
                  "group/cta inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-md",
                  "shadow-lg shadow-black/30 ring-1 ring-white/15 transition-all duration-300",
                  "hover:border-primary/50 hover:bg-primary/90 hover:text-primary-foreground hover:ring-primary/30",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                )}
              >
                Open recipe
                <ArrowRight
                  className="size-4 transition-transform duration-300 group-hover/cta:translate-x-1.5"
                  aria-hidden
                />
              </Link>
              <Link
                href={cookHref}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border-2 border-white/40 bg-white/5 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-md",
                  "shadow-md shadow-black/25 transition-all duration-300",
                  "hover:border-white/70 hover:bg-white/15",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                )}
              >
                <ChefHat className="size-4 shrink-0" aria-hidden />
                Start cooking
              </Link>
            </div>
          </div>
        </div>
      </div>

      {hasMore ? (
        <div
          className={cn(
            "relative isolate rounded-b-2xl border-t border-border/80 bg-card px-5 py-4 sm:px-6",
            "shadow-[0_-12px_32px_-8px_rgba(0,0,0,0.12)] dark:shadow-[0_-12px_32px_-8px_rgba(0,0,0,0.45)]",
          )}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/35 to-transparent"
            aria-hidden
          />
          <p className="mb-2.5 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {alsoLabel}
          </p>
          <div className="flex flex-wrap gap-2">
            {rest.map((e) => (
              <Link
                key={e._id}
                href={`${ROUTES.RECIPE}/${e.recipe._id}`}
                className={cn(
                  "rounded-full border border-border bg-background/90 px-3.5 py-1.5 text-xs font-semibold text-foreground",
                  "shadow-sm transition-colors hover:border-primary/45 hover:bg-primary/8 hover:text-primary",
                )}
              >
                {e.mealLabel ? `${e.mealLabel}: ` : null}
                {e.recipe.title}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}
