"use client";

import {
  enhanceRecipeWithAI,
  type EnhancedRecipePayload,
} from "@/app/(app)/actions/enhance-recipe";
import { ROUTES } from "@/app/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import { useMutation, useQuery } from "convex/react";
import { ChefHat, Clock, Loader2, Search, ShieldAlert, Sparkles, Users } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Recipe = NonNullable<FunctionReturnType<typeof api.recipes.getRecipe>>;
type SystemRecipe = FunctionReturnType<typeof api.recipes.getSystemRecipes>[number];
type UserRecipe = FunctionReturnType<typeof api.recipes.getAllUserRecipes>[number];

type PickerRecipe = {
  _id: Id<"recipes">;
  title: string;
  description?: string | null;
  image: string | null;
  category: string;
  prepTime: number;
  cookTime?: number | null;
  serves: number;
  source: "discover" | "user";
};

function formatIngredient(ing: { name: string; amount?: number; unit?: string; preparation?: string }) {
  const parts = [ing.name];
  if (ing.amount != null) parts.unshift(String(ing.amount));
  if (ing.unit) parts.splice(parts.length - 1, 0, ing.unit);
  if (ing.preparation) parts.push(`(${ing.preparation})`);
  return parts.join(" ");
}

export function RecipeEnhanceClient() {
  const router = useRouter();
  const user = useQuery(api.users.current);
  const isSuperUser = user?.isSuperUser === true;

  const systemRecipes = useQuery(api.recipes.getSystemRecipes);
  const userRecipes = useQuery(api.recipes.getAllUserRecipes);

  const [selectedRecipeId, setSelectedRecipeId] = useState<Id<"recipes"> | null>(null);
  const [searchDiscover, setSearchDiscover] = useState("");
  const [searchMy, setSearchMy] = useState("");
  const [prompt, setPrompt] = useState("");
  const [enhanced, setEnhanced] = useState<EnhancedRecipePayload | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const updateRecipe = useMutation(api.recipes.updateRecipe);

  const recipe = useQuery(
    api.recipes.getRecipe,
    selectedRecipeId ? { recipeId: selectedRecipeId } : "skip",
  );

  useEffect(() => {
    if (user !== undefined && !user) {
      router.replace(ROUTES.DASHBOARD);
      return;
    }
    if (user && !user.isSuperUser) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [user, router]);

  const discoverList: PickerRecipe[] = useMemo(
    () =>
      (systemRecipes ?? []).map((r: SystemRecipe) => ({
        _id: r._id,
        title: r.title,
        description: r.description ?? null,
        image: r.image ?? null,
        category: r.category,
        prepTime: r.prepTime ?? 0,
        cookTime: r.cookTime,
        serves: r.serves ?? 1,
        source: "discover" as const,
      })),
    [systemRecipes],
  );

  const myList: PickerRecipe[] = useMemo(
    () =>
      (userRecipes ?? []).map((r: UserRecipe) => ({
        _id: r._id,
        title: r.title,
        description: r.description ?? null,
        image: r.image ?? null,
        category: r.category,
        prepTime: r.prepTime ?? 0,
        cookTime: r.cookTime,
        serves: r.serves ?? 1,
        source: "user" as const,
      })),
    [userRecipes],
  );

  const filteredDiscover = useMemo(() => {
    const q = searchDiscover.trim().toLowerCase();
    if (!q) return discoverList;
    return discoverList.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q),
    );
  }, [discoverList, searchDiscover]);

  const filteredMy = useMemo(() => {
    const q = searchMy.trim().toLowerCase();
    if (!q) return myList;
    return myList.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q),
    );
  }, [myList, searchMy]);

  const handleGenerate = useCallback(async () => {
    if (!recipe || !selectedRecipeId || !prompt.trim()) return;
    setIsGenerating(true);
    setEnhanced(null);
    try {
      const ingredientsForAction = (recipe.ingredients ?? []).map((ing) => ({
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit ?? undefined,
        preparation: ing.preparation ?? undefined,
      }));
      const methodForAction = (recipe.method ?? []).map((step) => ({
        title: step.title,
        description: step.description ?? undefined,
      }));
      const result = await enhanceRecipeWithAI({
        recipeId: selectedRecipeId,
        title: recipe.title,
        description: recipe.description ?? undefined,
        ingredients: ingredientsForAction,
        method: methodForAction,
        prompt: prompt.trim(),
      });
      if (result.success) {
        setEnhanced({
          ...(result.description != null && { description: result.description }),
          ingredients: result.ingredients,
          method: result.method,
        });
        toast.success("Recipe enhanced");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }, [recipe, selectedRecipeId, prompt]);

  const handleApply = useCallback(async () => {
    if (!enhanced || !selectedRecipeId) return;
    setIsApplying(true);
    try {
      await updateRecipe({
        recipeId: selectedRecipeId,
        ...(enhanced.description != null && { description: enhanced.description }),
        ingredients: enhanced.ingredients.map((ing) => ({
          name: ing.name,
          ...(ing.amount != null && { amount: ing.amount }),
          ...(ing.unit != null && { unit: ing.unit }),
          ...(ing.preparation != null && { preparation: ing.preparation }),
        })) as Parameters<typeof updateRecipe>[0]["ingredients"],
        method: enhanced.method.map((step) => ({
          title: step.title,
          ...(step.description != null && { description: step.description }),
        })) as Parameters<typeof updateRecipe>[0]["method"],
      });
      toast.success("Recipe updated");
      setEnhanced(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to apply changes");
    } finally {
      setIsApplying(false);
    }
  }, [enhanced, selectedRecipeId, updateRecipe]);

  if (user === undefined) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <Card>
          <CardContent className="flex items-center gap-3 p-6 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading…
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isSuperUser) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-destructive" />
              Access denied
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            This page is only available to super users.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-5" />
            Recipe enhancer
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Pick a recipe, describe how you want it improved, then generate and
            apply enhanced description, ingredients, and method. Images are not changed.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="discover">
            <TabsList>
              <TabsTrigger value="discover">Discover</TabsTrigger>
              <TabsTrigger value="my">My recipes</TabsTrigger>
            </TabsList>
            <TabsContent value="discover" className="mt-4">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search…"
                  value={searchDiscover}
                  onChange={(e) => setSearchDiscover(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-2">
                {systemRecipes === undefined ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Loading…
                  </div>
                ) : filteredDiscover.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    {discoverList.length === 0
                      ? "No Discover recipes."
                      : "No matches."}
                  </p>
                ) : (
                  filteredDiscover.map((r) => (
                    <PickerRow
                      key={r._id}
                      recipe={r}
                      isSelected={selectedRecipeId === r._id}
                      onSelect={() => {
                        setSelectedRecipeId(r._id);
                        setEnhanced(null);
                      }}
                    />
                  ))
                )}
              </div>
            </TabsContent>
            <TabsContent value="my" className="mt-4">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search…"
                  value={searchMy}
                  onChange={(e) => setSearchMy(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-2">
                {userRecipes === undefined ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Loading…
                  </div>
                ) : filteredMy.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    {myList.length === 0 ? "No recipes." : "No matches."}
                  </p>
                ) : (
                  filteredMy.map((r) => (
                    <PickerRow
                      key={r._id}
                      recipe={r}
                      isSelected={selectedRecipeId === r._id}
                      onSelect={() => {
                        setSelectedRecipeId(r._id);
                        setEnhanced(null);
                      }}
                    />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>

          {recipe && (
            <>
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-sm font-medium">Selected: {recipe.title}</p>
                <p className="text-xs text-muted-foreground">
                  {recipe.source === "system" ? "Discover" : "My recipe"} ·{" "}
                  {(recipe.prepTime ?? 0) + (recipe.cookTime ?? 0)} min · Serves{" "}
                  {recipe.serves}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prompt">Enhancement prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="e.g. Clarify when to add salt; improve the description to mention resting time; add a note about resting the dough; make step 3 more precise."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-24"
                />
              </div>
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  "Generate enhanced recipe"
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {recipe && enhanced && (
        <Card>
          <CardHeader>
            <CardTitle>Before / After</CardTitle>
            <p className="text-sm text-muted-foreground">
              Review the changes, then click Apply to update the recipe.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Current
                </h3>
                <div className="rounded-md border p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Description
                  </p>
                  <p className="mb-3 text-sm text-muted-foreground">
                    {recipe.description?.trim() || "(none)"}
                  </p>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Ingredients
                  </p>
                  <ul className="list-inside list-disc space-y-1 text-sm">
                    {(recipe.ingredients ?? []).map((ing, i) => (
                      <li key={i}>
                        {formatIngredient({
                          name: ing.name,
                          amount: ing.amount,
                          unit: ing.unit ?? undefined,
                          preparation: ing.preparation ?? undefined,
                        })}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs font-medium text-muted-foreground">
                    Method
                  </p>
                  <ol className="mt-1 list-decimal space-y-2 pl-4 text-sm">
                    {(recipe.method ?? []).map((step, i) => (
                      <li key={i}>
                        <span className="font-medium">{step.title}</span>
                        {step.description && (
                          <p className="mt-0.5 text-muted-foreground">
                            {step.description}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Enhanced
                </h3>
                <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Description
                  </p>
                  <p className="mb-3 text-sm text-muted-foreground">
                    {enhanced.description?.trim() || "(none)"}
                  </p>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Ingredients
                  </p>
                  <ul className="list-inside list-disc space-y-1 text-sm">
                    {enhanced.ingredients.map((ing, i) => (
                      <li key={i}>{formatIngredient(ing)}</li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs font-medium text-muted-foreground">
                    Method
                  </p>
                  <ol className="mt-1 list-decimal space-y-2 pl-4 text-sm">
                    {enhanced.method.map((step, i) => (
                      <li key={i}>
                        <span className="font-medium">{step.title}</span>
                        {step.description && (
                          <p className="mt-0.5 text-muted-foreground">
                            {step.description}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={handleApply} disabled={isApplying}>
                {isApplying ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Applying…
                  </>
                ) : (
                  "Apply to recipe"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PickerRow({
  recipe,
  isSelected,
  onSelect,
}: {
  recipe: PickerRecipe;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const totalTime = recipe.prepTime + (recipe.cookTime ?? 0);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected && "ring-2 ring-primary",
      )}
    >
      <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
        {recipe.image ? (
          <Image
            src={recipe.image}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ChefHat className="size-6 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">{recipe.title}</p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="capitalize">{recipe.category}</span>
          {totalTime > 0 && (
            <span className="flex items-center gap-0.5">
              <Clock className="size-3" />
              {totalTime} min
            </span>
          )}
          <span className="flex items-center gap-0.5">
            <Users className="size-3" />
            {recipe.serves}
          </span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
            {recipe.source === "discover" ? "Discover" : "My"}
          </span>
        </div>
      </div>
    </button>
  );
}
