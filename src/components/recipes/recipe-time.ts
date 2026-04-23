import type { RecipeListItem } from "./types";

export function getRecipeTotalMinutes(recipe: RecipeListItem): number {
  if (recipe.totalTimeMinutes != null && recipe.totalTimeMinutes > 0) {
    return recipe.totalTimeMinutes;
  }
  return (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
}

export function isUnder30Minutes(recipe: RecipeListItem): boolean {
  const total = getRecipeTotalMinutes(recipe);
  return total > 0 && total < 30;
}
