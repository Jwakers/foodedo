"use client";

import { ROUTES } from "@/app/constants";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form } from "@/components/ui/form";
import {
  recipeEditSchema,
  type RecipeEditFormData,
} from "@/lib/schemas/recipe";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { FunctionReturnType } from "convex/server";
import {
  ChefHat,
  Edit,
  MoreVertical,
  Save,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CookModeOverlay } from "./cook-mode-overlay";
import { DeleteRecipeDialog } from "./delete-recipe-dialog";
import { EditableRecipeMeta } from "./editable-recipe-meta";
import { IngredientsSection } from "./ingredients-section";
import { MethodSection } from "./method-section";
import { NutritionSection } from "./nutrition-section";
import { RecipeAttribution } from "./recipe-attribution";
import { RecipeHeader } from "./recipe-header";
import { RecipeLoading } from "./recipe-loading";
import { RecipeNotFound } from "./recipe-not-found";
import { ShareToHouseholdDialog } from "./share-to-household-dialog";

type RecipeClientProps = {
  recipeId: Id<"recipes">;
};

export type Recipe = FunctionReturnType<typeof api.recipes.getRecipe>;

export function RecipeClient({ recipeId }: RecipeClientProps) {
  const router = useRouter();

  const [isEditMode, setIsEditMode] = useState(false);
  const [isCookModeOpen, setIsCookModeOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);

  const recipe = useQuery(api.recipes.getRecipe, { recipeId });
  const recipeForEdit = useQuery(api.recipes.getRecipeForEdit, { recipeId });
  const updateRecipeMutation = useMutation(api.recipes.updateRecipe);
  const deleteRecipeMutation = useMutation(api.recipes.deleteRecipe);

  const form = useForm<RecipeEditFormData>({
    resolver: zodResolver(recipeEditSchema),
    defaultValues: {
      title: "",
      description: "",
      prepTime: 0,
      cookTime: undefined,
      serves: 1, // Must be at least 1 to match schema validation
      category: "main",
      ingredients: [],
      method: [],
      primaryProtein: undefined,
      complexityTier: undefined,
      cuisine: [],
    },
  });

  const handleToggleEditMode = () => {
    if (isEditMode) {
      form.reset();
      setIsEditMode(false);
      return;
    }

    // Check if recipeForEdit is loaded before entering edit mode
    if (recipeForEdit === undefined) {
      toast.info("Loading recipe data...", {
        description: "Please wait while we prepare the form for editing.",
      });
      return;
    }

    if (!recipeForEdit) {
      toast.error("Unable to load recipe data", {
        description: "Please refresh the page and try again.",
      });
      return;
    }

    // Only enter edit mode after successfully populating form with recipeForEdit data
    if (recipe && recipeForEdit) {
      form.reset({
        // Use recipeForEdit which has all fields with storage IDs (not URLs)
        title: recipeForEdit.title || "",
        description: recipeForEdit.description || "",
        prepTime: recipeForEdit.prepTime ?? 0,
        cookTime: recipeForEdit.cookTime ?? undefined,
        serves: recipeForEdit.serves ?? 1, // Default to 1 to match schema validation (min: 1)
        category: recipeForEdit.category,
        ingredients: recipeForEdit.ingredients || [],
        // Convert storage ID to string for form
        method: (recipeForEdit.method || []).map((step) => ({
          title: step.title,
          description: step.description,
          image: step.image ? String(step.image) : undefined,
          ingredientRefs: step.ingredientRefs ?? [],
          ingredientRefsSource:
            step.ingredientRefsSource === "user" ||
            step.ingredientRefsSource === "auto"
              ? step.ingredientRefsSource
              : (step.ingredientRefs?.length ? "user" : "auto"),
        })),
        primaryProtein: recipeForEdit.primaryProtein,
        complexityTier: recipeForEdit.complexityTier,
        cuisine: recipeForEdit.cuisine ?? [],
      });
      setIsEditMode(true);
    }
  };

  const handleSave = async (data: RecipeEditFormData) => {
    if (!recipe) return;

    try {
      await updateRecipeMutation({
        recipeId: recipe._id,
        title: data.title,
        description: data.description,
        prepTime: data.prepTime,
        cookTime: data.cookTime,
        serves: data.serves,
        category: data.category,
        ingredients: data.ingredients.map((ing) => ({
          ...ing,
          ingredientId: ing.ingredientId as Id<"ingredients"> | undefined,
        })),
        method: data.method.map((step) => ({
          title: step.title,
          description: step.description,
          image: step.image ? (step.image as Id<"_storage">) : undefined,
          ingredientRefs:
            step.ingredientRefs?.length ? step.ingredientRefs : undefined,
          ingredientRefsSource:
            step.ingredientRefsSource === "user" ||
            step.ingredientRefsSource === "auto"
              ? step.ingredientRefsSource
              : undefined,
        })),
        primaryProtein: data.primaryProtein,
        complexityTier: data.complexityTier,
        cuisine: data.cuisine,
      });

      toast.success("Recipe updated successfully");
      setIsEditMode(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update recipe");
    }
  };

  const handleDelete = (recipe: Recipe) => {
    setRecipeToDelete(recipe);
  };

  const confirmDelete = async () => {
    if (!recipeToDelete) return;

    try {
      await deleteRecipeMutation({ recipeId: recipeToDelete._id });
      router.replace(ROUTES.MY_RECIPES);
      toast.success("Recipe deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete recipe");
    }
  };

  return (
    <>
        {recipe === undefined && <RecipeLoading />}
        {recipe === null && <RecipeNotFound />}
        {recipe !== undefined &&
          recipe !== null &&
          (() => {
            const canEdit = recipe.isOwner !== false;
            return (
              <>
                {!canEdit && recipe.ownerName && (
                  <div className="mb-4 p-4 bg-muted rounded-lg border">
                    <p className="text-sm text-muted-foreground">
                      This recipe is shared with you by{" "}
                      <strong>{recipe.ownerName}</strong>. You can view it but
                      not edit it.
                    </p>
                  </div>
                )}
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSave)}
                    className="relative"
                  >
                    <RecipeHeader
                      recipe={recipe}
                      isEditMode={isEditMode}
                      canEdit={canEdit}
                      form={form}
                    />

                    <RecipeControls
                      isEditMode={isEditMode}
                      recipe={recipe}
                      onToggleEditMode={handleToggleEditMode}
                      onDelete={handleDelete}
                      onStartCooking={() => setIsCookModeOpen(true)}
                      canEdit={canEdit}
                      isRecipeForEditLoaded={recipeForEdit !== undefined}
                    />

                    {isEditMode && (
                      <EditableRecipeMeta recipe={recipe} form={form} />
                    )}

                    {!isEditMode && <NutritionSection recipe={recipe} />}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <IngredientsSection
                        recipe={recipe}
                        isEditMode={isEditMode}
                        form={form}
                      />
                      <MethodSection
                        recipe={recipe}
                        isEditMode={isEditMode}
                        form={form}
                      />
                    </div>

                    {!isEditMode && recipe.originalUrl && (
                      <div className="mt-6">
                        <RecipeAttribution recipe={recipe} />
                      </div>
                    )}
                  </form>
                </Form>

                {/* Delete Confirmation Dialog */}
                <DeleteRecipeDialog
                  recipe={recipeToDelete}
                  onClose={() => setRecipeToDelete(null)}
                  onConfirm={confirmDelete}
                />

                {/* Cook mode overlay - portal to body for true full screen */}
                {isCookModeOpen && (
                  <CookModeOverlay
                    recipe={recipe}
                    onClose={() => setIsCookModeOpen(false)}
                  />
                )}
              </>
            );
          })()}
    </>
  );
}

