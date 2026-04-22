"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PremiumFeatureNotice } from "@/components/premium-feature-notice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, titleCase } from "@/lib/utils";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { LEFTOVER_INGREDIENTS_MAX } from "convex/lib/constants";
import { useQuery } from "convex/react";
import { Loader2, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function normalisePhrase(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export type LeftoverPickerSelection = {
  ingredientIds: Id<"ingredients">[];
  phrases: string[];
};

export type LeftoverIngredientsPickerProps = {
  selectedIds: Id<"ingredients">[];
  selectedPhrases: string[];
  onSelectionChange: (next: LeftoverPickerSelection) => void;
  /** When false, show premium overlay and disable edits. */
  canUseFeatures: boolean;
  description?: string;
};

export function LeftoverIngredientsPicker({
  selectedIds,
  selectedPhrases,
  onSelectionChange,
  canUseFeatures,
  description = "Prioritise recipes that include foods you want to finish (e.g. meat from the freezer).",
}: LeftoverIngredientsPickerProps) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const searchResults = useQuery(
    api.ingredients.search,
    canUseFeatures && debounced.length >= 2
      ? { q: debounced, limit: 20 }
      : "skip",
  );

  const selectedDocs = useQuery(
    api.ingredients.getByIds,
    selectedIds.length > 0 ? { ids: selectedIds } : "skip",
  );

  const idToLabel = useMemo(() => {
    const m = new Map<string, string>();
    if (selectedDocs) {
      for (const ing of Object.values(selectedDocs)) {
        m.set(
          ing._id,
          ing.displayName && ing.displayName !== ing.name
            ? `${ing.name} (${ing.displayName})`
            : ing.name,
        );
      }
    }
    return m;
  }, [selectedDocs]);

  const totalSelected = selectedIds.length + selectedPhrases.length;

  const addId = (id: Id<"ingredients">) => {
    if (!canUseFeatures) return;
    if (selectedIds.includes(id)) return;
    if (totalSelected >= LEFTOVER_INGREDIENTS_MAX) return;
    onSelectionChange({
      ingredientIds: [...selectedIds, id],
      phrases: selectedPhrases,
    });
    setQ("");
    setDebounced("");
  };

  const addPhrase = (raw: string) => {
    if (!canUseFeatures) return;
    const n = normalisePhrase(raw);
    if (!n) return;
    if (selectedPhrases.some((p) => normalisePhrase(p) === n)) return;
    if (totalSelected >= LEFTOVER_INGREDIENTS_MAX) return;
    onSelectionChange({
      ingredientIds: selectedIds,
      phrases: [...selectedPhrases, n],
    });
    setQ("");
    setDebounced("");
  };

  const removeId = (id: Id<"ingredients">) => {
    if (!canUseFeatures) return;
    onSelectionChange({
      ingredientIds: selectedIds.filter((x) => x !== id),
      phrases: selectedPhrases,
    });
  };

  const removePhrase = (phrase: string) => {
    if (!canUseFeatures) return;
    onSelectionChange({
      ingredientIds: selectedIds,
      phrases: selectedPhrases.filter((p) => p !== phrase),
    });
  };

  const locked = !canUseFeatures;
  const canAddCustom =
    !locked &&
    debounced.length >= 2 &&
    normalisePhrase(debounced).length > 0 &&
    totalSelected < LEFTOVER_INGREDIENTS_MAX;

  return (
    <Card className="relative border-border/80 bg-muted/20">
      <CardContent className="space-y-2 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Sparkles className="size-4 shrink-0 text-primary" aria-hidden />
          <Label className="text-base font-semibold text-foreground">
            Use up ingredients
          </Label>
          <Badge
            variant="secondary"
            className="text-[10px] font-semibold uppercase"
          >
            Pro
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
        {locked ? (
          <PremiumFeatureNotice
            title="Use up ingredients is premium"
            description="You can preview this feature now."
          />
        ) : null}

        <div
          className={cn("space-y-2", locked && "pointer-events-none opacity-60")}
        >
        <div className="relative max-w-md">
          <Input
            placeholder={
              locked ? "Upgrade to use this filter" : "Search ingredients…"
            }
            value={q}
            onChange={(e) => setQ(e.target.value)}
            disabled={locked}
            className="pr-10"
            aria-label="Search ingredients to use up"
          />
          {searchResults === undefined && debounced.length >= 2 && !locked && (
            <Loader2
              className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
              aria-hidden
            />
          )}
        </div>
        {debounced.length >= 2 &&
          searchResults &&
          searchResults.length > 0 &&
          !locked && (
            <ul className="max-h-48 overflow-auto rounded-md border bg-background text-sm shadow-sm">
              {searchResults.map((row) => {
                const isSelected = selectedIds.includes(row._id);
                const atCapacity = totalSelected >= LEFTOVER_INGREDIENTS_MAX;
                const isDisabled = isSelected || atCapacity;
                const labelText =
                  row.displayName && row.displayName !== row.name
                    ? `${row.name} (${row.displayName})`
                    : row.name;
                const ariaLabel = isSelected
                  ? `${row.name} — already selected`
                  : atCapacity
                    ? `Cannot add ${row.name}: selection limit reached`
                    : `Add ${row.name}`;
                const buttonClass = cn(
                  "flex w-full px-3 py-2 text-left",
                  isDisabled
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-accent",
                );
                return (
                  <li key={row._id}>
                    {isSelected ? (
                      <button
                        type="button"
                        aria-pressed="true"
                        disabled={isDisabled}
                        aria-label={ariaLabel}
                        className={buttonClass}
                        onClick={() => addId(row._id)}
                      >
                        {labelText}
                      </button>
                    ) : (
                      <button
                        type="button"
                        aria-pressed="false"
                        disabled={isDisabled}
                        aria-label={ariaLabel}
                        className={buttonClass}
                        onClick={() => addId(row._id)}
                      >
                        {labelText}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        {canAddCustom && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="text-xs"
              onClick={() => addPhrase(debounced)}
            >
              Add custom: “{debounced.trim()}”
            </Button>
            {searchResults &&
              searchResults.length === 0 &&
              debounced.length >= 2 && (
                <span className="text-xs text-muted-foreground">
                  No catalog match — use custom to match recipe text.
                </span>
              )}
          </div>
        )}
        {debounced.length >= 2 &&
          searchResults &&
          searchResults.length === 0 &&
          !canAddCustom &&
          !locked && (
            <p className="text-xs text-muted-foreground">
              No ingredients found.
            </p>
          )}

        {totalSelected > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedIds.map((id) => (
              <Badge
                key={id}
                variant="outline"
                className="gap-1 pr-1 font-normal"
              >
                {idToLabel.get(id as string) ?? "…"}
                {!locked && (
                  <button
                    type="button"
                    className="rounded-sm p-0.5 hover:bg-muted"
                    onClick={() => removeId(id)}
                    aria-label={`Remove ${idToLabel.get(id as string) ?? "ingredient"}`}
                  >
                    <X className="size-3" />
                  </button>
                )}
              </Badge>
            ))}
            {selectedPhrases.map((phrase) => (
              <Badge
                key={phrase}
                variant="outline"
                className="gap-1 border-dashed pr-1 font-normal"
              >
                {titleCase(phrase)}
                <span className="sr-only">(custom)</span>
                {!locked && (
                  <button
                    type="button"
                    className="rounded-sm p-0.5 hover:bg-muted"
                    onClick={() => removePhrase(phrase)}
                    aria-label={`Remove ${phrase}`}
                  >
                    <X className="size-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        )}
        </div>
      </CardContent>
    </Card>
  );
}
