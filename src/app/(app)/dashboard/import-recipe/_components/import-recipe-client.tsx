"use client";

import { IngredientsList } from "@/app/(app)/_components.tsx/ingredients-list";
import { MethodList } from "@/app/(app)/_components.tsx/method-list";
import { Nutrition } from "@/app/(app)/_components.tsx/nutrition";
import { ROUTES } from "@/app/constants";
import { cn } from "@/lib/utils";
import { MultiImageUpload, type ImagePreview } from "@/components/image-upload";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { type RecipeImportFormData } from "@/lib/schemas/recipe";
import { type ParsedRecipeForDB } from "@/lib/types/recipe-parser";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ChefHat,
  Clock,
  FileText,
  Globe,
  Loader2,
  Sparkles,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { EditImportedRecipe } from "./edit-imported-recipe";
import { usePhotoImport } from "./hooks/use-photo-import";
import {
  type RecipeCreationSource,
  useRecipeSave,
} from "./hooks/use-recipe-save";
import { useTextImport } from "./hooks/use-text-import";
import { useUrlImport } from "./hooks/use-url-import";
import { TextToRecipeParser } from "./text-to-recipe-parser";

type ImportSource = "url" | "text" | "photo";

function importSourceToCreationSource(
  source: ImportSource,
): RecipeCreationSource {
  switch (source) {
    case "url":
      return "imported_website";
    case "text":
      return "imported_text";
    case "photo":
      return "imported_photograph";
  }
}

