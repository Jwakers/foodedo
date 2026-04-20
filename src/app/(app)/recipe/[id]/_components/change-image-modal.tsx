"use client";

import { runRecipeAiHeroImageJob } from "@/app/(app)/actions/run-recipe-ai-hero-image";
import { ROUTES } from "@/app/constants";
import { ImageUploadArea } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useImageUpload } from "@/lib/hooks/use-image-upload";
import { cn } from "@/lib/utils";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import {
  canGenerateRecipeHeroImageWithAI,
  RECIPE_AI_HERO_ERRORS,
} from "convex/lib/constants";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { Loader2, Lock, Sparkles, Upload } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ChangeImageModalProps {
  recipeId: Id<"recipes">;
  isOpen: boolean;
  onClose: () => void;
  existingImageUrl?: string | null;
  /** When set with an image URL, the recipe image was generated with AI (no second AI run until user uploads). */
  heroImageOrigin?: "user_upload" | "ai";
}

function friendlyAiHeroError(code?: string): string | undefined {
  switch (code) {
    case RECIPE_AI_HERO_ERRORS.PREMIUM_REQUIRED:
      return "This feature requires a Pro plan.";
    case RECIPE_AI_HERO_ERRORS.RATE_LIMIT_USER_24H:
      return "You’ve reached today’s limit for AI recipe images. Try again tomorrow.";
    case RECIPE_AI_HERO_ERRORS.RATE_LIMIT_USER_30D:
      return "You’ve reached this month’s limit for AI recipe images.";
    case RECIPE_AI_HERO_ERRORS.RATE_LIMIT_RECIPE_24H:
      return "You’ve reached today’s limit for new images on this recipe.";
    case RECIPE_AI_HERO_ERRORS.COOLDOWN:
      return "Please wait a moment before generating again.";
    case RECIPE_AI_HERO_ERRORS.PENDING_JOB:
      return "An image is already being created. Wait for it to finish or try again in a few minutes.";
    case RECIPE_AI_HERO_ERRORS.EXPIRED:
      return "That session expired. Start again.";
    case RECIPE_AI_HERO_ERRORS.ALREADY_HAS_AI_HERO:
      return "This recipe already has an AI-generated image. Upload your own photo first if you want a new one.";
    default:
      return undefined;
  }
}

export function ChangeImageModal({
  recipeId,
  isOpen,
  onClose,
  existingImageUrl,
  heroImageOrigin,
}: ChangeImageModalProps) {
  const user = useQuery(api.users.current);
  const updateRecipeImage = useMutation(
    api.recipes.updateRecipeImageAndDeleteOld,
  );
  const startAiJob = useMutation(
    api.recipeAiHeroImages.startRecipeAiHeroImageJob,
  );

  const [tab, setTab] = useState<"upload" | "ai">("upload");
  const [isAiRunning, setIsAiRunning] = useState(false);

  const canUseAi =
    user != null && canGenerateRecipeHeroImageWithAI(user.subscriptionTier);
  const lockedAi = user != null && !canUseAi;
  const hasAiHeroAlready =
    heroImageOrigin === "ai" && Boolean(existingImageUrl?.trim());

  const imageUpload = useImageUpload({
    onUploadComplete: async (storageId) => {
      await updateRecipeImage({
        recipeId,
        storageId,
      });
      toast.success("Image updated successfully");
      resetAndClose();
    },
  });

  const resetAndClose = () => {
    imageUpload.clear();
    setTab("upload");
    setIsAiRunning(false);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      if (existingImageUrl && !imageUpload.selectedFile) {
        imageUpload.setPreviewUrl(existingImageUrl);
      }
    } else {
      if (!imageUpload.selectedFile) {
        imageUpload.clear();
      }
      setTab("upload");
      setIsAiRunning(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, existingImageUrl]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      imageUpload.clear();
      setTab("upload");
      setIsAiRunning(false);
      onClose();
    }
  };

  const handleSubmitUpload = async () => {
    if (!imageUpload.selectedFile) {
      toast.error("Please select an image");
      return;
    }

    const storageId = await imageUpload.upload();
    if (!storageId) {
      toast.error("Failed to update image", {
        description: "Please try again",
      });
    }
  };

  const handleGenerateAi = async () => {
    if (!canUseAi || hasAiHeroAlready) return;
    setIsAiRunning(true);
    try {
      let jobId: string;
      try {
        const started = await startAiJob({ recipeId });
        jobId = started.jobId;
      } catch (e) {
        const code =
          e instanceof ConvexError && typeof e.data === "string"
            ? e.data
            : undefined;
        toast.error(
          friendlyAiHeroError(code) ??
            (e instanceof Error ? e.message : "Could not start generation."),
        );
        return;
      }
      const result = await runRecipeAiHeroImageJob(jobId);
      if (!result.success) {
        const friendly =
          friendlyAiHeroError(result.code) ??
          result.error ??
          "Generation failed.";
        toast.error(friendly);
        return;
      }
      toast.success("Recipe image created");
      resetAndClose();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Something went wrong. Try again.";
      toast.error(message);
    } finally {
      setIsAiRunning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Recipe image</DialogTitle>
          <DialogDescription>
            Upload a photo or create a recipe image with AI. Replacing the image
            removes the previous file.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "upload" | "ai")}
          className="gap-4"
        >
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="upload" className="gap-1.5">
              <Upload className="size-3.5 shrink-0" aria-hidden />
              Upload
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-1.5">
              <Sparkles className="size-3.5 shrink-0" aria-hidden />
              With AI
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-0 space-y-4">
            <ImageUploadArea
              upload={imageUpload}
              inputId="change-image-input"
              label="Click to upload image"
              dragPlaceholder="Drag & drop image here"
              aspectRatio="aspect-[16/9]"
              showRemove={true}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={imageUpload.isUploading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmitUpload}
                disabled={!imageUpload.selectedFile || imageUpload.isUploading}
              >
                {imageUpload.isUploading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="size-4 mr-2" />
                    Save image
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="ai" className="mt-0 space-y-4">
            <div
              className={cn(
                "relative rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground",
                "min-h-[140px]",
              )}
            >
              <p className="pr-2">
                We&apos;ll create a single recipe image from your recipe
                information.
              </p>

              {canUseAi && hasAiHeroAlready && (
                <div className="mt-3 rounded-md border border-border bg-background/90 p-3 text-left text-foreground">
                  <p className="text-sm font-medium">AI recipe image already set</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    You can&apos;t create another AI image while the current recipe
                    image is AI-generated. Use the Upload tab to add your own photo
                    first; then you can create a new AI image if you like.
                  </p>
                </div>
              )}

              {lockedAi && (
                <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-background/80 p-4 text-center backdrop-blur-[1px]">
                  <Lock className="size-8 text-muted-foreground" aria-hidden />
                  <p className="text-sm font-medium text-foreground">
                    Premium feature — preview only
                  </p>
                  <p className="max-w-xs text-xs text-muted-foreground">
                    See how AI recipe images will work. Subscribe to unlock when we
                    leave beta.
                  </p>
                  <Button size="sm" asChild>
                    <Link href={ROUTES.PRICING}>View plans</Link>
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isAiRunning}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleGenerateAi}
                disabled={!canUseAi || isAiRunning || hasAiHeroAlready}
              >
                {isAiRunning ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4 mr-2" />
                    Generate recipe image
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
