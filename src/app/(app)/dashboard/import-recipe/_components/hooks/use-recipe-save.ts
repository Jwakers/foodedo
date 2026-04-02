import { fetchImageServerSide } from "@/app/(app)/actions/fetch-image";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { RECIPE_CREATION_SOURCES } from "convex/lib/constants";
import { useMutation } from "convex/react";
import posthog from "posthog-js";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";
import {
  recipeImportSchema,
  type RecipeImportFormData,
} from "@/lib/schemas/recipe";
import { type ParsedRecipeForDB } from "@/lib/types/recipe-parser";

export type RecipeCreationSource = (typeof RECIPE_CREATION_SOURCES)[number];

export function useRecipeSave() {
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedRecipeId, setSavedRecipeId] = useState<Id<"recipes"> | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const createRecipeMutation = useMutation(api.recipes.createRecipe);
  const generateUploadUrl = useMutation(api.recipes.generateUploadUrl);
  const updateRecipeImage = useMutation(
    api.recipes.updateRecipeImageAndDeleteOld,
  );

  const handleImageUpload = async (
    recipeId: Id<"recipes">,
    imageUrl: string,
  ) => {
    // Fetch image server-side to bypass CORS
    const result = await fetchImageServerSide(imageUrl);

    if (!result.success || !result.data || !result.contentType) {
      throw new Error(result.error || "Failed to fetch image");
    }

    // Convert data URL to blob
    const response = await fetch(result.data);
    const blob = await response.blob();

    // Upload to Convex
    const postUrl = await generateUploadUrl();

    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 30_000);
    let uploadResult: Response;
    try {
      uploadResult = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": result.contentType },
        body: blob,
        signal: ac.signal,
      });
    } finally {
      clearTimeout(t);
    }

    if (!uploadResult.ok) {
      throw new Error(
        `Failed to upload image: ${uploadResult.status} ${uploadResult.statusText}`,
      );
    }

    const uploadData = await uploadResult.json();
    const storageId = uploadData?.storageId;

    if (!storageId || typeof storageId !== "string") {
      throw new Error("Invalid response: missing or invalid storageId");
    }

    await updateRecipeImage({
      recipeId,
      storageId: storageId as Id<"_storage">,
    });
  };

  const validateAndSaveRecipe = async (
    recipeData: ParsedRecipeForDB | RecipeImportFormData,
    parsedRecipe: ParsedRecipeForDB | null | undefined,
    creationSource: RecipeCreationSource,
  ) => {
    try {
      setIsSaving(true);
      setError(null);

      // Validate the recipe before saving
      const validationResult = recipeImportSchema.safeParse(recipeData);

      if (!validationResult.success) {
        // Validation failed, enter edit mode
        const errors = z.flattenError(validationResult.error).fieldErrors;
        const errorMessages = Object.entries(errors)
          .map(
            ([field, messages]) =>
              `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages || "Invalid"}`,
          )
          .join("; ");

        toast.error("Recipe validation failed", {
          description: "Please correct the errors in edit mode",
        });

        console.error("Validation errors:", errorMessages);
        setIsSaving(false);
        return { success: false, shouldEdit: true };
      }

      // Validation passed, proceed with saving
      const validatedRecipe = validationResult.data;

      // Nutrition values are already parsed as integers (grams) from the AI parser
      const nutrition = validatedRecipe.nutrition;

      const {
        recipeId,
        validationErrors,
        error: mutationError,
      } = await createRecipeMutation({
        creationSource,
        title: validatedRecipe.title,
        description: validatedRecipe.description,
        prepTime: validatedRecipe.prepTime,
        cookTime: validatedRecipe.cookTime,
        serves: validatedRecipe.serves,
        category: validatedRecipe.category,
        ingredients: validatedRecipe.ingredients,
        method: validatedRecipe.method,
        nutrition,
        originalUrl: parsedRecipe?.originalUrl,
        originalAuthor: parsedRecipe?.originalAuthor,
        originalPublishedDate: parsedRecipe?.originalPublishedDate,
        primaryProtein: validatedRecipe.primaryProtein ?? undefined,
        complexityTier: validatedRecipe.complexityTier ?? undefined,
        cuisine: validatedRecipe.cuisine,
      });

      if (mutationError) {
        toast.error(mutationError);
        setError(mutationError);
        setIsSaving(false);
        return { success: false, shouldEdit: false };
      }
      if (!recipeId) {
        toast.error("Failed to save recipe");
        setError("Failed to save recipe");
        setIsSaving(false);
        return { success: false, shouldEdit: false };
      }

      if (validatedRecipe.imageUrl) {
        const promise = handleImageUpload(recipeId, validatedRecipe.imageUrl);
        toast.promise(promise, {
          loading: "Uploading image...",
          success: "Image uploaded successfully",
          error: "Failed to upload image",
        });
      }

      if (validationErrors?.length) {
        toast.warning("Some fields are incomplete", {
          description:
            "Your recipe has been saved but may require some manual editing to complete it",
        });
      }

      posthog.capture("recipe_imported", {
        creation_source: creationSource,
        recipe_category: validatedRecipe.category,
        has_image: !!validatedRecipe.imageUrl,
      });

      setSavedRecipeId(recipeId);
      setIsSaved(true);
      return { success: true, recipeId, shouldEdit: false };
    } catch (error) {
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      setError(errorMessage);
      setIsSaving(false);
      return { success: false, shouldEdit: false };
    } finally {
      setIsSaving(false);
    }
  };

  const reset = () => {
    setIsSaved(false);
    setIsSaving(false);
    setSavedRecipeId(null);
    setError(null);
  };

  return {
    isSaved,
    isSaving,
    savedRecipeId,
    error,
    validateAndSaveRecipe,
    handleImageUpload,
    reset,
  };
}
