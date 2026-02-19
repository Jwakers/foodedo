"use client";

import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

const ADD_MEAL_MESSAGE = "Add meal coming soon";

export function EmptySlot({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => alert(ADD_MEAL_MESSAGE)}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-6 transition-colors hover:border-primary/40 hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "min-h-[200px] w-full",
        className
      )}
      aria-label="Add meal"
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Plus className="size-5" aria-hidden />
      </span>
      <span className="text-sm font-medium text-muted-foreground">
        Add Meal
      </span>
    </button>
  );
}
