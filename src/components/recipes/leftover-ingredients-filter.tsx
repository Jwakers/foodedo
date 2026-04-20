"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useRecipeListing } from "./recipe-listing-context";
import { LeftoverIngredientsPicker } from "./leftover-ingredients-picker";

export function LeftoverIngredientsFilter() {
  const {
    leftoverIngredientIds,
    leftoverIngredientPhrases,
    setLeftoverSelection,
    canUseLeftoverFeatures,
  } = useRecipeListing();

  const [open, setOpen] = useState(false);
  const selectedCount =
    leftoverIngredientIds.length + leftoverIngredientPhrases.length;

  if (!canUseLeftoverFeatures) {
    return null;
  }

  const panelId = "leftover-ingredients-filter-panel";

  return (
    <div className="rounded-lg border border-border bg-muted/25">
      <Button
        type="button"
        variant="ghost"
        className="flex h-auto w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left font-normal hover:bg-muted/60"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium text-foreground block">
            Match ingredients
          </span>
          <span className="text-xs text-muted-foreground block">
            {selectedCount > 0
              ? `${selectedCount} selected — only matching recipes are shown`
              : "Optional — filter the list to recipes that use these ingredients"}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </Button>
      {open ? (
        <div
          id={panelId}
          className="border-t border-border px-3 pb-4 pt-3"
        >
          <LeftoverIngredientsPicker
            selectedIds={leftoverIngredientIds}
            selectedPhrases={leftoverIngredientPhrases}
            onSelectionChange={setLeftoverSelection}
            canUseFeatures={canUseLeftoverFeatures}
            description="Only recipes that include at least one of these ingredients appear. Clear everything to see all recipes again."
          />
        </div>
      ) : null}
    </div>
  );
}
