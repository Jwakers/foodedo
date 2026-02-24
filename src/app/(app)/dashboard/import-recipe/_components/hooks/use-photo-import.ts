import { parseImagesToRecipe } from "@/app/(app)/actions/parse-recipe-images";
import { type ImagePreview } from "@/components/image-upload";
import { type ParsedRecipeForDB } from "@/lib/types/recipe-parser";
import { compressImage } from "@/lib/utils/image-compression";
import { IMAGE_COMPRESSION } from "convex/lib/constants";
import { useState } from "react";
import { toast } from "sonner";

type LoadingStage = "idle" | "fetching" | "categorising" | "complete";

export function usePhotoImport() {
  const [loadingStage, setLoadingStage] = useState<LoadingStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipeForDB | null>(
    null,
  );

  const handlePhotoRecipeParsed = async (images: ImagePreview[]) => {
    if (images.length === 0) {
      // Clear all state to show clean empty state
      setError("Please select at least one image");
      setParsedRecipe(null);
      setLoadingStage("idle");
      return;
    }

    setLoadingStage("fetching");
    setError(null);

    // Simulate stage progression for better UX
    const timeout = setTimeout(() => {
      setLoadingStage("categorising");
    }, 2000);

    try {
      // Compress and convert images to base64 data URLs
      const base64Images = await Promise.all(
        images.map(async (img) => {
          // Compress image if it's large
          let fileToProcess = img.file;
          if (img.file.size > IMAGE_COMPRESSION.COMPRESSION_THRESHOLD_BYTES) {
            try {
              fileToProcess = await compressImage(
                img.file,
                IMAGE_COMPRESSION.MAX_WIDTH,
                IMAGE_COMPRESSION.QUALITY,
              );
              toast.success(`Compressed ${img.file.name} to reduce size`);
            } catch (error) {
              console.warn("Failed to compress image, using original:", error);
              // Continue with original file if compression fails
            }
          }

          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === "string") {
                resolve(reader.result);
              } else {
                reject(new Error("Failed to convert image to base64"));
              }
            };
            reader.onerror = () => reject(new Error("Failed to read image"));
            reader.readAsDataURL(fileToProcess);
          });
        }),
      );

      const result = await parseImagesToRecipe(base64Images);

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
          setError(result.error || "Failed to parse recipe from images");
        }
        return { success: false, isPartial: !!result.partialRecipe };
      }

      if (!result.recipe) {
        setLoadingStage("idle");
        setError("Failed to create recipe from images");
        return { success: false, isPartial: false };
      }

      setParsedRecipe(result.recipe);
      setLoadingStage("complete");
      return { success: true, isPartial: false };
    } catch (err) {
      clearTimeout(timeout);
      console.error(err);
      setLoadingStage("idle");

      // Check for body size limit error
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred while parsing images";
      const isBodySizeError =
        errorMessage.includes("Body exceeded") ||
        errorMessage.includes("body size limit") ||
        errorMessage.includes("413") ||
        errorMessage.includes("PayloadTooLargeError");

      if (isBodySizeError) {
        const friendlyError =
          "Images are too large to process. Please try:\n\n• Reducing the number of images\n• Using lower resolution photos\n• Compressing images before uploading\n• Taking new photos with lower quality settings";
        setError(friendlyError);
        toast.error("Images too large", {
          description:
            "Please reduce image size or use fewer images. Try compressing your photos or taking new ones with lower quality settings.",
          duration: 8000,
        });
      } else {
        setError(errorMessage);
      }

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
    handlePhotoRecipeParsed,
    reset,
    setParsedRecipe,
  };
}
