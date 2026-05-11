"use client";

import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import { ROUTES } from "@/app/constants";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMutation } from "convex/react";
import { ChefHat, Clock, Trash2, Users as UsersIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import type { Recipe } from "../page";

interface HouseholdRecipeListProps {
  recipes: Recipe[];
  householdId: Id<"households">;
  canLoadMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  hasActiveFilters?: boolean;
}

export function HouseholdRecipeList({
  recipes,
  householdId,
  canLoadMore,
  loadingMore,
  onLoadMore,
  hasActiveFilters = false,
}: HouseholdRecipeListProps) {
  const [recipeToUnshare, setRecipeToUnshare] = useState<Recipe | null>(null);
  const [isUnsharing, setIsUnsharing] = useState(false);
  const unshareRecipe = useMutation(api.households.unshareRecipeFromHousehold);

  const handleUnshareRecipe = async () => {
    if (!recipeToUnshare) return;

    setIsUnsharing(true);
    try {
      await unshareRecipe({
        recipeId: recipeToUnshare._id,
        householdId,
      });
      toast.success("Recipe unshared successfully");
      setRecipeToUnshare(null);
    } catch (error) {
      console.error("Error unsharing recipe:", error);
      toast.error("Failed to unshare recipe");
    } finally {
      setIsUnsharing(false);
    }
  };

  if (recipes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <ChefHat className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {hasActiveFilters ? "No matching recipes" : "No recipes yet"}
          </h3>
          <p className="text-muted-foreground text-center max-w-md mb-4">
            {hasActiveFilters
              ? "Try adjusting your search or filters."
              : "Share your recipes with this household to get started"}
          </p>
          {!hasActiveFilters ? (
            <Button asChild>
              <Link href={ROUTES.MY_RECIPES}>Go to My Recipes</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recipes.map((recipe) => (
          <Card key={recipe._id} className="overflow-hidden group pt-0">
            <Link href={`/recipe/${recipe._id}`}>
              <div className="relative aspect-video bg-muted">
                {recipe.image ? (
                  <Image
                    src={recipe.image}
                    alt={recipe.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ChefHat className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
            </Link>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <Link href={`/recipe/${recipe._id}`} className="flex-1">
                  <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">
                    {recipe.title}
                  </CardTitle>
                </Link>
                {recipe.isOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setRecipeToUnshare(recipe)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                )}
              </div>
              <CardDescription className="line-clamp-2">
                {recipe.description || "No description"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Clock className="size-4" />
                  <span>{recipe.prepTime + (recipe.cookTime || 0)} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <UsersIcon className="size-4" />
                  <span>{recipe.serves}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="capitalize">
                  {recipe.category}
                </Badge>
                <div className="text-xs text-muted-foreground">
                  by {recipe.owner}
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground border-t pt-2">
                Shared by {recipe.sharedBy}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {(canLoadMore || loadingMore) && (
        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={onLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading more..." : "Load more recipes"}
          </Button>
        </div>
      )}

      <AlertDialog
        open={recipeToUnshare !== null}
        onOpenChange={(open) => !open && setRecipeToUnshare(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unshare Recipe</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unshare &quot;{recipeToUnshare?.title}
              &quot; from this household? Members will no longer be able to view
              this recipe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnsharing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnshareRecipe}
              disabled={isUnsharing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUnsharing ? "Unsharing..." : "Unshare Recipe"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
