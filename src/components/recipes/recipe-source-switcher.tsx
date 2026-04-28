"use client";

import { cn } from "@/lib/utils";
import { useRef, type KeyboardEvent } from "react";
import { TAB_ALL, TAB_DISCOVER, TAB_MY_RECIPES } from "./recipe-listing-context";

export type RecipeSourceSwitchValue =
  | typeof TAB_MY_RECIPES
  | typeof TAB_DISCOVER
  | typeof TAB_ALL;

const SOURCE_OPTIONS: Array<{
  value: RecipeSourceSwitchValue;
  label: string;
}> = [
  { value: TAB_MY_RECIPES, label: "My recipes" },
  { value: TAB_DISCOVER, label: "Discover" },
  { value: TAB_ALL, label: "All recipes" },
];

export function RecipeSourceSwitcher({
  value,
  onValueChange,
  className,
  compact = false,
}: {
  value: RecipeSourceSwitchValue;
  onValueChange: (next: RecipeSourceSwitchValue) => void;
  className?: string;
  compact?: boolean;
}) {
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const key = event.key;
    if (
      key !== "ArrowRight" &&
      key !== "ArrowLeft" &&
      key !== "Home" &&
      key !== "End"
    ) {
      return;
    }
    event.preventDefault();
    if (key === "Home") {
      onValueChange(SOURCE_OPTIONS[0].value);
      buttonsRef.current[0]?.focus();
      return;
    }
    if (key === "End") {
      onValueChange(SOURCE_OPTIONS[SOURCE_OPTIONS.length - 1].value);
      buttonsRef.current[SOURCE_OPTIONS.length - 1]?.focus();
      return;
    }
    const direction = key === "ArrowRight" ? 1 : -1;
    const nextIndex =
      (index + direction + SOURCE_OPTIONS.length) % SOURCE_OPTIONS.length;
    onValueChange(SOURCE_OPTIONS[nextIndex].value);
    buttonsRef.current[nextIndex]?.focus();
  };

  return (
    <div
      aria-label="Recipe sources"
      className={cn(
        "grid w-full grid-cols-3 gap-1 overflow-hidden rounded-2xl border bg-muted/40 p-1",
        compact ? "w-full" : "w-full max-w-xl",
        className,
      )}
    >
      {SOURCE_OPTIONS.map((option, index) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            ref={(el) => {
              buttonsRef.current[index] = el;
            }}
            onClick={() => onValueChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "min-w-0 rounded-xl px-2 py-2 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/70",
            )}
          >
            <span className="block truncate">{option.label}</span>
            {active ? <span className="sr-only"> (selected)</span> : null}
          </button>
        );
      })}
    </div>
  );
}
