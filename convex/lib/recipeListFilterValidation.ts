import { v } from "convex/values";
import {
  categoriesUnion as recipeCategoryFilterValidator,
  complexityTierUnion as recipeComplexityFilterValidator,
  primaryProteinUnion as recipeProteinFilterValidator,
} from "../schema";
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
  selectedCategory: v.optional(
    v.union(v.literal("all"), recipeCategoryFilterValidator),
  ),
  selectedProtein: v.optional(
    v.union(v.literal("all"), recipeProteinFilterValidator),
  ),
  selectedDuration: v.optional(recipeDurationFilterValidator),
  selectedComplexity: v.optional(
    v.union(v.literal("all"), recipeComplexityFilterValidator),
  ),
  selectedQuickFilters: v.optional(v.array(recipeQuickFilterValidator)),
});
