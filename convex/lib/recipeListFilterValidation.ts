import { v } from "convex/values";
import {
  RECIPE_DURATION_FILTER_VALUES,
  RECIPE_QUICK_FILTER_VALUES,
} from "./recipeListFilters";

export const recipeDurationFilterValidator = v.union(
  ...RECIPE_DURATION_FILTER_VALUES.map((value) => v.literal(value)),
);

export const recipeQuickFilterValidator = v.union(
  ...RECIPE_QUICK_FILTER_VALUES.map((value) => v.literal(value)),
);

export const recipeListServerFilterValidator = v.object({
  searchQuery: v.optional(v.string()),
  selectedCategory: v.optional(v.string()),
  selectedProtein: v.optional(v.string()),
  selectedDuration: v.optional(recipeDurationFilterValidator),
  selectedComplexity: v.optional(v.string()),
  selectedQuickFilters: v.optional(v.array(recipeQuickFilterValidator)),
});
