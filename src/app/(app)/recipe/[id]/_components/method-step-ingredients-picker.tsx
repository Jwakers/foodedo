"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { RecipeEditFormData } from "@/lib/schemas/recipe";

type Option = { id: string; label: string };

interface MethodStepIngredientsPickerProps {
  stepIndex: number;
  form: UseFormReturn<RecipeEditFormData>;
  availableOptions: Option[];
  suggestedRefs: string[];
}

export function MethodStepIngredientsPicker({
  stepIndex,
  form,
  availableOptions,
  suggestedRefs,
}: MethodStepIngredientsPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const availableIds = useMemo(
    () => new Set(availableOptions.map((o) => o.id)),
    [availableOptions],
  );
  const rawSelected = form.watch(`method.${stepIndex}.ingredientRefs`) ?? [];
  const selectedRefs = useMemo(
    () => rawSelected.filter((id) => availableIds.has(id)),
    [rawSelected, availableIds],
  );

  const hasStaleRefs = rawSelected.some((id) => !availableIds.has(id));
  useEffect(() => {
    if (hasStaleRefs) {
      form.setValue(`method.${stepIndex}.ingredientRefs`, selectedRefs, {
        shouldDirty: true,
      });
    }
  }, [hasStaleRefs, selectedRefs, form, stepIndex]);

  const markUserControlled = () => {
    form.setValue(`method.${stepIndex}.ingredientRefsSource`, "user", {
      shouldDirty: true,
    });
  };

  const setSelectedRefs = (refs: string[]) => {
    const pruned = refs.filter((id) => availableIds.has(id));
    markUserControlled();
    form.setValue(`method.${stepIndex}.ingredientRefs`, pruned, {
      shouldDirty: true,
    });
  };

  const resetToAutoSuggested = () => {
    form.setValue(`method.${stepIndex}.ingredientRefsSource`, "auto", {
      shouldDirty: true,
    });
    form.setValue(`method.${stepIndex}.ingredientRefs`, [], {
      shouldDirty: true,
    });
  };

  const suggestedOptions = availableOptions.filter((o) =>
    suggestedRefs.includes(o.id),
  );
  const otherOptions = availableOptions.filter(
    (o) => !suggestedRefs.includes(o.id),
  );

  const toggleRef = (id: string) => {
    if (selectedRefs.includes(id)) {
      setSelectedRefs(selectedRefs.filter((x) => x !== id));
    } else {
      setSelectedRefs([...selectedRefs, id]);
    }
  };

  const addAllSuggested = () => {
    const next = new Set(selectedRefs);
    suggestedRefs
      .filter((r) => availableIds.has(r))
      .forEach((r) => next.add(r));
    setSelectedRefs([...next]);
  };

  if (availableOptions.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => setIsOpen((o) => !o)}
        >
        {isOpen ? (
          <ChevronDown className="size-4" />
        ) : (
          <ChevronRight className="size-4" />
        )}
        <span className="text-xs font-medium">
          Ingredients for this step
          {selectedRefs.length > 0 && ` (${selectedRefs.length})`}
        </span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={resetToAutoSuggested}
        >
          Reset to suggested
        </Button>
      </div>
      {isOpen && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-4">
          {suggestedOptions.length > 0 && (
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Suggested
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={addAllSuggested}
                >
                  Add all
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {suggestedOptions.map((opt) => (
                  <IngredientChip
                    key={opt.id}
                    label={opt.label}
                    checked={selectedRefs.includes(opt.id)}
                    onToggle={() => toggleRef(opt.id)}
                  />
                ))}
              </div>
            </div>
          )}
          {otherOptions.length > 0 && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Other ingredients
              </span>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {otherOptions.map((opt) => (
                  <IngredientChip
                    key={opt.id}
                    label={opt.label}
                    checked={selectedRefs.includes(opt.id)}
                    onToggle={() => toggleRef(opt.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IngredientChip({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors",
        "hover:bg-muted/50",
        checked
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background",
      )}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={() => onToggle()}
        className="pointer-events-none shrink-0"
      />
      <span className="truncate capitalize">{label}</span>
    </label>
  );
}
