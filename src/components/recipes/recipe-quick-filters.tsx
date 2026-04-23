"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RECIPE_QUICK_FILTERS } from "./quick-filters";
import { useRecipeListing } from "./recipe-listing-context";

export function RecipeQuickFilters() {
  const { filterState, toggleQuickFilter } = useRecipeListing();
  const selectedFilters = filterState.selectedQuickFilters;

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-foreground">Quick filters</span>
      <div className="flex flex-wrap gap-2">
        {RECIPE_QUICK_FILTERS.map((filter) => {
          const isActive = selectedFilters.includes(filter.key);
          return (
            <Button
              key={filter.key}
              type="button"
              size="sm"
              variant={isActive ? "default" : "outline"}
              className={cn("rounded-full px-3", !isActive && "bg-background")}
              aria-pressed={isActive}
              onClick={() => toggleQuickFilter(filter.key)}
            >
              {filter.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