function RecipeControls({
  isEditMode,
  onToggleEditMode,
  onDelete,
  recipe,
  onStartCooking,
  canEdit,
  isRecipeForEditLoaded,
}: {
  isEditMode: boolean;
  recipe: NonNullable<Recipe>;
  onToggleEditMode: () => void;
  onDelete: (recipe: NonNullable<Recipe>) => void;
  onStartCooking: () => void;
  canEdit: boolean;
  isRecipeForEditLoaded: boolean;
}) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  return (
    <div
      className={cn(
        "flex items-center flex-wrap gap-3 py-4",
        isEditMode ? "sticky top-0 bg-background border-b" : "",
      )}
    >
      {isEditMode ? (
        <>
          <Button
            type="button"
            size="lg"
            variant="outline"
            onClick={onToggleEditMode}
          >
            <X className="size-4" />
            Cancel
          </Button>
          <Button type="submit" size="lg" className="ml-auto">
            <Save className="size-4" />
            Save Changes
          </Button>
        </>
      ) : (
        <>
          {recipe.method && recipe.method.length > 0 && (
            <Button
              type="button"
              size="lg"
              className="gap-2"
              onClick={onStartCooking}
            >
              <ChefHat className="size-4" aria-hidden />
              Start Cooking
            </Button>
          )}
          {canEdit && (
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={() => setIsShareDialogOpen(true)}
              className="gap-2"
            >
              <Users className="size-4" />
              Share with household
            </Button>
          )}
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="ml-auto">
                <Button
                  type="button"
                  size="lg"
                  variant="ghost"
                  aria-label="More Actions"
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  variant="default"
                  onClick={onToggleEditMode}
                  disabled={!isRecipeForEditLoaded}
                >
                  <Edit className="size-4 mr-2" />
                  Edit Recipe
                  {!isRecipeForEditLoaded && " (Loading...)"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(recipe)}
                  className="text-destructive"
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </>
      )}
      {/* Share to Household Dialog */}
      {canEdit && (
        <ShareToHouseholdDialog
          recipeId={recipe._id}
          recipeTitle={recipe.title}
          open={isShareDialogOpen}
          onOpenChange={setIsShareDialogOpen}
        />
      )}
    </div>
  );
}
