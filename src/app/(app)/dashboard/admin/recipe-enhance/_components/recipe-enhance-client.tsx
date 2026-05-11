"use client";

import {
  enhanceRecipeWithAI,
  type EnhancedRecipePayload,
} from "@/app/(app)/actions/enhance-recipe";
import {
  generateSystemRecipeWithAI,
  type GeneratedSystemRecipePayload,
} from "@/app/(app)/actions/generate-system-recipe";
import { generateRecipeImageWithAI } from "@/app/(app)/actions/generate-recipe-image";
import { ROUTES } from "@/app/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  validatePreparation,
  validateUnit,
} from "@/lib/utils/recipe-validation";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import {
  ChefHat,
  Clock,
  Loader2,
  Search,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  COMPLEXITY_TIERS,
  CUISINES,
  PRIMARY_PROTEINS,
  RECIPE_CATEGORIES,
} from "convex/lib/constants";

type Recipe = NonNullable<FunctionReturnType<typeof api.recipes.getRecipe>>;
type SystemRecipe = FunctionReturnType<
  typeof api.recipes.getSystemRecipes
>[number];
type UserRecipe = FunctionReturnType<
  typeof api.recipes.getAllUserRecipes
>[number];

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

function formatIngredient(ing: {
  name: string;
  amount?: number;
  unit?: string;
  preparation?: string | null;
}) {
  const parts = [ing.name];
  if (ing.amount != null) parts.unshift(String(ing.amount));
  if (ing.unit) parts.splice(parts.length - 1, 0, ing.unit);
  if (ing.preparation) parts.push(`(${ing.preparation})`);
  return parts.join(" ");
}

type GeneratedRecipeImage = {
  base64: string;
  mediaType: string;
  promptUsed: string;
};

