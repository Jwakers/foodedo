/**
 * Ingredient food groups (broad taxonomy) used for categorization.
 *
 * Mirrors `convex/lib/ingredientFoodGroups.ts`.
 * Keep these in sync when new food groups appear.
 */

export const INGREDIENT_FOOD_GROUPS = [
  "Animal foods",
  "Aquatic foods",
  "Baby foods",
  "Baking goods",
  "Beverages",
  "Cereals and cereal products",
  "Cocoa and cocoa products",
  "Coffee and coffee products",
  "Confectioneries",
  "Dishes",
  "Eggs",
  "Fats and oils",
  "Fruits",
  "Gourds",
  "Herbs and spices",
  "Milk and milk products",
  "Nuts",
  "Pulses",
  "Snack foods",
  "Soy",
  "Teas",
  "Vegetables",
] as const;

export type IngredientFoodGroup = (typeof INGREDIENT_FOOD_GROUPS)[number];
