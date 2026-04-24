"use client";

import { PremiumFeatureNotice } from "@/components/premium-feature-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import {
  BETA_FREE_INCLUDES_PREMIUM_FEATURES,
  PRIMARY_PROTEINS,
  USER_PREFERENCE_ALLERGY_PHRASE_MAX_LENGTH,
  USER_PREFERENCE_ALLERGY_TARGETS_MAX,
} from "convex/lib/constants";
import { useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  FishOff,
  Loader2,
  ShieldAlert,
  UserCog,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

function normalisePhrase(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

const proteinOptions = PRIMARY_PROTEINS.filter(
  (option) => option !== "other" && option !== "none",
);

export default function PreferencesPage() {
  const currentUser = useQuery(api.users.current);
  const preferences = useQuery(api.users.getMyPreferences);
  const savePreferences = useMutation(api.users.updateMyPreferences);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [allergyIngredientIds, setAllergyIngredientIds] = useState<
    Id<"ingredients">[]
  >([]);
  const [allergyPhrases, setAllergyPhrases] = useState<string[]>([]);
  const [excludedPrimaryProteins, setExcludedPrimaryProteins] = useState<
    string[]
  >([]);
  const [isSaving, setIsSaving] = useState(false);
  const initializedUserIdRef = useRef<string | null>(null);

  const canUsePremiumFeatures = useMemo(() => {
    const tier = currentUser?.subscriptionTier ?? "free_user";
    if (tier === "pro_user") return true;
    if (tier === "free_user") return BETA_FREE_INCLUDES_PREMIUM_FEATURES;
    return false;
  }, [currentUser?.subscriptionTier]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!preferences) return;
    const currentUserId = currentUser?._id ?? null;
    if (initializedUserIdRef.current === currentUserId) return;
    setAllergyIngredientIds(preferences.allergyIngredientIds ?? []);
    setAllergyPhrases(preferences.allergyPhrases ?? []);
    setExcludedPrimaryProteins(preferences.excludedPrimaryProteins ?? []);
    initializedUserIdRef.current = currentUserId;
  }, [preferences, currentUser?._id]);

  const searchResults = useQuery(
    api.ingredients.search,
    canUsePremiumFeatures && debouncedQuery.length >= 2
      ? { q: debouncedQuery, limit: 20 }
      : "skip",
  );
  const selectedIngredientDocs = useQuery(
    api.ingredients.getByIds,
    allergyIngredientIds.length > 0 ? { ids: allergyIngredientIds } : "skip",
  );

  const ingredientLabels = useMemo(() => {
    const labels = new Map<string, string>();
    if (!selectedIngredientDocs) return labels;
    for (const ingredient of Object.values(selectedIngredientDocs)) {
      labels.set(
        ingredient._id,
        ingredient.displayName?.trim() || ingredient.name || "Ingredient",
      );
    }
    return labels;
  }, [selectedIngredientDocs]);

  const toggleProtein = (protein: string) => {
    setExcludedPrimaryProteins((prev) => {
      if (prev.includes(protein)) return prev.filter((p) => p !== protein);
      return [...prev, protein];
    });
  };

  const allergyTargetCount = allergyIngredientIds.length + allergyPhrases.length;

  const addAllergyPhrase = () => {
    const phrase = normalisePhrase(searchQuery);
    if (!phrase) return;
    if (phrase.length > USER_PREFERENCE_ALLERGY_PHRASE_MAX_LENGTH) return;
    if (allergyTargetCount >= USER_PREFERENCE_ALLERGY_TARGETS_MAX) return;
    if (allergyPhrases.includes(phrase)) return;
    setAllergyPhrases((prev) => [...prev, phrase]);
    setSearchQuery("");
    setDebouncedQuery("");
  };

  const canAddCustomPhrase = useMemo(() => {
    const phrase = normalisePhrase(searchQuery);
    if (!phrase) return false;
    if (phrase.length > USER_PREFERENCE_ALLERGY_PHRASE_MAX_LENGTH) return false;
    if (allergyTargetCount >= USER_PREFERENCE_ALLERGY_TARGETS_MAX) return false;
    return !allergyPhrases.includes(phrase);
  }, [allergyPhrases, searchQuery, allergyTargetCount]);

  const addAllergyIngredient = (ingredientId: Id<"ingredients">) => {
    if (allergyTargetCount >= USER_PREFERENCE_ALLERGY_TARGETS_MAX) return;
    if (allergyIngredientIds.includes(ingredientId)) return;
    setAllergyIngredientIds((prev) => [...prev, ingredientId]);
    setSearchQuery("");
    setDebouncedQuery("");
  };

  const handleSave = async () => {
    if (!canUsePremiumFeatures) return;
    setIsSaving(true);
    try {
      await savePreferences({
        allergyIngredientIds,
        allergyPhrases,
        excludedPrimaryProteins,
      });
      toast.success("Preferences saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const hasAnyAllergyPreference =
    allergyIngredientIds.length > 0 || allergyPhrases.length > 0;

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <UserCog className="size-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          This is the start of your settings hub. Configure your meal-planning
          preferences now, with account and profile settings coming next.
        </p>
      </div>

      <div className="mb-6 grid gap-2 sm:grid-cols-3">
        <Badge className="justify-center py-2">Preferences</Badge>
        <Badge variant="outline" className="justify-center py-2">
          Account (soon)
        </Badge>
        <Badge variant="outline" className="justify-center py-2">
          Notifications (soon)
        </Badge>
      </div>

      {!canUsePremiumFeatures ? (
        <PremiumFeatureNotice
          title="Pro feature"
          description="Preference-based generation is available on Pro."
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] mt-6">
        <aside className="hidden lg:block">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-base">On this page</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <a
                href="#allergies"
                className="block text-muted-foreground hover:text-foreground"
              >
                Allergies & intolerances
              </a>
              <a
                href="#proteins"
                className="block text-muted-foreground hover:text-foreground"
              >
                Protein preferences
              </a>
            </CardContent>
          </Card>
        </aside>

        <div className="space-y-6">
          <Card id="allergies">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="size-5 text-primary" />
                Allergies & intolerances
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add allergy items to block recipes for this profile.
              </p>
              <div className="rounded-md border border-amber-300/60 bg-amber-50/70 p-3 text-sm text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                  <p>
                    We do our best to filter allergens, but always double-check
                    recipes before cooking. Imported recipes can be edited to
                    suit your needs.
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  !canUsePremiumFeatures && "pointer-events-none opacity-60",
                )}
              >
                <Label htmlFor="allergy-search">Search allergy items</Label>
                <Input
                  id="allergy-search"
                  disabled={!canUsePremiumFeatures}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return;
                    if (!canAddCustomPhrase) return;
                    event.preventDefault();
                    addAllergyPhrase();
                  }}
                  placeholder="e.g. peanut, prawns, sesame"
                  className="mt-2"
                />
                {debouncedQuery.length >= 2 &&
                searchResults &&
                searchResults.length > 0 ? (
                  <div className="mt-2 max-h-44 overflow-auto rounded-md border">
                    {canAddCustomPhrase ? (
                      <button
                        type="button"
                        disabled={!canUsePremiumFeatures}
                        className="w-full border-b px-3 py-2 text-left text-sm font-medium text-primary hover:bg-accent"
                        onClick={addAllergyPhrase}
                      >
                        Add “{searchQuery.trim()}” as allergy
                      </button>
                    ) : null}
                    {searchResults.map((row) => (
                      <button
                        key={row._id}
                        type="button"
                        disabled={!canUsePremiumFeatures}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                        onClick={() => addAllergyIngredient(row._id)}
                      >
                        {row.displayName || row.name}
                      </button>
                    ))}
                  </div>
                ) : null}
                {debouncedQuery.length >= 2 &&
                (!searchResults || searchResults.length === 0) &&
                canAddCustomPhrase ? (
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={!canUsePremiumFeatures}
                      onClick={addAllergyPhrase}
                    >
                      Add “{searchQuery.trim()}” as allergy
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {allergyIngredientIds.map((id) => (
                  <Badge key={id} variant="outline" className="gap-1 pr-1">
                    {ingredientLabels.get(id) ?? "Ingredient"}
                    <button
                      type="button"
                      onClick={() =>
                        setAllergyIngredientIds((prev) =>
                          prev.filter((x) => x !== id),
                        )
                      }
                      aria-label={`Remove ${ingredientLabels.get(id) ?? "ingredient"}`}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
                {allergyPhrases.map((phrase) => (
                  <Badge
                    key={phrase}
                    variant="outline"
                    className="gap-1 pr-1 border-dashed"
                  >
                    {phrase}
                    <button
                      type="button"
                      onClick={() =>
                        setAllergyPhrases((prev) =>
                          prev.filter((x) => x !== phrase),
                        )
                      }
                      aria-label={`Remove ${phrase}`}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
                {!hasAnyAllergyPreference ? (
                  <p className="text-sm text-muted-foreground">
                    No restrictions set.
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card id="proteins">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FishOff className="size-5 text-primary" />
                Protein preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Turn off protein types you do not want to see in generated
                plans.
              </p>
              <div
                className={cn(
                  "flex flex-wrap gap-2",
                  !canUsePremiumFeatures && "pointer-events-none opacity-60",
                )}
              >
                {proteinOptions.map((protein) => {
                  const active = excludedPrimaryProteins.includes(protein);
                  return (
                    <button
                      key={protein}
                      type="button"
                      disabled={!canUsePremiumFeatures}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition-colors",
                        active
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground",
                      )}
                      onClick={() => toggleProtein(protein)}
                    >
                      {active ? `No ${protein}` : protein}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Saved preferences apply when your profile is selected during
                  meal plan generation.
                </p>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={!canUsePremiumFeatures || isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="size-4 mr-2 animate-spin" />
                  ) : null}
                  Save preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
