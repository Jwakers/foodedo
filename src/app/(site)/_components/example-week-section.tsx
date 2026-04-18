"use client";

import { ROUTES } from "@/app/constants";
import { Card, CardContent } from "@/components/ui/card";
import type { HomepageShowcaseRecipe } from "@/lib/homepage-showcase-recipes";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const FALLBACK_DAYS = [
  "Roast chicken & greens",
  "Pasta puttanesca",
  "Lentil dhal",
  "Salmon traybake",
  "Bean chilli",
  "Stir-fried tofu",
  "Sheet-pan sausages",
];

function recipeMetaLabel(recipe: HomepageShowcaseRecipe) {
  const totalMin =
    recipe.totalTimeMinutes ?? recipe.prepTime + (recipe.cookTime ?? 0);
  const timeLabel = totalMin > 0 ? `${totalMin} min` : "";
  const caloriesLabel =
    recipe.nutrition?.calories != null
      ? `${recipe.nutrition.calories} kcal`
      : "";
  return [timeLabel, caloriesLabel].filter(Boolean).join(" · ");
}

function ExampleDayCard({
  dayIndex,
  recipe,
  imagePriority,
}: {
  dayIndex: number;
  recipe: HomepageShowcaseRecipe;
  /** First tiles: eager load for faster visible food photography. */
  imagePriority?: boolean;
}) {
  const meta = recipeMetaLabel(recipe);
  const href =
    recipe.publicSlug != null ? ROUTES.discoverRecipe(recipe.publicSlug) : null;

  const cardClass = cn(
    "group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-md ring-1 ring-black/5",
    /* Explicit translate-y-0 so hover lift animates instead of jumping. */
    "translate-y-0 transition-[translate,box-shadow,border-color] duration-300 ease-out",
    href &&
      "hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg hover:ring-primary/10",
  );

  const body = (
    <>
      {/* Tall frame so food photography reads clearly (not postage-stamp tiles). */}
      <div className="relative aspect-3/4 min-h-[168px] w-full overflow-hidden bg-muted sm:min-h-[192px] lg:min-h-[200px]">
        {recipe.image ? (
          <Image
            src={recipe.image}
            alt={recipe.title}
            fill
            unoptimized
            priority={imagePriority}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
            sizes="(max-width: 768px) 72vw, (max-width: 1024px) 32vw, (max-width: 1280px) 24vw, 280px"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-linear-to-br from-muted to-muted/60 px-3 text-center text-sm text-muted-foreground">
            {recipe.title}
          </div>
        )}

        <div className="pointer-events-none absolute left-2 top-2 rounded-md bg-black/60 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm backdrop-blur-[2px]">
          Day {dayIndex + 1}
        </div>

        {recipe.image ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 via-black/45 to-transparent px-3 pb-3 pt-14 sm:pt-16">
            <p className="line-clamp-2 text-sm font-semibold leading-snug text-white drop-shadow-md sm:text-base">
              {recipe.title}
            </p>
            {meta ? (
              <p className="mt-1 text-xs font-medium text-white/90">{meta}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          cardClass,
          "block h-full min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        )}
        aria-label={`${recipe.title}, day ${dayIndex + 1}`}
      >
        {body}
      </Link>
    );
  }

  return <article className={cardClass}>{body}</article>;
}

function ExampleWeekCtaCard() {
  const cardClass = cn(
    "group relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-primary/15 bg-card shadow-md ring-1 ring-primary/5",
    "translate-y-0 transition-[transform,box-shadow,border-color] duration-300 ease-out motion-reduce:transition-none motion-reduce:hover:translate-y-0",
    "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:ring-primary/15",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  );

  return (
    <Link
      href={ROUTES.SIGN_UP}
      className={cn(cardClass, "block min-w-0")}
      aria-label="Sign up to generate your weekly meal plan in one click"
    >
      <div className="relative flex aspect-3/4 min-h-[168px] w-full flex-col justify-between overflow-hidden sm:min-h-[192px] lg:min-h-[200px]">
        {/* Very subtle tint so copy stays the focus */}
        <div className="absolute inset-0 bg-card" aria-hidden />
        <div
          className="absolute inset-0 bg-linear-to-br from-primary/8 via-transparent to-accent/10 dark:from-primary/12 dark:to-accent/12"
          aria-hidden
        />
        <div
          className="absolute -right-14 -top-14 size-44 rounded-full bg-primary/10 blur-3xl dark:bg-primary/15"
          aria-hidden
        />
        <div
          className="absolute -bottom-16 -left-10 size-48 rounded-full bg-accent/10 blur-3xl dark:bg-violet-500/12"
          aria-hidden
        />

        <div className="relative flex flex-1 flex-col p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary shadow-sm ring-1 ring-primary/10 backdrop-blur-sm dark:bg-background/60">
              <Sparkles className="size-3.5 shrink-0 text-primary" />
              Free in beta
            </span>
          </div>

          <div className="mt-auto space-y-2">
            <h3 className="text-balance text-lg font-bold leading-tight tracking-tight text-foreground sm:text-xl">
              Your week, decided in one click
            </h3>
            <p className="text-pretty text-sm leading-snug text-muted-foreground sm:text-[0.9375rem]">
              Generate a balanced weekly meal plan and a shopping list you can
              actually shop from.
            </p>
            <span className="inline-flex items-center gap-1.5 pt-1 text-sm font-semibold text-primary">
              Get started
              <ArrowRight className="size-4 transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function StaticFallbackWeek() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 md:gap-5">
      {FALLBACK_DAYS.map((label, i) => (
        <div
          key={String(label)}
          className="rounded-xl border border-border bg-card p-4 text-center shadow-sm"
        >
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Day {i + 1}
          </span>
          <p className="mt-2 line-clamp-2 text-sm font-medium text-foreground">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}

export function ExampleWeekSection({
  recipes = [],
}: {
  recipes?: HomepageShowcaseRecipe[];
}) {
  const hasReal = recipes.length > 0;

  return (
    <section
      className="py-16 sm:py-20 bg-muted/25"
      aria-labelledby="example-week-heading"
    >
      <div className="container mx-auto max-w-7xl px-4">
        <Card className="overflow-hidden border-primary/20 bg-primary/4 shadow-sm">
          <CardContent className="p-5 sm:p-8">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className="shrink-0 rounded-lg bg-primary/15 p-2.5">
                  <CalendarCheck className="size-7 text-primary" />
                </div>
                <div className="min-w-0">
                  <h2
                    id="example-week-heading"
                    className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
                  >
                    One plan. Your week.
                  </h2>
                  <p className="mt-1.5 max-w-2xl text-muted-foreground sm:text-lg">
                    Curated picks and the recipes you add, all yours to tweak.
                    {hasReal ? (
                      <> Here are a few real recipes from our collection.</>
                    ) : null}
                  </p>
                </div>
              </div>
              {hasReal ? (
                <Link
                  href={ROUTES.DISCOVER}
                  className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Browse all curated recipes
                </Link>
              ) : null}
            </div>

            {hasReal ? (
              <>
                {/* Narrow screens: horizontal strip with clear scroll / swipe affordance. */}
                <div className="md:hidden -mx-1 px-1">
                  <p className="mb-2 flex items-center justify-center gap-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <ChevronLeft
                      className="size-3.5 shrink-0 opacity-50"
                      aria-hidden
                    />
                    Swipe or scroll sideways
                    <ChevronRight
                      className="size-3.5 shrink-0 opacity-50"
                      aria-hidden
                    />
                  </p>
                  <p className="mb-3 text-center text-[11px] text-muted-foreground/90">
                    A peek of the next card shows there&apos;s more to explore.
                  </p>
                  <div
                    className={cn(
                      "flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-1 pb-2",
                      "scroll-pl-3 scroll-pr-2 touch-pan-x",
                      "[scrollbar-width:thin]",
                      "[scrollbar-color:var(--color-muted-foreground)_transparent]",
                      "[&::-webkit-scrollbar]:h-2",
                      "[&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-muted/40",
                      "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/35 [&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/50",
                    )}
                  >
                    {recipes.slice(0, 7).map((recipe, i) => (
                      <div
                        key={recipe._id}
                        className="w-[min(70vw,17rem)] shrink-0 snap-center sm:w-[min(68vw,17rem)]"
                      >
                        <ExampleDayCard
                          dayIndex={i}
                          recipe={recipe}
                          imagePriority={i < 3}
                        />
                      </div>
                    ))}
                    <div className="w-[min(70vw,17rem)] shrink-0 snap-center sm:w-[min(68vw,17rem)]">
                      <ExampleWeekCtaCard />
                    </div>
                  </div>
                </div>
                {/* md+: never more than 4 columns — wide tiles, two rows on xl+ (7 days + CTA). */}
                <div className="hidden md:grid md:grid-cols-3 md:gap-5 lg:grid-cols-4 lg:gap-6 xl:gap-7">
                  {recipes.slice(0, 7).map((recipe, i) => (
                    <div key={recipe._id} className="min-w-0">
                      <ExampleDayCard
                        dayIndex={i}
                        recipe={recipe}
                        imagePriority={i < 4}
                      />
                    </div>
                  ))}
                  <div className="min-w-0">
                    <ExampleWeekCtaCard />
                  </div>
                </div>
              </>
            ) : (
              <StaticFallbackWeek />
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
