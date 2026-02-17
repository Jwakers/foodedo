"use client";

import { CATEGORY_COLORS } from "@/app/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn, titleCase } from "@/lib/utils";
import { Calendar, Clock, ImageIcon, Users } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { ChangeImageModal } from "./change-image-modal";
import { Recipe } from "./recipe-client";
import { type RecipeEditFormData } from "@/lib/schemas/recipe";

interface RecipeHeaderProps {
  recipe: NonNullable<Recipe>;
  isEditMode: boolean;
  canEdit: boolean;
  form: UseFormReturn<RecipeEditFormData>;
}

export function RecipeHeader({
  recipe,
  isEditMode,
  canEdit,
  form,
}: RecipeHeaderProps) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const prepMinutes = recipe.prepTime ?? 0;
  const cookMinutes = recipe.cookTime ?? 0;
  const totalTime = prepMinutes + cookMinutes;
  const cookTimeDisplay =
    recipe.cookTime === undefined || recipe.cookTime === 0
      ? "No cooking required"
      : `${cookMinutes} cook`;
  const categoryLabel = titleCase(recipe.category);
  const categoryColor = CATEGORY_COLORS[recipe.category];

  return (
    <div className="mb-8">
      {/* Recipe Image Placeholder */}
      <div className="aspect-[16/9] bg-gradient-to-br from-primary/20 to-primary/5 relative overflow-hidden rounded-lg mb-6 group">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        {recipe.image && (
          <Image
            src={recipe.image}
            alt={recipe.title}
            fill
            sizes="(max-width: 1024px) 100vw, 1200px"
            className="object-cover size-full"
            unoptimized
          />
        )}

        <div className="absolute top-2 right-2 z-10">
          <Badge
            variant="secondary"
            className={cn(categoryColor, "border-0 font-medium text-sm px-3 py-1")}
          >
            {categoryLabel}
          </Badge>
        </div>

        {/* Change/Add Image Button - Visible in edit mode or when no image exists */}
        {(isEditMode || (!recipe.image && canEdit)) && (
          <div className="absolute top-6 left-6 z-10">
            <Button
              type="button"
              size="default"
              variant="secondary"
              onClick={() => setIsImageModalOpen(true)}
              className="gap-2 shadow-lg"
            >
              <ImageIcon className="h-4 w-4" />
              {recipe.image ? "Change Image" : "Add Image"}
            </Button>
          </div>
        )}
      </div>
      <div className="mb-4">
        {isEditMode ? (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} placeholder="Recipe title..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="text-lg resize-none"
                      placeholder="Recipe description..."
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <h1 className="md:text-4xl text-2xl font-bold">{recipe.title}</h1>
            {recipe.description && (
              <p className="md:text-lg text-sm max-w-2xl">
                {recipe.description}
              </p>
            )}
          </div>
        )}
      </div>
      {/* Recipe Meta */}
      <div className="flex flex-wrap items-center gap-6 mb-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-5 w-5" />
          <span className="font-medium">
            {Math.max(0, totalTime)}{" "}
            {Math.max(0, totalTime) === 1 ? "minute" : "minutes"} total
          </span>
          <span className="text-sm">
            ({prepMinutes} prep + {cookTimeDisplay})
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-5 w-5" />
          <span className="font-medium">Serves {recipe.serves}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-5 w-5" />
          <span className="font-medium">
            {new Date(
              recipe.updatedAt ?? recipe._creationTime
            ).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Change Image Modal */}
      <ChangeImageModal
        recipeId={recipe._id}
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        existingImageUrl={recipe.image}
      />
    </div>
  );
}
