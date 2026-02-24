import { parseTextToRecipe } from "@/app/(app)/actions/parse-recipe";
import { type ParsedRecipeForDB } from "@/lib/types/recipe-parser";
import { useState } from "react";
import { toast } from "sonner";

type LoadingStage = "idle" | "fetching" | "categorising" | "complete";

export function useTextImport() {
  const [loadingStage, setLoadingStage] = useState<LoadingStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipeForDB | null>(
    null,
  );

  const handleTextRecipeParsed = async (text: string) => {
    setLoadingStage("fetching");
    setError(null);

    // Simulate stage progression for better UX
    const timeout = setTimeout(() => {
      setLoadingStage("categorising");
    }, 2000);

    try {
      const result = await parseTextToRecipe(text);

      clearTimeout(timeout);

      if (!result.success) {
        // If we have partial data, use it and enter edit mode
        if (result.partialRecipe) {
          const partialConverted: ParsedRecipeForDB = {
            title: result.partialRecipe.title ?? "Untitled Recipe",
            description: result.partialRecipe.description ?? "",
            prepTime: result.partialRecipe.prepTime ?? 0,
            cookTime: result.partialRecipe.cookTime ?? 0,
            serves: result.partialRecipe.serves ?? 4,
            category: result.partialRecipe.category ?? "main",
            ingredients: result.partialRecipe.ingredients ?? [],
            method: result.partialRecipe.method ?? [],
            nutrition: result.partialRecipe.nutrition,
            imageUrl: undefined,
            originalUrl: undefined,
            originalAuthor: undefined,
            importedAt: Date.now(),
            originalPublishedDate: undefined,
            rating: undefined,
            primaryProtein: result.partialRecipe.primaryProtein,
            complexityTier: result.partialRecipe.complexityTier,
            cuisine: result.partialRecipe.cuisine,
            totalTimeMinutes: result.partialRecipe.totalTimeMinutes,
          };

          setParsedRecipe(partialConverted);
          setLoadingStage("complete");

          toast.error("Recipe incomplete", {
            description:
              result.error || "Please complete the missing fields in edit mode",
          });
        } else {
          setLoadingStage("idle");
          setError(result.error || "Failed to create recipe from text");
        }
        return { success: false, isPartial: !!result.partialRecipe };
      }

      if (!result.recipe) {
        setLoadingStage("idle");
        setError("Failed to create recipe from text");
        return { success: false, isPartial: false };
      }

      // Convert ParsedRecipeFromText to ParsedRecipeForDB format
      const convertedRecipe: ParsedRecipeForDB = {
        title: result.recipe.title,
        description: result.recipe.description,
        prepTime: result.recipe.prepTime,
        cookTime: result.recipe.cookTime,
        serves: result.recipe.serves,
        category: result.recipe.category,
        ingredients: result.recipe.ingredients,
        method: result.recipe.method,
        nutrition: result.recipe.nutrition,
        imageUrl: undefined, // No image from text parsing
        originalUrl: undefined,
        originalAuthor: undefined,
        importedAt: Date.now(),
        originalPublishedDate: undefined,
        rating: undefined,
        primaryProtein: result.recipe.primaryProtein,
        complexityTier: result.recipe.complexityTier,
        cuisine: result.recipe.cuisine,
        totalTimeMinutes: result.recipe.totalTimeMinutes,
      };
      setParsedRecipe(convertedRecipe);
      setLoadingStage("complete");
      return { success: true, isPartial: false };
    } catch (err) {
      clearTimeout(timeout);
      console.error(err);
      setLoadingStage("idle");
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      return { success: false, isPartial: false };
    }
  };

  const reset = () => {
    setLoadingStage("idle");
    setError(null);
    setParsedRecipe(null);
  };

  return {
    loadingStage,
    error,
    parsedRecipe,
    handleTextRecipeParsed,
    reset,
    setParsedRecipe,
  };
}