export function RecipeEnhanceClient() {
  const router = useRouter();
  const user = useQuery(api.users.current);
  const isSuperUser = user?.isSuperUser === true;

  const systemRecipes = useQuery(api.recipes.getSystemRecipes);
  const userRecipes = useQuery(api.recipes.getAllUserRecipes);

  const [selectedRecipeId, setSelectedRecipeId] =
    useState<Id<"recipes"> | null>(null);
  const [searchDiscover, setSearchDiscover] = useState("");
  const [searchMy, setSearchMy] = useState("");
  const [prompt, setPrompt] = useState("");
  const [enhanced, setEnhanced] = useState<EnhancedRecipePayload | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [activePanel, setActivePanel] = useState<
    "enhancement" | "generator" | "image"
  >("enhancement");
  const [generatorGuidance, setGeneratorGuidance] = useState("");
  const [generatedSystemRecipe, setGeneratedSystemRecipe] =
    useState<GeneratedSystemRecipePayload | null>(null);
  const [isGeneratingSystemRecipe, setIsGeneratingSystemRecipe] = useState(false);
  const [isSavingSystemRecipe, setIsSavingSystemRecipe] = useState(false);

  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageBeforeUrl, setImageBeforeUrl] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] =
    useState<GeneratedRecipeImage | null>(null);
  const [isSavingImage, setIsSavingImage] = useState(false);

  const updateRecipe = useMutation(api.recipes.updateRecipe);
  const createSystemRecipe = useMutation(api.recipes.createSystemRecipe);
  const generateUploadUrl = useMutation(api.recipes.generateUploadUrl);
  const updateRecipeImage = useMutation(
    api.recipes.updateRecipeImageAndDeleteOld,
  );

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
        prepTime: recipe.prepTime ?? 0,
        cookTime: recipe.cookTime ?? null,
        ingredients: ingredientsForAction,
        method: methodForAction,
        prompt: prompt.trim(),
      });
      if (result.success) {
        setEnhanced({
          description: result.description,
          prepTime: result.prepTime,
          cookTime: result.cookTime,
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

  const handleGenerateSystemRecipe = useCallback(async () => {
    if (!generatorGuidance.trim()) return;
    setIsGeneratingSystemRecipe(true);
    try {
      const result = await generateSystemRecipeWithAI({
        guidance: generatorGuidance.trim(),
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setGeneratedSystemRecipe(result.recipe);
      toast.success("System recipe generated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate recipe",
      );
    } finally {
      setIsGeneratingSystemRecipe(false);
    }
  }, [generatorGuidance]);

  const handleSaveSystemRecipe = useCallback(async () => {
    if (!generatedSystemRecipe) return;
    setIsSavingSystemRecipe(true);
    try {
      const result = await createSystemRecipe({
        title: generatedSystemRecipe.title.trim(),
        description: generatedSystemRecipe.description,
        prepTime: Math.max(0, Math.round(generatedSystemRecipe.prepTime)),
        cookTime:
          generatedSystemRecipe.cookTime == null
            ? null
            : Math.max(0, Math.round(generatedSystemRecipe.cookTime)),
        serves: Math.max(1, Math.round(generatedSystemRecipe.serves)),
        category: generatedSystemRecipe.category,
        ingredients: generatedSystemRecipe.ingredients
          .filter((ingredient) => ingredient.name.trim().length > 0)
          .map((ingredient) => ({
            name: ingredient.name.trim(),
            ...(ingredient.amount != null && { amount: ingredient.amount }),
            ...(ingredient.unit != null && { unit: ingredient.unit }),
            ...(ingredient.preparation != null && {
              preparation: ingredient.preparation,
            }),
          })),
        method: generatedSystemRecipe.method
          .filter((step) => step.title.trim().length > 0)
          .map((step) => ({
            title: step.title.trim(),
            ...(step.description != null && { description: step.description }),
          })),
        nutrition: generatedSystemRecipe.nutrition,
        ...(generatedSystemRecipe.primaryProtein != null && {
          primaryProtein: generatedSystemRecipe.primaryProtein,
        }),
        ...(generatedSystemRecipe.complexityTier != null && {
          complexityTier: generatedSystemRecipe.complexityTier,
        }),
        ...(generatedSystemRecipe.cuisine != null && {
          cuisine: generatedSystemRecipe.cuisine,
        }),
      });
      setSelectedRecipeId(result.recipeId);
      setGeneratedSystemRecipe(null);
      setActivePanel("image");
      toast.success(
        "System recipe saved. You can now generate and save its image.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save recipe");
    } finally {
      setIsSavingSystemRecipe(false);
    }
  }, [generatedSystemRecipe, createSystemRecipe]);

  const handleApply = useCallback(async () => {
    if (!enhanced || !selectedRecipeId) return;
    setIsApplying(true);
    try {
      if (!recipe) return;

      const normaliseName = (s: string) =>
        s.trim().toLowerCase().replace(/\s+/g, " ");

      const currentIngredients = recipe.ingredients ?? [];
      const ingredientQueueByName = new Map<
        string,
        typeof currentIngredients
      >();

      for (const ing of currentIngredients) {
        const key = normaliseName(ing.name);
        const arr = ingredientQueueByName.get(key) ?? [];
        arr.push(ing);
        ingredientQueueByName.set(key, arr);
      }

      const mergedIngredients = enhanced.ingredients.map((ing) => {
        const key = normaliseName(ing.name);
        const queue = ingredientQueueByName.get(key) ?? [];
        const match = queue.length > 0 ? queue.shift() : undefined;
        ingredientQueueByName.set(key, queue);

        return {
          ...(match?.id != null && { id: match.id }),
          ...(match?.ingredientId != null && { ingredientId: match.ingredientId }),
          name: ing.name,
          ...(ing.amount != null && { amount: ing.amount }),
          ...(ing.unit != null && { unit: ing.unit }),
          ...(ing.preparation != null && { preparation: ing.preparation }),
        };
      });

      const validIngredientRowIds = new Set(
        mergedIngredients
          .map((i) => i.id)
          .filter((id): id is string => id != null && id.length > 0),
      );

      const currentMethod = recipe.method ?? [];
      const mergedMethod = enhanced.method.map((step, idx) => {
        const existingStep = currentMethod[idx];

        const filteredIngredientRefs = existingStep?.ingredientRefs?.filter(
          (ref) => validIngredientRowIds.has(ref),
        );

        const preservedSource =
          existingStep?.ingredientRefsSource === "user" ||
          existingStep?.ingredientRefsSource === "auto"
            ? existingStep.ingredientRefsSource
            : ("auto" as const);

        const hadStepRefsOrSource =
          existingStep != null &&
          (existingStep.ingredientRefs != null ||
            existingStep.ingredientRefsSource === "user" ||
            existingStep.ingredientRefsSource === "auto");

        return {
          title: step.title,
          ...(step.description != null && { description: step.description }),
          ...(existingStep?.image != null && { image: existingStep.image }),
          ...(hadStepRefsOrSource
            ? {
                ingredientRefs:
                  filteredIngredientRefs && filteredIngredientRefs.length > 0
                    ? filteredIngredientRefs
                    : undefined,
                ingredientRefsSource: preservedSource,
              }
            : {}),
        };
      });

      await updateRecipe({
        recipeId: selectedRecipeId,
        description: enhanced.description,
        prepTime: enhanced.prepTime,
        cookTime: enhanced.cookTime,
        ingredients: mergedIngredients,
        method: mergedMethod,
      });
      toast.success("Recipe updated");
      setImageBeforeUrl(null);
      setImagePreviewUrl(null);
      setGeneratedImage(null);
      setEnhanced(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to apply changes");
    } finally {
      setIsApplying(false);
    }
  }, [enhanced, recipe, selectedRecipeId, updateRecipe]);

  const handleRegenerateImage = useCallback(async () => {
    if (!recipe || !selectedRecipeId) return;
    if (enhanced) {
      toast.message("Apply the enhanced recipe first", {
        description: "Image regeneration uses the currently saved recipe.",
      });
      return;
    }

    setIsGeneratingImage(true);
    setImageBeforeUrl(recipe.image ?? null);
    setImagePreviewUrl(null);
    setGeneratedImage(null);

    try {
      const methodForAction = (recipe.method ?? []).map((step) => ({
        title: step.title,
        description: step.description ?? undefined,
      }));

      const res = await generateRecipeImageWithAI({
        title: recipe.title,
        description: recipe.description ?? null,
        method: methodForAction,
      });

      if (!res.success) {
        toast.error(res.error);
        return;
      }

      const previewUrl = `data:${res.mediaType};base64,${res.base64}`;
      setImagePreviewUrl(previewUrl);
      setGeneratedImage({
        base64: res.base64,
        mediaType: res.mediaType,
        promptUsed: res.promptUsed,
      });
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to regenerate image.",
      );
    } finally {
      setIsGeneratingImage(false);
    }
  }, [recipe, selectedRecipeId, enhanced]);

  const handleSaveImage = useCallback(async () => {
    if (!generatedImage || !selectedRecipeId) return;
    if (enhanced) {
      toast.message("Apply the enhanced recipe first", {
        description:
          "Finish applying ingredients/method before saving an image.",
      });
      return;
    }

    setIsSavingImage(true);
    try {
      const postUrl = await generateUploadUrl();

      const binaryString = atob(generatedImage.base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const uploadRes = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": generatedImage.mediaType },
        body: bytes,
      });

      if (!uploadRes.ok) {
        throw new Error(`Image upload failed (${uploadRes.status})`);
      }

      const uploadJson = (await uploadRes.json()) as {
        storageId?: Id<"_storage">;
      };
      const storageId = uploadJson.storageId;
      if (!storageId) {
        throw new Error("Upload failed: missing storageId");
      }

      await updateRecipeImage({
        recipeId: selectedRecipeId,
        storageId,
      });

      toast.success("Recipe image updated");
      setGeneratedImage(null);
      setImagePreviewUrl(null);
      setImageBeforeUrl(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save image.");
    } finally {
      setIsSavingImage(false);
    }
  }, [
    generatedImage,
    selectedRecipeId,
    enhanced,
    generateUploadUrl,
    updateRecipeImage,
  ]);

  const patchGeneratedRecipe = useCallback(
    (updater: (current: GeneratedSystemRecipePayload) => GeneratedSystemRecipePayload) => {
      setGeneratedSystemRecipe((current) => (current ? updater(current) : current));
    },
    [],
  );

  const setGeneratedIngredientField = useCallback(
    (
      index: number,
      field: "name" | "amount" | "unit" | "preparation",
      value: string,
    ) => {
      patchGeneratedRecipe((current) => {
        const ingredients = [...current.ingredients];
        const ingredient = ingredients[index];
        if (!ingredient) return current;
        if (field === "amount") {
          const nextAmount = value.trim().length === 0 ? undefined : Number(value);
          ingredients[index] = {
            ...ingredient,
            amount:
              nextAmount == null || Number.isNaN(nextAmount)
                ? undefined
                : nextAmount,
          };
        } else if (field === "preparation") {
          ingredients[index] = {
            ...ingredient,
            preparation: validatePreparation(value),
          };
        } else if (field === "unit") {
          ingredients[index] = {
            ...ingredient,
            unit: validateUnit(value),
          };
        } else {
          ingredients[index] = { ...ingredient, name: value };
        }
        return { ...current, ingredients };
      });
    },
    [patchGeneratedRecipe],
  );

  const setGeneratedMethodField = useCallback(
    (index: number, field: "title" | "description", value: string) => {
      patchGeneratedRecipe((current) => {
        const method = [...current.method];
        const step = method[index];
        if (!step) return current;
        method[index] =
          field === "title"
            ? { ...step, title: value }
            : { ...step, description: value };
        return { ...current, method };
      });
    },
    [patchGeneratedRecipe],
  );

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
            Recipe management
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enhance existing recipes or generate new system recipes. Image
            generation is always manual and only saved when you choose.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={activePanel === "enhancement" ? "default" : "secondary"}
              onClick={() => setActivePanel("enhancement")}
            >
              Enhance existing
            </Button>
            <Button
              type="button"
              variant={activePanel === "generator" ? "default" : "secondary"}
              onClick={() => setActivePanel("generator")}
            >
              Generate system
            </Button>
            <Button
              type="button"
              variant={activePanel === "image" ? "default" : "secondary"}
              onClick={() => setActivePanel("image")}
            >
              Image
            </Button>
          </div>

          {activePanel !== "generator" ? (
            <>
              <Tabs defaultValue="discover">
                <TabsList>
                  <TabsTrigger value="discover">Discover</TabsTrigger>
                  <TabsTrigger value="my">My recipes</TabsTrigger>
                </TabsList>
                <TabsContent value="discover" className="mt-4">
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="search-discover"
                      aria-label="Search Discover recipes"
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
                            setImageBeforeUrl(null);
                            setImagePreviewUrl(null);
                            setGeneratedImage(null);
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
                      id="search-my"
                      aria-label="Search My recipes"
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
                            setImageBeforeUrl(null);
                            setImagePreviewUrl(null);
                            setGeneratedImage(null);
                          }}
                        />
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {recipe && (
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-sm font-medium">Selected: {recipe.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {recipe.source === "system" ? "Discover" : "My recipe"} ·{" "}
                    {(recipe.prepTime ?? 0) + (recipe.cookTime ?? 0)} min ·
                    Serves {recipe.serves}
                  </p>
                </div>
              )}
            </>
          ) : null}

          {activePanel === "enhancement" ? (
            <div className="space-y-2">
              {recipe ? (
                <>
                  <Label htmlFor="prompt">Enhancement prompt</Label>
                  <Textarea
                    id="prompt"
                    placeholder="e.g. Clarify when to add salt; improve the description to mention resting time; add a note about resting the dough; make step 3 more precise."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-24"
                  />
                  <Button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isGenerating}
                    className="w-full sm:w-auto"
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
              ) : (
                <p className="text-sm text-muted-foreground">
                  Pick a recipe to enhance.
                </p>
              )}
            </div>
          ) : activePanel === "generator" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="system-recipe-guidance">Generation guidance</Label>
                <Textarea
                  id="system-recipe-guidance"
                  placeholder="Describe the meal you want to generate. Include cuisine, constraints, and serving preferences."
                  value={generatorGuidance}
                  onChange={(event) => setGeneratorGuidance(event.target.value)}
                  className="min-h-28"
                />
                <Button
                  type="button"
                  onClick={handleGenerateSystemRecipe}
                  disabled={!generatorGuidance.trim() || isGeneratingSystemRecipe}
                >
                  {isGeneratingSystemRecipe ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    "Generate system recipe"
                  )}
                </Button>
              </div>

              {generatedSystemRecipe ? (
                <div className="space-y-4 rounded-md border p-4">
                  <p className="text-sm text-muted-foreground">
                    Review and tweak this draft before saving it directly as a
                    system recipe.
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="generated-title">Title</Label>
                      <Input
                        id="generated-title"
                        value={generatedSystemRecipe.title}
                        onChange={(event) =>
                          patchGeneratedRecipe((current) => ({
                            ...current,
                            title: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="generated-category">Category</Label>
                      <select
                        id="generated-category"
                        aria-label="Generated recipe category"
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                        value={generatedSystemRecipe.category}
                        onChange={(event) =>
                          patchGeneratedRecipe((current) => ({
                            ...current,
                            category: event.target.value as (typeof RECIPE_CATEGORIES)[number],
                          }))
                        }
                      >
                        {RECIPE_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="generated-prep-time">Prep time (min)</Label>
                      <Input
                        id="generated-prep-time"
                        type="number"
                        min={0}
                        value={generatedSystemRecipe.prepTime}
                        onChange={(event) =>
                          patchGeneratedRecipe((current) => ({
                            ...current,
                            prepTime: Number(event.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="generated-cook-time">Cook time (min)</Label>
                      <Input
                        id="generated-cook-time"
                        type="number"
                        min={0}
                        value={generatedSystemRecipe.cookTime ?? 0}
                        onChange={(event) =>
                          patchGeneratedRecipe((current) => ({
                            ...current,
                            cookTime: Number(event.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="generated-serves">Serves</Label>
                      <Input
                        id="generated-serves"
                        type="number"
                        min={1}
                        value={generatedSystemRecipe.serves}
                        onChange={(event) =>
                          patchGeneratedRecipe((current) => ({
                            ...current,
                            serves: Math.max(1, Number(event.target.value) || 1),
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="generated-primary-protein">
                        Primary protein
                      </Label>
                      <select
                        id="generated-primary-protein"
                        aria-label="Generated recipe primary protein"
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                        value={generatedSystemRecipe.primaryProtein ?? ""}
                        onChange={(event) =>
                          patchGeneratedRecipe((current) => ({
                            ...current,
                            primaryProtein:
                              event.target.value.length > 0
                                ? (event.target.value as (typeof PRIMARY_PROTEINS)[number])
                                : undefined,
                          }))
                        }
                      >
                        <option value="">None</option>
                        {PRIMARY_PROTEINS.map((protein) => (
                          <option key={protein} value={protein}>
                            {protein}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="generated-description">Description</Label>
                    <Textarea
                      id="generated-description"
                      value={generatedSystemRecipe.description ?? ""}
                      onChange={(event) =>
                        patchGeneratedRecipe((current) => ({
                          ...current,
                          description:
                            event.target.value.trim().length > 0
                              ? event.target.value
                              : null,
                        }))
                      }
                      className="min-h-20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Ingredients</Label>
                    <div className="space-y-2">
                      {generatedSystemRecipe.ingredients.map((ingredient, index) => (
                        <div
                          key={`ingredient-${index}`}
                          className="grid gap-2 rounded-md border p-3 md:grid-cols-4"
                        >
                          <Input
                            placeholder="Ingredient"
                            value={ingredient.name}
                            onChange={(event) =>
                              setGeneratedIngredientField(
                                index,
                                "name",
                                event.target.value,
                              )
                            }
                          />
                          <Input
                            placeholder="Amount"
                            type="number"
                            value={ingredient.amount ?? ""}
                            onChange={(event) =>
                              setGeneratedIngredientField(
                                index,
                                "amount",
                                event.target.value,
                              )
                            }
                          />
                          <Input
                            placeholder="Unit"
                            value={ingredient.unit ?? ""}
                            onChange={(event) =>
                              setGeneratedIngredientField(
                                index,
                                "unit",
                                event.target.value,
                              )
                            }
                          />
                          <Input
                            placeholder="Preparation"
                            value={ingredient.preparation ?? ""}
                            onChange={(event) =>
                              setGeneratedIngredientField(
                                index,
                                "preparation",
                                event.target.value,
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Method</Label>
                    <div className="space-y-2">
                      {generatedSystemRecipe.method.map((step, index) => (
                        <div
                          key={`method-${index}`}
                          className="space-y-2 rounded-md border p-3"
                        >
                          <Input
                            placeholder={`Step ${index + 1} title`}
                            value={step.title}
                            onChange={(event) =>
                              setGeneratedMethodField(
                                index,
                                "title",
                                event.target.value,
                              )
                            }
                          />
                          <Textarea
                            placeholder="Step instructions"
                            value={step.description ?? ""}
                            onChange={(event) =>
                              setGeneratedMethodField(
                                index,
                                "description",
                                event.target.value,
                              )
                            }
                            className="min-h-20"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="generated-complexity">Complexity</Label>
                      <select
                        id="generated-complexity"
                        aria-label="Generated recipe complexity tier"
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                        value={generatedSystemRecipe.complexityTier ?? ""}
                        onChange={(event) =>
                          patchGeneratedRecipe((current) => ({
                            ...current,
                            complexityTier:
                              event.target.value.length > 0
                                ? (event.target.value as (typeof COMPLEXITY_TIERS)[number])
                                : undefined,
                          }))
                        }
                      >
                        <option value="">None</option>
                        {COMPLEXITY_TIERS.map((tier) => (
                          <option key={tier} value={tier}>
                            {tier}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="generated-cuisine">Cuisine</Label>
                      <select
                        id="generated-cuisine"
                        aria-label="Generated recipe cuisine"
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                        value={generatedSystemRecipe.cuisine?.[0] ?? ""}
                        onChange={(event) =>
                          patchGeneratedRecipe((current) => ({
                            ...current,
                            cuisine:
                              event.target.value.length > 0
                                ? [event.target.value as (typeof CUISINES)[number]]
                                : undefined,
                          }))
                        }
                      >
                        <option value="">None</option>
                        {CUISINES.map((cuisine) => (
                          <option key={cuisine} value={cuisine}>
                            {cuisine}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleSaveSystemRecipe}
                    disabled={isSavingSystemRecipe}
                  >
                    {isSavingSystemRecipe ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      "Save as system recipe"
                    )}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              {recipe ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Current
                      </p>
                      {(imageBeforeUrl ?? recipe.image) ? (
                        <img
                          src={imageBeforeUrl ?? recipe.image ?? undefined}
                          alt="Current recipe"
                          className="aspect-4/3 w-full rounded-md border object-cover"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          (no image)
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        New
                      </p>
                      {imagePreviewUrl ? (
                        <img
                          src={imagePreviewUrl}
                          alt="New recipe preview"
                          className="aspect-4/3 w-full rounded-md border object-cover"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Regenerate to preview.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      type="button"
                      onClick={handleRegenerateImage}
                      disabled={isGeneratingImage || enhanced != null}
                    >
                      {isGeneratingImage ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Generating…
                        </>
                      ) : (
                        "Regenerate recipe image"
                      )}
                    </Button>

                    <Button
                      type="button"
                      onClick={handleSaveImage}
                      disabled={
                        !generatedImage || isSavingImage || enhanced != null
                      }
                      variant="secondary"
                    >
                      {isSavingImage ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        "Save/overwrite recipe image"
                      )}
                    </Button>
                  </div>

                  {enhanced ? (
                    <p className="text-sm text-muted-foreground">
                      Apply the enhanced ingredients/method first; image
                      regeneration uses the saved recipe.
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Pick a recipe to regenerate its image.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {activePanel === "enhancement" && recipe && (
        <Card>
          <CardHeader>
            <CardTitle>Before / After</CardTitle>
            <p className="text-sm text-muted-foreground">
              {enhanced
                ? "Review the changes, then click Apply to update the recipe."
                : "Your current recipe is shown here. Generate to preview ingredients and method changes."}
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
                    Timing
                  </p>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Prep {recipe.prepTime ?? 0} min · Cook{" "}
                    {recipe.cookTime ?? 0} min · Total{" "}
                    {(recipe.prepTime ?? 0) + (recipe.cookTime ?? 0)} min
                  </p>
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
                  {enhanced ? (
                    <>
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        Timing
                      </p>
                      <p className="mb-3 text-sm text-muted-foreground">
                        Prep {enhanced.prepTime} min · Cook {enhanced.cookTime}{" "}
                        min · Total {enhanced.prepTime + enhanced.cookTime} min
                      </p>
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
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Generate an enhanced recipe to populate this panel.
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Button
                onClick={handleApply}
                disabled={!enhanced || isApplying}
              >
                {isApplying ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Applying…
                  </>
                ) : (
                  enhanced ? "Apply to recipe" : "Apply to recipe"
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
