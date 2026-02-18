"use client";

import { ImageUploadArea } from "@/components/image-upload";
import { useImageUpload } from "@/lib/hooks/use-image-upload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Loader2, Upload } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

interface ChangeImageModalProps {
  recipeId: Id<"recipes">;
  isOpen: boolean;
  onClose: () => void;
  existingImageUrl?: string | null;
}

export function ChangeImageModal({
  recipeId,
  isOpen,
  onClose,
  existingImageUrl,
}: ChangeImageModalProps) {
  const updateRecipeImage = useMutation(
    api.recipes.updateRecipeImageAndDeleteOld,
  );

  const imageUpload = useImageUpload({
    onUploadComplete: async (storageId) => {
      await updateRecipeImage({
        recipeId,
        storageId,
      });
      toast.success("Image updated successfully");
      handleClose();
    },
  });

  // Set existing image as preview when modal opens
  useEffect(() => {
    if (isOpen) {
      if (existingImageUrl && !imageUpload.selectedFile) {
        imageUpload.setPreviewUrl(existingImageUrl);
      }
    } else {
      // Clear preview when modal closes (but keep it if we just uploaded)
      // Only clear if no file is selected
      if (!imageUpload.selectedFile) {
        imageUpload.clear();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, existingImageUrl]);

  const handleSubmit = async () => {
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

  const handleClose = () => {
    imageUpload.clear();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Recipe Image</DialogTitle>
          <DialogDescription>
            Upload a new image for your recipe. The old image will be replaced.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <ImageUploadArea
            upload={imageUpload}
            inputId="change-image-input"
            label="Click to upload image"
            dragPlaceholder="Drag & drop image here"
            aspectRatio="aspect-[16/9]"
            showRemove={true}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={imageUpload.isUploading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!imageUpload.selectedFile || imageUpload.isUploading}
          >
            {imageUpload.isUploading ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="size-4 mr-2" />
                Upload Image
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