export function ImportRecipeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [url, setUrl] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [showTextParser, setShowTextParser] = useState(false);
  const [showPhotoParser, setShowPhotoParser] = useState(false);
  const [photoImages, setPhotoImages] = useState<ImagePreview[]>([]);
  const [importSource, setImportSource] = useState<ImportSource>("url");

  // Use custom hooks for different import methods
  const urlImport = useUrlImport();
  const textImport = useTextImport();
  const photoImport = usePhotoImport();
  const recipeSave = useRecipeSave();

  // Determine which import state to use based on source
  const getActiveImportState = () => {
    switch (importSource) {
      case "text":
        return textImport;
      case "photo":
        return photoImport;
      default:
        return urlImport;
    }
  };

  const activeImport = getActiveImportState();
  const parsedRecipe = activeImport.parsedRecipe;
  const loadingStage = activeImport.loadingStage;
  const error = activeImport.error;

  // Check for photo mode from query parameter
  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "photo") {
      setShowPhotoParser(true);
      setImportSource("photo");
    }
  }, [searchParams]);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !urlImport.isValidUrl(url)) return;

    setImportSource("url");
    await urlImport.handleImport(url);
  };

  const clearAll = () => {
    setUrl("");
    urlImport.reset();
    textImport.reset();
    photoImport.reset();
    recipeSave.reset();
    setIsEditMode(false);
    setShowTextParser(false);
    setShowPhotoParser(false);
    setPhotoImages([]);
  };

  const handlePhotoRecipeParsed = async (images: ImagePreview[]) => {
    if (images.length === 0) {
      photoImport.reset();
      return;
    }

    setImportSource("photo");
    const result = await photoImport.handlePhotoRecipeParsed(images);

    if (result?.isPartial) {
      setShowPhotoParser(false);
      setIsEditMode(true);
    } else if (result?.success) {
      setShowPhotoParser(false);
    }
  };

  const handleTextRecipeParsed = async (text: string) => {
    setImportSource("text");
    const result = await textImport.handleTextRecipeParsed(text);

    if (result?.isPartial) {
      setShowTextParser(false);
      setIsEditMode(true);
    } else if (result?.success) {
      setShowTextParser(false);
    }
  };

  // Warn user before leaving if recipe is not saved
  useEffect(() => {
    const hasUnsavedRecipe = parsedRecipe && !recipeSave.isSaved;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedRecipe) {
        e.preventDefault();
        return "";
      }
    };

    if (hasUnsavedRecipe) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [parsedRecipe, recipeSave.isSaved]);

  // Redirect to recipe page after successful save
  useEffect(() => {
    if (recipeSave.isSaved && recipeSave.savedRecipeId) {
      // Small delay to allow user to see success state
      const timeout = setTimeout(() => {
        router.push(`${ROUTES.RECIPE}/${recipeSave.savedRecipeId}`);
      }, 1500);

      return () => clearTimeout(timeout);
    }
  }, [recipeSave.isSaved, recipeSave.savedRecipeId, router]);

  const handleSave = async () => {
    if (!parsedRecipe || recipeSave.isSaving || recipeSave.isSaved) return;
    const result = await recipeSave.validateAndSaveRecipe(
      parsedRecipe,
      parsedRecipe,
      importSourceToCreationSource(importSource),
    );
    if (result.shouldEdit) {
      setIsEditMode(true);
    }
  };

  const handleEditSave = async (editedRecipe: RecipeImportFormData) => {
    if (recipeSave.isSaving || recipeSave.isSaved) return;
    const result = await recipeSave.validateAndSaveRecipe(
      editedRecipe,
      parsedRecipe,
      importSourceToCreationSource(importSource),
    );
    if (result.shouldEdit) {
      setIsEditMode(true);
    }
  };

  const isLoading = loadingStage !== "idle" && loadingStage !== "complete";

  // Edit Mode
  if (isEditMode && parsedRecipe && !recipeSave.isSaved) {
    return (
      <div className="bg-background">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <EditImportedRecipe
            recipe={parsedRecipe}
            onCancel={() => setIsEditMode(false)}
            onSave={handleEditSave}
            isSaving={recipeSave.isSaving}
          />
        </div>
      </div>
    );
  }

  // Success State - Show briefly before redirect
  if (recipeSave.isSaved && recipeSave.savedRecipeId) {
    return (
      <div className="bg-background flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-primary/10 p-6">
              <CheckCircle2 className="h-16 w-16 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3">
            Recipe Saved Successfully!
          </h1>
          <p className="text-muted-foreground text-lg mb-4">
            Your recipe has been added to your collection.
          </p>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm">Redirecting to recipe...</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            className="size-10"
            onClick={(e) => {
              if (parsedRecipe && !recipeSave.isSaved) {
                const confirmed = window.confirm(
                  "You have an unsaved recipe. Are you sure you want to leave?",
                );
                if (!confirmed) {
                  e.preventDefault();
                  return;
                }
              }
              router.push(ROUTES.MY_RECIPES);
            }}
          >
            <ArrowLeft className="size-5" />
            <span className="sr-only">Back</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Import Recipe
            </h1>
            <p className="text-muted-foreground mt-1">
              Import recipes from a variety of sources
            </p>
          </div>
        </div>

        {/* Main Card - URL Import */}
        {!isLoading && !parsedRecipe && !showTextParser && !showPhotoParser && (
          <>
            <Card className="p-6 md:p-8 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Globe className="size-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Enter Recipe URL</h2>
                  <p className="text-sm text-muted-foreground">
                    Paste the URL of the recipe you want to import
                  </p>
                </div>
              </div>

              <form onSubmit={handleImport} className="space-y-6">
                {/* URL Input */}
                <div className="space-y-2">
                  <label
                    htmlFor="recipe-url"
                    className="text-sm font-medium text-foreground"
                  >
                    Recipe URL
                  </label>
                  <Input
                    id="recipe-url"
                    type="url"
                    placeholder="https://www.allrecipes.com/recipe/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="text-base"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supported sites include AllRecipes, BBC Good Food, Food
                    Network, and many more
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={!url || !urlImport.isValidUrl(url) || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 size-4" />
                        Import Recipe
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearAll}
                    disabled={isLoading}
                  >
                    Clear
                  </Button>
                </div>
              </form>

              {/* Error Message with Text Parser CTA */}
              {error && (
                <div className="mt-6 space-y-3">
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive font-medium">
                      {error}
                    </p>
                  </div>
                  <Alert>
                    <FileText className="size-4" />
                    <AlertTitle>Can&apos;t import from URL?</AlertTitle>
                    <AlertDescription>
                      <p className="mb-2">
                        Try pasting the recipe text directly instead. We&apos;ll
                        organise it for you automatically.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTextParser(true)}
                        className="mt-2"
                      >
                        <FileText className="mr-2 size-4" />
                        Paste Recipe Text
                      </Button>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </Card>

            {/* Subtle CTA for Text Parser (when no error) */}
            {!error && (
              <Card className="p-4 mb-6 bg-muted/30">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <FileText className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Have recipe text instead?
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Paste any recipe text and we&apos;ll organise it
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTextParser(true)}
                  >
                    <FileText className="mr-2 size-4" />
                    Paste Text
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}

        {/* Text Parser Component */}
        {showTextParser && !isLoading && !parsedRecipe && (
          <div className="space-y-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTextParser(false)}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 size-4" />
              Back to URL Import
            </Button>
            <TextToRecipeParser
              onRecipeParsed={handleTextRecipeParsed}
              showAsError={!!error}
            />
          </div>
        )}

        {/* Photo Parser Component */}
        {showPhotoParser && !isLoading && !parsedRecipe && (
          <div className="space-y-4 mb-6">
            <Card className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-accent/10 rounded-lg">
                  <Camera className="size-6 text-accent-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Photograph Recipe</h2>
                  <p className="text-sm text-muted-foreground">
                    Take photos or upload images of recipe pages
                  </p>
                </div>
              </div>

              {/* Tips for best results */}
              <Alert className="mb-6">
                <Sparkles className="size-4" />
                <AlertTitle>Tips for best results</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                    <li>Ensure good lighting - avoid shadows and glare</li>
                    <li>Keep the camera steady to avoid blurry images</li>
                    <li>Make sure all text is clearly visible and in focus</li>
                    <li>Capture the entire recipe page in the frame</li>
                    <li>Take photos straight-on rather than at an angle</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <MultiImageUpload
                maxImages={3}
                onImagesChange={setPhotoImages}
                showCamera={true}
              />

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button
                  onClick={() => handlePhotoRecipeParsed(photoImages)}
                  className="flex-1"
                  disabled={photoImages.length === 0 || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Parsing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 size-4" />
                      Parse Recipe
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearAll}
                  disabled={isLoading}
                >
                  Clear
                </Button>
              </div>

              {error && (
                <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive font-medium">
                    {error}
                  </p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Loading Progress */}
        {isLoading && (
          <Card className="p-6 mb-6">
            <div className="space-y-4">
              <LoadingStep
                stage="fetching"
                currentStage={loadingStage}
                title={
                  importSource === "url"
                    ? "Gathering ingredients"
                    : importSource === "photo"
                      ? "Reading recipe images"
                      : "Reading your recipe"
                }
                description={
                  importSource === "url"
                    ? "Fetching all the tasty details..."
                    : importSource === "photo"
                      ? "Reading recipe from images..."
                      : "Making sense of everything..."
                }
              />
              <LoadingStep
                stage="categorising"
                currentStage={loadingStage}
                title="Organising the kitchen"
                description={
                  importSource === "url"
                    ? "Sorting ingredients, steps, and all the good stuff..."
                    : importSource === "photo"
                      ? "Extracting ingredients and instructions from images..."
                      : "Arranging ingredients, adding some polish, and working out the details..."
                }
              />
            </div>
          </Card>
        )}

        {/* Recipe Preview */}
        {parsedRecipe && loadingStage === "complete" && (
          <RecipePreview recipe={parsedRecipe} isSaved={recipeSave.isSaved} />
        )}

        {/* Save Buttons */}
        {parsedRecipe && loadingStage === "complete" && !recipeSave.isSaved && (
          <div className="sticky bottom-nav flex gap-3 mt-4">
            <Button
              variant="outline"
              size="lg"
              disabled={isLoading || recipeSave.isSaving || recipeSave.isSaved}
              onClick={() => setIsEditMode(true)}
            >
              Edit Recipe
            </Button>
            <Button
              className="flex-1"
              size="lg"
              disabled={isLoading || recipeSave.isSaving || recipeSave.isSaved}
              onClick={handleSave}
            >
              {recipeSave.isSaving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Recipe"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

type LoadingStage = "idle" | "fetching" | "categorising" | "complete";

// Loading Step Component
function LoadingStep({
  stage,
  currentStage,
  title,
  description,
}: {
  stage: LoadingStage;
  currentStage: LoadingStage;
  title: string;
  description: string;
}) {
  const stages: LoadingStage[] = [
    "idle",
    "fetching",
    "categorising",
    "complete",
  ];
  const currentIndex = stages.indexOf(currentStage);
  const stageIndex = stages.indexOf(stage);

  const isActive = currentIndex === stageIndex;
  const isComplete = currentIndex > stageIndex;

  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 mt-0.5">
        {isComplete ? (
          <CheckCircle2 className="size-5 text-green-500" />
        ) : isActive ? (
          <Loader2 className="size-5 text-primary animate-spin" />
        ) : (
          <div className="size-5 rounded-full border-2 border-muted" />
        )}
      </div>
      <div>
        <p
          className={cn(
            "font-medium",
            isActive || isComplete
              ? "text-foreground"
              : "text-muted-foreground",
          )}
        >
          {title}
        </p>
        {isActive && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}

// Recipe Preview Component
function RecipePreview({
  recipe,
  isSaved,
}: {
  recipe: ParsedRecipeForDB;
  isSaved: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Success Message */}
      <Alert variant="default">
        <CheckCircle2 />
        <AlertTitle>
          <div className="flex items-center justify-between gap-2">
            <p>Recipe imported successfully!</p>
            {!isSaved && <Badge variant="outline">Not saved</Badge>}
          </div>
        </AlertTitle>
        <AlertDescription>
          Review the imported recipe below and make any changes before saving.
        </AlertDescription>
      </Alert>

      {/* Recipe Header */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">{recipe.title}</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              {recipe.description && (
                <p className="text-muted-foreground">{recipe.description}</p>
              )}
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-4">
              {recipe.prepTime > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Prep:</span>
                  <span className="font-medium">{recipe.prepTime} min</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <ChefHat className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Cook:</span>
                <span className="font-medium">
                  {recipe.cookTime === undefined || recipe.cookTime === 0
                    ? "No cooking required"
                    : `${recipe.cookTime} min`}
                </span>
              </div>
              {recipe.serves > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Serves:</span>
                  <span className="font-medium">{recipe.serves}</span>
                </div>
              )}
              <Badge variant="secondary" className="capitalize">
                {recipe.category}
              </Badge>
            </div>

            {recipe.imageUrl && (
              <div className="relative aspect-video rounded-lg overflow-hidden">
                <Image
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  className="object-cover"
                  fill
                  unoptimized
                />
              </div>
            )}
          </div>
        </CardContent>
        {(recipe.originalAuthor || recipe.originalUrl || recipe.rating) && (
          <>
            <Separator />
            <CardFooter>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Source Information
                </p>
                {recipe.originalAuthor && (
                  <p className="text-sm text-muted-foreground">
                    By{" "}
                    <span className="font-medium">{recipe.originalAuthor}</span>
                  </p>
                )}
                {recipe.originalUrl && (
                  <p className="text-sm">
                    <a
                      href={recipe.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      View original recipe →
                    </a>
                  </p>
                )}
              </div>
            </CardFooter>
          </>
        )}
      </Card>

      {/* Nutrition (if available) */}
      {recipe.nutrition && (
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold">Nutrition Information</h3>
          </CardHeader>
          <CardContent>
            <Nutrition nutrition={recipe.nutrition} />
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground mb-4 italic">
              Note: These are estimated values and may not be accurate.
            </p>
          </CardFooter>
        </Card>
      )}

      {/* Ingredients */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold">Ingredients</h3>
        </CardHeader>
        <CardContent>
          <IngredientsList ingredients={recipe.ingredients} />
        </CardContent>
      </Card>

      {/* Method */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold">Method</h3>
        </CardHeader>
        <CardContent>
          <MethodList method={recipe.method} />
        </CardContent>
      </Card>
    </div>
  );
}
