"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UseImageUploadReturn } from "@/lib/hooks/use-image-upload";
import { cn } from "@/lib/utils";
import { IMAGE_LIMITS } from "convex/lib/constants";
import { ImageIcon, Upload, X } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";

interface ImageUploadButtonProps {
  /** Upload hook instance */
  upload: UseImageUploadReturn;
  /** Input ID (must be unique) */
  inputId: string;
  /** Label text */
  label?: string;
  /** Whether to show the preview */
  showPreview?: boolean;
  /** Preview aspect ratio */
  aspectRatio?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Callback when file is selected */
  onFileSelect?: (file: File) => void;
  /** Callback when remove is clicked */
  onRemove?: () => void;
  /** Whether the upload is disabled */
  disabled?: boolean;
}

/**
 * Simple image upload button component
 * Shows a button to select an image, with optional preview
 */
export function ImageUploadButton({
  upload,
  inputId,
  label = "Click to upload image",
  showPreview = true,
  aspectRatio = "aspect-video",
  size = "md",
  onFileSelect,
  onRemove,
  disabled = false,
}: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const processedFile = await upload.handleFileSelect(file);
      if (processedFile) {
        onFileSelect?.(processedFile);
      }
    }
    // Reset input so same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    upload.clear();
    onRemove?.();
  };

  const sizeClasses = {
    sm: "h-16",
    md: "h-24",
    lg: "h-32",
  };

  if (upload.previewUrl && showPreview) {
    return (
      <div className="relative w-full rounded-lg overflow-hidden border border-border">
        <div className={cn("relative w-full", aspectRatio)}>
          <Image
            src={upload.previewUrl}
            alt="Preview"
            fill
            className="object-cover"
            unoptimized
            sizes="(max-width: 768px) 100vw, 400px"
          />
        </div>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={handleRemove}
          className="absolute top-2 right-2"
          disabled={disabled}
        >
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*,.heic,.heif"
        onChange={handleFileChange}
        disabled={disabled || upload.isUploading}
        className="hidden"
      />
      <Label
        htmlFor={inputId}
        className={cn(
          "flex items-center justify-center w-full border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors",
          sizeClasses[size],
          (disabled || upload.isUploading) && "opacity-50 cursor-not-allowed",
        )}
      >
        {upload.isUploading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Upload className="size-5 animate-pulse" />
            <span className="text-sm">Uploading...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <ImageIcon className="size-5" />
            <span className="text-sm">{label}</span>
          </div>
        )}
      </Label>
      {size !== "sm" && (
        <p className="text-xs text-muted-foreground mt-1 text-center">
          Max {IMAGE_LIMITS.MAX_FILE_SIZE_MB}MB
        </p>
      )}
    </div>
  );
}
