"use client";

import { cn, titleCase } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { List, Lock, LockOpen, MoreVertical, RefreshCw, X } from "lucide-react";
import Image from "next/image";

type Recipe = {
  _id: string;
  title: string;
  image: string | null;
  prepTime: number;
  cookTime?: number;
  totalTimeMinutes?: number;
  nutrition?: { calories?: number } | null;
  category: string;
  primaryProtein?: string | null;
};

type Entry = {
  _id: string;
  recipeId: string;
  isLocked?: boolean | null;
  recipe: Recipe | null;
};

export function MealPlanCard({
  entry,
  isOwner,
  onLockToggle,
  onSwitch,
  onRemove,
  onChangeRecipe,
  className,
}: {
  entry: Entry;
  isOwner: boolean;
  onLockToggle: () => void;
  onSwitch: () => void;
  onRemove: () => void;
  onChangeRecipe?: () => void;
  className?: string;
}) {
  const recipe = entry.recipe;
  if (!recipe) return null;

  const totalMin =
    recipe.totalTimeMinutes ?? recipe.prepTime + (recipe.cookTime ?? 0);
  const timeLabel = totalMin > 0 ? `${totalMin} min` : "";
  const caloriesLabel =
    recipe.nutrition?.calories != null
      ? `${recipe.nutrition.calories} kcal`
      : "";
  const metaLabel = [timeLabel, caloriesLabel].filter(Boolean).join(" • ");

  const tags: string[] = [];
  if (recipe.category) tags.push(titleCase(recipe.category));
  if (
    recipe.primaryProtein &&
    recipe.primaryProtein !== "other" &&
    recipe.primaryProtein !== "none"
  ) {
    tags.push(titleCase(recipe.primaryProtein));
  }
  const tagList = tags.slice(0, 2);

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        className,
      )}
    >
      <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
        {recipe.image ? (
          <Image
            src={recipe.image}
            alt={recipe.title}
            fill
            className="object-cover"
            unoptimized
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <span className="text-sm">No image</span>
          </div>
        )}

        {/* Top-left: remove (desktop hover / always on mobile) */}
        {isOwner && (
          <div
            className={cn(
              "absolute left-2 top-2 flex items-center gap-1.5",
              "opacity-100 md:opacity-0 md:group-hover:opacity-100",
              "transition-opacity",
            )}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove();
              }}
              className="flex size-10 items-center justify-center rounded-full bg-white/90 text-destructive shadow-sm hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Remove meal"
            >
              <X className="size-5" />
            </button>
          </div>
        )}

        {/* Bottom-left: prep time and calories */}
        {metaLabel && (
          <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white">
            {metaLabel}
          </div>
        )}

        {/* Top-right: lock — always visible when locked, otherwise on hover */}
        {isOwner && (
          <div
            className={cn(
              "absolute right-2 top-2 flex items-center gap-1.5",
              "transition-opacity",
              entry.isLocked
                ? "opacity-100"
                : "opacity-100 md:opacity-0 md:group-hover:opacity-100",
            )}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onLockToggle();
              }}
              className="flex size-10 items-center justify-center rounded-full bg-white/90 text-muted-foreground shadow-sm hover:bg-white hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={entry.isLocked ? "Unlock meal" : "Lock meal"}
            >
              {entry.isLocked ? (
                <Lock className="size-5" />
              ) : (
                <LockOpen className="size-5" />
              )}
            </button>
          </div>
        )}

        {/* Bottom-right: recipe options (pick or swap) — dropdown to avoid mis-taps on mobile */}
        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className={cn(
                  "absolute bottom-2 right-2 flex size-10 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "opacity-100 md:opacity-0 md:group-hover:opacity-100",
                  "transition-opacity",
                )}
                aria-label="Recipe options"
              >
                <MoreVertical className="size-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="top"
              className="min-w-[180px]"
            >
              {onChangeRecipe && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onChangeRecipe();
                  }}
                >
                  <List className="size-4" />
                  Pick replacement
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onSwitch();
                }}
              >
                <RefreshCw className="size-4" />
                Regenerate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex flex-col gap-2 p-3">
        <h3 className="font-semibold leading-tight text-foreground line-clamp-2">
          {recipe.title}
        </h3>
        {tagList.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tagList.map((label) => (
              <span
                key={label}
                className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
