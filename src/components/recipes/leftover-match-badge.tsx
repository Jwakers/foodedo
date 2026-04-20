"use client";

import { cn } from "@/lib/utils";

type LeftoverMatchBadgeProps = {
  matchCount: number;
  targetCount: number;
  className?: string;
};

/**
 * Ingredient-match indicator for filtered recipe grids. Visually separate from
 * category/taxonomy badges (those stay top-right); this sits top-left with a
 * solid surface so it stays legible on any hero image.
 */
export function LeftoverMatchBadge({
  matchCount,
  targetCount,
  className,
}: LeftoverMatchBadgeProps) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute left-4 top-4 z-10 inline-flex items-center rounded-md",
        "border border-border bg-background text-foreground shadow-md",
        "px-2.5 py-1 text-xs font-semibold tabular-nums",
        className,
      )}
      title={`This recipe uses ${matchCount} of ${targetCount} selected ingredients`}
    >
      Uses {matchCount}/{targetCount}
    </span>
  );
}
