"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { api } from "convex/_generated/api";
import {
  isRecipeCategoryUsedByMealPlanGenerator,
  recipeHasMealPlanGeneratorMetadata,
} from "convex/lib/constants";
import { useMutation } from "convex/react";
import { Ban, CalendarCheck, CalendarX, Info, Minus } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Recipe } from "./recipe-client";

interface MealPlanEligibilitySectionProps {
  recipe: NonNullable<Recipe>;
  /** Owner or super user: can toggle “include in generated meal plans”. */
  canManageMealPlanToggle: boolean;
  className?: string;
}

export function MealPlanEligibilitySection({
  recipe,
  canManageMealPlanToggle,
  className,
}: MealPlanEligibilitySectionProps) {
  const updateRecipe = useMutation(api.recipes.updateRecipe);
  const [pending, setPending] = useState(false);

  const excluded = recipe.excludeFromMealPlanGenerator === true;
  const [included, setIncluded] = useState(!excluded);

  useEffect(() => {
    setIncluded(!excluded);
  }, [excluded]);
  const categoryOk = isRecipeCategoryUsedByMealPlanGenerator(recipe.category);
  const hasGeneratorMeta = recipeHasMealPlanGeneratorMetadata(recipe);

  const handleIncludeChange = async (include: boolean) => {
    setIncluded(include);
    setPending(true);
    try {
      await updateRecipe({
        recipeId: recipe._id,
        excludeFromMealPlanGenerator: !include,
      });
      toast.success(
        include ? "Will be suggested in meal plans" : "Won’t be suggested",
      );
    } catch {
      setIncluded(!include);
      toast.error("Couldn’t update setting.");
    } finally {
      setPending(false);
    }
  };

  /** Opt-out only when the recipe can actually appear in the generator pool. */
  const showToggle = canManageMealPlanToggle && categoryOk && hasGeneratorMeta;

  let icon: ReactNode;
  let statusLine: string;
  let statusTitle: string;

  if (!categoryOk) {
    icon = (
      <Minus
        className="size-3 shrink-0 text-muted-foreground/55"
        aria-hidden
        strokeWidth={2.5}
      />
    );
    statusLine = "Not used by weekly planner";
    statusTitle =
      "Only breakfast, lunch, dinner, and main meals are auto-picked. You can still add this recipe to a plan manually.";
  } else if (!hasGeneratorMeta) {
    icon = (
      <CalendarX
        className="size-3.5 shrink-0 text-muted-foreground"
        aria-hidden
      />
    );
    statusLine = "Not eligible yet";
    statusTitle =
      "The weekly planner needs both primary protein and complexity set in Recipe details.";
  } else if (excluded) {
    icon = (
      <Ban
        className="size-3.5 shrink-0 text-amber-600 dark:text-amber-500"
        aria-hidden
      />
    );
    statusLine = "Excluded from generator";
    statusTitle =
      "Turn Include on to allow the weekly planner to suggest this recipe.";
  } else {
    icon = (
      <CalendarCheck className="size-3.5 shrink-0 text-primary" aria-hidden />
    );
    statusLine = "Eligible for meal plans";
    statusTitle = "The weekly generator can pick this recipe.";
  }

  const switchId = "meal-plan-include-switch";

  return (
    <div
      className={cn(
        "flex flex-col gap-2 pt-0.5 md:items-end md:text-right",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-0.5 text-xs text-muted-foreground md:justify-end",
          excluded &&
            hasGeneratorMeta &&
            categoryOk &&
            "text-amber-700/90 dark:text-amber-400/90",
          !excluded && categoryOk && hasGeneratorMeta && "text-foreground/80",
          !categoryOk && "text-muted-foreground/70",
        )}
      >
        <span className="flex items-center gap-1.5" title={statusTitle}>
          {icon}
          <span>{statusLine}</span>
        </span>
        {!categoryOk && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
                aria-label="More about weekly planner and this recipe category"
              >
                <Info className="size-3.5" aria-hidden />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="text-sm space-y-2">
              <p>
                Some recipes categories are not eligible for the meal plan
                generation.
              </p>
              <p>
                But you can always add them to your meal plan manually.
              </p>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {categoryOk && !hasGeneratorMeta && (
        <p
          className="text-[11px] leading-snug text-muted-foreground md:max-w-52 md:ml-auto"
          title={statusTitle}
        >
          In Recipe details, set{" "}
          <span className="text-foreground/85">primary protein</span> and{" "}
          <span className="text-foreground/85">complexity</span>. To be eligible
          for the meal plan generation.
        </p>
      )}

      {showToggle && (
        <div className="flex items-center gap-2 md:justify-end">
          <Label
            htmlFor={switchId}
            className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap"
          >
            Suggest in plans
          </Label>
          <Switch
            id={switchId}
            checked={included}
            disabled={pending}
            onCheckedChange={handleIncludeChange}
            aria-label="Suggest this recipe in generated meal plans"
          />
        </div>
      )}
    </div>
  );
}
