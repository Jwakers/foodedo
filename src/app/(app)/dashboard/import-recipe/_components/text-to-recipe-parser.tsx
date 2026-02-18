"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { TEXT_LIMITS } from "convex/lib/constants";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  ImagePlus,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

type TextToRecipeParserProps = {
  onRecipeParsed: (text: string) => Promise<void>;
  showAsError?: boolean;
};

export function TextToRecipeParser({
  onRecipeParsed,
  showAsError = false,
}: TextToRecipeParserProps) {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!text.trim()) {
      setError("Please enter some recipe text");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onRecipeParsed(text);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setText("");
    setError(null);
  };

  const characterCount = text.length;
  const isNearLimit = characterCount > TEXT_LIMITS.RECIPE_TEXT_MAX_LENGTH * 0.9;
  const isOverLimit = characterCount > TEXT_LIMITS.RECIPE_TEXT_MAX_LENGTH;

  return (
    <Card className={cn(showAsError && "border-muted-foreground/20")}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              {showAsError
                ? "Try Pasting Recipe Text Instead"
                : "Import Recipe from Text"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {showAsError
                ? "Paste your recipe below and we&apos;ll organise it for you"
                : "Copy and paste any recipe text, and we&apos;ll organise it"}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Instructions */}
        {!showAsError && (
          <Alert>
            <Sparkles className="size-4" />
            <AlertTitle>How it works</AlertTitle>
            <AlertDescription>
              Copy recipe text from anywhere - a website, a message, or your own
              notes. We&apos;ll organise the ingredients, instructions, and even
              work out nutrition info for you.
            </AlertDescription>
          </Alert>
        )}

        {/* Image notice */}
        <Alert>
          <ImagePlus className="size-4" />
          <AlertDescription>
            <span className="font-medium">Note:</span> Images aren&apos;t
            included with this method. You&apos;ll be able to add your own image
            after saving.
          </AlertDescription>
        </Alert>

        {/* Textarea */}
        <div className="space-y-2">
          <label
            htmlFor="recipe-text"
            className="text-sm font-medium text-foreground"
          >
            Recipe Text
          </label>
          <Textarea
            id="recipe-text"
            placeholder={`Paste your recipe here...

For example:

Chocolate Chip Cookies

Ingredients:
- 2 cups flour
- 1 cup butter
- 1 cup sugar
- 2 eggs
- 1 tsp vanilla
- 1 cup chocolate chips

Instructions:
1. Preheat oven to 350°F
2. Mix butter and sugar until creamy
3. Add eggs and vanilla
4. Stir in flour
5. Fold in chocolate chips
6. Bake for 12 minutes`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isLoading}
            className="min-h-[300px] font-mono text-sm"
          />
          <div className="flex justify-between items-center text-xs">
            <p className="text-muted-foreground">
              Minimum {TEXT_LIMITS.RECIPE_TEXT_MIN_LENGTH} characters, maximum{" "}
              {TEXT_LIMITS.RECIPE_TEXT_MAX_LENGTH.toLocaleString()} characters
            </p>
            <p
              className={cn(
                isOverLimit
                  ? "text-destructive font-medium"
                  : isNearLimit
                    ? "text-muted-foreground font-medium"
                    : "text-muted-foreground",
              )}
            >
              {characterCount.toLocaleString()} /{" "}
              {TEXT_LIMITS.RECIPE_TEXT_MAX_LENGTH.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Couldn&apos;t create recipe</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={handleImport}
            disabled={
              !text.trim() || isLoading || text.length < 50 || isOverLimit
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Creating Recipe...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 size-4" />
                Create Recipe
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={isLoading}
          >
            Clear
          </Button>
        </div>

        {/* Help text */}
        <div className="pt-2 space-y-2 text-sm text-muted-foreground border-t">
          <p className="font-medium">Tips for best results:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Include your ingredients and cooking steps</li>
            <li>The more detail, the better</li>
            <li>Don&apos;t worry about formatting - we&apos;ll handle it</li>
            <li>Recipe name and description will be created if needed</li>
            <li>
              Nutrition info can be worked out automatically if not provided
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// Success message component for when recipe is created
export function RecipeParsedSuccess({
  onContinue,
}: {
  onContinue: () => void;
}) {
  return (
    <Alert>
      <CheckCircle2 className="size-4" />
      <AlertTitle>Recipe created successfully!</AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          Your recipe has been organised with ingredients, cooking steps, and
          nutrition information.
        </p>
        <Button onClick={onContinue} size="sm" className="mt-2">
          Review Recipe
        </Button>
      </AlertDescription>
    </Alert>
  );
}
