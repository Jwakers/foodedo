"use client";

import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

export function EmptySlot({
  className,
  onAdd,
  label = "Add meal",
  compact = false,
}: {
  className?: string;
  onAdd?: () => void;
  label?: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onAdd?.()}
      className={cn(
        "w-full touch-manipulation rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 transition-colors hover:border-primary/40 hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        compact
          ? "flex min-h-14 items-center justify-center gap-2 px-4 py-3"
          : "flex min-h-[200px] flex-col items-center justify-center gap-3 p-6",
        className,
      )}
      aria-label={label}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full bg-muted text-muted-foreground",
          compact ? "size-7" : "size-10",
        )}
      >
        <Plus className={cn(compact ? "size-4" : "size-5")} aria-hidden />
      </span>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </button>
  );
}
