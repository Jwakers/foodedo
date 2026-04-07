import type { Id } from "convex/_generated/dataModel";

export type RecipeListItem = {
  _id: Id<"recipes">;
  title: string;
  description?: string | null;
  prepTime: number;
  cookTime?: number | null;
  serves: number;
  category: string;
  image?: string | null;
  updatedAt?: number;
  _creationTime?: number;
  isGeneratorEligible?: boolean | null;
  /** User opted out of the weekly meal plan generator for this recipe. */
  excludeFromMealPlanGenerator?: boolean | null;
  primaryProtein?: string | null;
  complexityTier?: string | null;
  totalTimeMinutes?: number | null;
  /** Public discover URL segment (system recipes). */
  publicSlug?: string | null;
};
