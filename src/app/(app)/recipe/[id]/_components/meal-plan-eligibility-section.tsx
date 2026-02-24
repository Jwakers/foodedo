"use client";

import { CalendarCheck, CalendarX } from "lucide-react";
import { Recipe } from "./recipe-client";

interface MealPlanEligibilitySectionProps {
  recipe: Recipe;
}

export function MealPlanEligibilitySection({ recipe }: MealPlanEligibilitySectionProps) {
  if (!recipe) return null;
  const eligible = recipe.isGeneratorEligible === true;

  return (
    <div className="flex items-start gap-2 text-sm shrink-0">
      {eligible ? (
        <CalendarCheck className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
      ) : (
        <CalendarX className="size-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden />
      )}
      <div className="min-w-0">
        <p className="text-muted-foreground">
          {eligible
            ? "Recipe included in meal plan generation"
            : "Recipe not included in meal plan generation"}
        </p>
        {!eligible && (
          <p className="text-xs text-muted-foreground/80 mt-0.5">
            Edit recipe to add primary protein and complexity.
          </p>
        )}
      </div>
    </div>
  );
}
