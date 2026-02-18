"use client";

import { validateImageFile } from "@/app/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { IMAGE_LIMITS, RECIPE_LIMITS } from "convex/lib/constants";
import { isHeicFile, processImageFile } from "@/lib/utils/heic-conversion";
import { Camera, ImageIcon, Upload, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export interface ImagePreview {
  id: string;
  file: File;
  previewUrl: string;
}

interface MultiImageUploadProps {
  /** Maximum number of images allowed */
  maxImages?: number;
  /** Callback when images change */
  onImagesChange?: (images: ImagePreview[]) => void;
  /** Whether the upload is disabled */
  disabled?: boolean;
  /** Label text */
  label?: string;
  /** Whether to show camera capture option */
  showCamera?: boolean;
}

const DEFAULT_MAX_IMAGES = RECIPE_LIMITS.MAX_PHOTO_IMAGES;

/**
 * Multi-image upload component with drag & drop and camera support
 * Allows users to select multiple recipe page images
 */
export function MultiImageUpload({
  maxImages = DEFAULT_MAX_IMAGES,
  onImagesChange,
  disabled = false,
  showCamera = true,
}: MultiImageUploadProps) {
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  // Track preview URLs in a ref for cleanup on unmount
  const previewUrlsRef = useRef<Set<string>>(new Set());

  const addImages = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const newImages: ImagePreview[] = [];

      for (const file of fileArray) {
        try {
          // Process HEIC/HEIF files first (converts to JPEG if needed)
          let processedFile = file;
          if (isHeicFile(file)) {
            const conversionPromise = processImageFile(file);

            // Use toast.promise to show animated loading/success/error states
            toast.promise(conversionPromise, {
              loading: `Converting ${file.name}...`,
              success: "HEIC image converted to JPEG",
              error: (error) =>
                error instanceof Error
                  ? error.message
                  : "Failed to convert HEIC image. Please try a different format.",
            });

            try {
              processedFile = await conversionPromise;
            } catch {
              // Error already handled by toast.promise, skip this file
              continue;
            }
          } else {
            processedFile = file;
          }

          // Validate file (after conversion if needed)
          const validation = validateImageFile(processedFile);
          if (!validation.valid) {
            toast.error(validation.error || "Invalid file");
            continue;
          }

          // Create preview
          const previewUrl = URL.createObjectURL(processedFile);
          previewUrlsRef.current.add(previewUrl); // Track for cleanup
          const id = `${Date.now()}-${Math.random()}`;
          newImages.push({ id, file: processedFile, previewUrl });
        } catch {
          // Error already handled (either conversion or processing)
          // Skip this file and continue with next
          continue;
        }
      }

      if (newImages.length > 0) {
        const updatedImages = [...images, ...newImages];
        setImages(updatedImages);
        onImagesChange?.(updatedImages);
      }
    },
    [images, onImagesChange],
  );

  const removeImage = useCallback(
    (id: string) => {
      const imageToRemove = images.find((img) => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
        previewUrlsRef.current.delete(imageToRemove.previewUrl); // Remove from tracking
      }

      const updatedImages = images.filter((img) => img.id !== id);
      setImages(updatedImages);
      onImagesChange?.(updatedImages);
    },
    [images, onImagesChange],
  );

  const clearAll = useCallback(() => {
    images.forEach((img) => {
      URL.revokeObjectURL(img.previewUrl);
      previewUrlsRef.current.delete(img.previewUrl); // Remove from tracking
    });
    setImages([]);
    onImagesChange?.([]);
  }, [images, onImagesChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addImages(files);
    }
    // Reset input so same files can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      addImages(files);
    }
  };

  // Clean up all preview URLs on unmount only
  useEffect(() => {
    const previewUrls = previewUrlsRef.current; // Copy ref value for cleanup
    return () => {
      previewUrls.forEach((previewUrl) => {
        URL.revokeObjectURL(previewUrl);
      });
      previewUrls.clear();
    };
  }, []); // Empty dependency array - only cleanup on unmount

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        onChange={handleFileChange}
        disabled={disabled || !canAddMore}
        className="sr-only"
        aria-label="Upload recipe images"
      />
      {showCamera && (
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*,.heic,.heif"
          capture="environment"
          onChange={handleFileChange}
          disabled={disabled || !canAddMore}
          className="sr-only"
          aria-label="Take photo of recipe"
        />
      )}

      {/* Upload area */}
      {canAddMore && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative border-2 border-dashed rounded-lg p-6 transition-colors",
            isDragging
              ? "border-primary bg-primary/10"
              : "border-muted-foreground/25 hover:border-primary/50",
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          )}
        >
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="size-8 text-muted-foreground" />
              {showCamera && (
                <Camera className="size-8 text-muted-foreground" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                {showCamera ? "Take photos or upload images" : "Upload images"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Drag & drop images here, or click to select
              </p>
              <p className="text-xs text-muted-foreground">
                Max {maxImages} images, {IMAGE_LIMITS.MAX_FILE_SIZE_MB}MB each
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
              >
                <Upload className="size-4 mr-2" />
                Choose Files
              </Button>
              {showCamera && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={disabled}
                >
                  <Camera className="size-4 mr-2" />
                  Take Photo
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image preview grid */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {images.length} image{images.length === 1 ? "" : "s"} selected
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAll}
              disabled={disabled}
            >
              Clear All
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((image) => (
              <Card key={image.id} className="relative group overflow-hidden">
                <div className="aspect-square relative">
                  <Image
                    src={image.previewUrl}
                    alt={`Preview ${image.id}`}
                    fill
                    className="object-cover"
                    unoptimized
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeImage(image.id)}
                      disabled={disabled}
                      className="size-8"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-xs text-muted-foreground truncate">
                    {image.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(image.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Max images reached message */}
      {!canAddMore && images.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Maximum {maxImages} images reached. Remove an image to add more.
        </p>
      )}
    </div>
  );
}
