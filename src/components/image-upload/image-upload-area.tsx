"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UseImageUploadReturn } from "@/lib/hooks/use-image-upload";
import { cn } from "@/lib/utils";
import { IMAGE_LIMITS } from "convex/lib/constants";
import { ImageIcon, Upload, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

interface ImageUploadAreaProps {
  /** Upload hook instance */
  upload: UseImageUploadReturn;
  /** Input ID (must be unique) */
  inputId: string;
  /** Label text */
  label?: string;
  /** Placeholder text for drag & drop */
  dragPlaceholder?: string;
  /** Preview aspect ratio */
  aspectRatio?: string;
  /** Whether to show remove button */
  showRemove?: boolean;
  /** Callback when file is selected */
  onFileSelect?: (file: File) => void;
  /** Callback when remove is clicked */
  onRemove?: () => void;
  /** Whether the upload is disabled */
  disabled?: boolean;
}

/**
 * Image upload area component with drag & drop support
 * Shows a larger area for dropping images with preview
 */
export function ImageUploadArea({
  upload,
  inputId,
  label = "Click to upload image",
  dragPlaceholder = "Drag & drop image here",
  aspectRatio = "aspect-[16/9]",
  showRemove = true,
  onFileSelect,
  onRemove,
  disabled = false,
}: ImageUploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !upload.isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled || upload.isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const processedFile = await upload.handleFileSelect(file);
      if (processedFile) {
        onFileSelect?.(processedFile);
      }
    }
  };

  const handleRemove = () => {
    upload.clear();
    onRemove?.();
  };

  if (upload.previewUrl) {
    return (
      <div className="relative w-full">
        <div
          className={cn(
            "relative w-full bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden rounded-lg border border-border group",
            aspectRatio,
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <Image
            src={upload.previewUrl}
            alt="Preview"
            fill
            className="object-cover"
            unoptimized
            sizes="(max-width: 768px) 100vw, 500px"
          />
          {showRemove && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleRemove}
                disabled={disabled}
              >
                <X className="size-4 mr-2" />
                Remove Image
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*,.heic,.heif"
        onChange={handleFileChange}
        disabled={disabled || upload.isUploading}
        className="sr-only"
      />
      <label
        htmlFor={inputId}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative block w-full bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden rounded-lg border-2 transition-colors cursor-pointer",
          aspectRatio,
          isDragging
            ? "border-primary bg-primary/10"
            : "border-dashed border-muted-foreground/25 hover:border-primary/50",
          (disabled || upload.isUploading) && "opacity-50 cursor-not-allowed",
        )}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {upload.isUploading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Upload className="h-12 w-12 animate-pulse" />
              <span className="text-sm">Uploading...</span>
            </div>
          ) : (
            <>
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-xs text-muted-foreground mt-1">
                Max {IMAGE_LIMITS.MAX_FILE_SIZE_MB}MB
              </span>
              {isDragging && (
                <span className="text-sm text-primary mt-2 font-medium">
                  {dragPlaceholder}
                </span>
              )}
            </>
          )}
        </div>
      </label>
    </div>
  );
}
