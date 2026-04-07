"use client";

import { CATEGORY_COLORS, ROUTES } from "@/app/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, titleCase } from "@/lib/utils";
import {
  isRecipeCategoryUsedByMealPlanGenerator,
  recipeHasMealPlanGeneratorMetadata,
  recipeIsInMealPlanGeneratorPool,
} from "convex/lib/constants";
import type { RecipeListItem } from "./types";
import { Ban, Check, Clock, Minus, Users, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

/** Icon badge that opens a hint popover. Must sit in a pointer-events-auto island (card uses a link overlay). */
function MealPlanBadgePopover({
  className,
  ariaLabel,
  children,
  body,
}: {
  className?: string;
  ariaLabel: string;
  children: ReactNode;
  body: ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            className,
            "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
          )}
          aria-label={ariaLabel}
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="z-60 w-72 text-sm"
        side="left"
        align="end"
        sideOffset={8}
      >
        <div className="space-y-2 text-muted-foreground">{body}</div>
      </PopoverContent>
    </Popover>
  );
}

type RecipeCardProps = {
  recipe: RecipeListItem;
  showMealPlanBadge?: boolean;
  /** When true, use Next.js Image optimization (system recipes only). Default false for user recipes. */
  optimizeImage?: boolean;
};

export function RecipeCard({
  recipe,
  showMealPlanBadge = true,
  optimizeImage = false,
}: RecipeCardProps) {
  const totalTime = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
  const categoryLabel = titleCase(recipe.category);
  const categoryOkForPlanner =
    isRecipeCategoryUsedByMealPlanGenerator(recipe.category);
  const categoryColor =
    CATEGORY_COLORS[recipe.category as keyof typeof CATEGORY_COLORS] ?? "";

  /** Same predicate as weekly planner pool (category, opt-out, metadata / legacy flag). */
  const poolEligible = recipeIsInMealPlanGeneratorPool(recipe);
  const wouldBePoolEligible = recipeIsInMealPlanGeneratorPool({
    ...recipe,
    excludeFromMealPlanGenerator: false,
  });

  const recipeHref = `${ROUTES.RECIPE}/${recipe._id}`;

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 pt-0">
      <div className="relative">
        <Link
          href={recipeHref}
          className="absolute inset-0 z-0 rounded-xl"
          aria-label={`Open recipe: ${recipe.title}`}
        />
        <div className="relative z-10 flex flex-col gap-6 pointer-events-none">
        <div className="aspect-4/3 bg-linear-to-br from-primary/20 to-primary/5 relative overflow-hidden">
          {recipe.image && (
            <Image
              src={recipe.image}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, (max-width: 1440px) 25vw, 450px"
              className="object-cover size-full"
              unoptimized={!optimizeImage}
            />
          )}
          <div
            className="absolute inset-0 bg-linear-to-t from-black/70 to-64% to-transparent"
            aria-hidden
          />
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2 pointer-events-none">
            {showMealPlanBadge && !categoryOkForPlanner && (
              <span className="pointer-events-auto shrink-0">
                <MealPlanBadgePopover
                  className="size-5 rounded-full flex items-center justify-center border border-border/50 text-muted-foreground/45"
                  ariaLabel="Category not used by weekly planner — tap for details"
                  body={
                    <p>
                      This category isn’t used when the app builds a week for
                      you (for example desserts or sides). You can still add
                      this recipe to your plan manually.
                    </p>
                  }
                >
                  <Minus className="size-2.5" strokeWidth={2.5} aria-hidden />
                </MealPlanBadgePopover>
              </span>
            )}
            {showMealPlanBadge &&
              categoryOkForPlanner &&
              !recipeHasMealPlanGeneratorMetadata(recipe) && (
                <span className="pointer-events-auto shrink-0">
                  <MealPlanBadgePopover
                    className="size-6 rounded-full flex items-center justify-center border border-dashed border-muted-foreground text-muted-foreground"
                    ariaLabel="Not yet eligible for weekly planner — tap for details"
                    body={
                      <p>
                        Your category works for auto-planning, but set{" "}
                        <span className="font-medium text-foreground">
                          primary protein
                        </span>{" "}
                        and{" "}
                        <span className="font-medium text-foreground">
                          complexity
                        </span>{" "}
                        on the recipe so the planner can include it.
                      </p>
                    }
                  >
                    <X className="size-3.5" strokeWidth={2.5} aria-hidden />
                  </MealPlanBadgePopover>
                </span>
              )}
            {showMealPlanBadge &&
              recipe.excludeFromMealPlanGenerator === true &&
              wouldBePoolEligible && (
                <span className="pointer-events-auto shrink-0">
                  <MealPlanBadgePopover
                    className="size-6 rounded-full flex items-center justify-center border border-amber-600/70 bg-amber-500/15 text-amber-700 dark:border-amber-500/60 dark:text-amber-400"
                    ariaLabel="Opted out of weekly planner suggestions — tap for details"
                    body={
                      <p>
                        You’ve turned off automatic suggestions for this recipe.
                        You can change that anytime from the recipe page.
                      </p>
                    }
                  >
                    <Ban className="size-3.5" strokeWidth={2.5} aria-hidden />
                  </MealPlanBadgePopover>
                </span>
              )}
            {showMealPlanBadge && poolEligible && (
                <span className="pointer-events-auto shrink-0">
                  <MealPlanBadgePopover
                    className="size-6 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center"
                    ariaLabel="Eligible for weekly planner — tap for details"
                    body={
                      <p>
                        The weekly planner can suggest this recipe when you
                        generate a week.
                      </p>
                    }
                  >
                    <Check className="size-3.5" strokeWidth={3} aria-hidden />
                  </MealPlanBadgePopover>
                </span>
              )}
            <Badge
              variant="secondary"
              className={cn(
                categoryColor,
                "border-0 font-medium pointer-events-none",
              )}
            >
              {categoryLabel}
            </Badge>
          </div>
          <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
            <h3 className="text-xl font-bold text-white drop-shadow-lg line-clamp-2">
              {recipe.title}
            </h3>
            {recipe.description && (
              <p className="text-white/90 text-sm mt-1 line-clamp-2 drop-shadow">
                {recipe.description}
              </p>
            )}
          </div>
        </div>

        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="size-4" />
                <span>{totalTime} min</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="size-4" />
                <span>Serves {recipe.serves}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {new Date(
                  recipe.updatedAt ?? recipe._creationTime ?? 0,
                ).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
        </div>
      </div>
    </Card>
  );
}

export function RecipeCardSkeleton() {
  return (
    <Card className="group relative overflow-hidden">
      <div className="aspect-4/3 bg-muted relative overflow-hidden">
        <div className="absolute top-4 right-4">
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="size-8" />
        </div>
      </CardFooter>
    </Card>
  );
}

export function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <RecipeCardSkeleton key={index} />
      ))}
    </div>
  );
}
