"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  clampTargetServings,
  TARGET_SERVINGS_MAX,
  TARGET_SERVINGS_MIN,
} from "convex/lib/constants";
import { Minus, Plus } from "lucide-react";

type ServingsStepperProps = {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  className?: string;
};

export function ServingsStepper({
  value,
  onChange,
  disabled = false,
  min = TARGET_SERVINGS_MIN,
  max = TARGET_SERVINGS_MAX,
  className,
}: ServingsStepperProps) {
  const clamped = Math.min(max, Math.max(min, clampTargetServings(value)));
  const canDecrement = !disabled && clamped > min;
  const canIncrement = !disabled && clamped < max;

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onChange(clamped - 1)}
        disabled={!canDecrement}
        aria-label="Decrease servings"
      >
        <Minus className="size-4" />
      </Button>
      <div className="min-w-10 text-center font-medium tabular-nums">{clamped}</div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onChange(clamped + 1)}
        disabled={!canIncrement}
        aria-label="Increase servings"
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
