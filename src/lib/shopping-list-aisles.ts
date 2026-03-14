import type { IngredientFoodGroup } from "@/lib/ingredient-food-groups";

/**
 * Aisle-style categories for the shopping list. Maps fine-grained food groups
 * (from ingredient data) to broad supermarket-aisle categories.
 *
 * Update FOOD_GROUP_TO_AISLE when new food groups appear in the ingredient seed.
 */

/** Display order for aisles (lower = earlier) */
export const AISLE_ORDER = [
  "Protein",
  "Dairy",
  "Vegetables",
  "Fruit",
  "Bakery & Grains",
  "Herbs & Spices",
  "Pantry",
  "Other",
] as const;

export type AisleCategory = (typeof AISLE_ORDER)[number];

/** Lowercase food group keys for case-insensitive lookup */
type LowercaseFoodGroup = Lowercase<IngredientFoodGroup>;

/**
 * Maps ingredient foodGroup (lowercased) to broad aisle categories.
 * Keys must be lowercase IngredientFoodGroup; unmapped groups fall back to "Other".
 */
const FOOD_GROUP_TO_AISLE: Partial<Record<LowercaseFoodGroup, AisleCategory>> = {
  // Protein
  "animal foods": "Protein",
  "aquatic foods": "Protein",
  eggs: "Protein",

  // Dairy
  "milk and milk products": "Dairy",

  // Vegetables
  vegetables: "Vegetables",
  gourds: "Vegetables",

  // Fruit
  fruits: "Fruit",

  // Bakery & Grains
  "cereals and cereal products": "Bakery & Grains",
  "baking goods": "Bakery & Grains",

  // Herbs & Spices
  "herbs and spices": "Herbs & Spices",

  // Pantry
  "fats and oils": "Pantry",
  pulses: "Pantry",
  nuts: "Pantry",
  soy: "Pantry",
  teas: "Pantry",
  "coffee and coffee products": "Pantry",
  "cocoa and cocoa products": "Pantry",
  confectioneries: "Pantry",
  "baby foods": "Pantry",
  beverages: "Pantry",
  "snack foods": "Pantry",

  // Other
  dishes: "Other",
  unclassified: "Other",
};

/**
 * Returns the aisle category for a given food group (from ingredient data).
 * Falls back to "Other" when no mapping exists.
 */
export function getAisleForFoodGroup(foodGroup: string | undefined): AisleCategory {
  if (!foodGroup?.trim()) return "Other";
  const key = foodGroup.trim().toLowerCase() as LowercaseFoodGroup;
  return FOOD_GROUP_TO_AISLE[key] ?? "Other";
}
