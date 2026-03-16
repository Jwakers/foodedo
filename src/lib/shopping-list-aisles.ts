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
 * Aquatic food sub-groups that are plant-based (e.g. seaweed). These are mapped
 * to Vegetables (or Herbs & Spices) instead of Protein.
 */
const AQUATIC_PLANT_SUB_GROUPS = new Set([
  "seaweed", // kombu, kelp, nori, etc.
]);

/**
 * Maps ingredient foodGroup (lowercased) to broad aisle categories.
 * Keys must be lowercase IngredientFoodGroup; unmapped groups fall back to "Other".
 * Note: "aquatic foods" is overridden by sub-group for plant-based aquatic (e.g. seaweed).
 */
const FOOD_GROUP_TO_AISLE: Partial<Record<LowercaseFoodGroup, AisleCategory>> =
  {
    // Protein (animal aquatic only; plant aquatic handled in getAisleForFoodGroupAndSubGroup)
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
    "Herbs and spices": "Herbs & Spices",

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
export function getAisleForFoodGroup(
  foodGroup: string | undefined,
): AisleCategory {
  if (!foodGroup?.trim()) return "Other";
  const key = foodGroup.trim().toLowerCase() as LowercaseFoodGroup;
  return FOOD_GROUP_TO_AISLE[key] ?? "Other";
}

/**
 * Returns the aisle category using both food group and sub-group.
 * Aquatic plant products (e.g. seaweed, kombu) are mapped to Vegetables instead of Protein.
 */
export function getAisleForFoodGroupAndSubGroup(
  foodGroup: string | undefined,
  foodSubGroup: string | undefined,
): AisleCategory {
  const groupKey = foodGroup?.trim().toLowerCase();
  const subKey = foodSubGroup?.trim().toLowerCase();
  if (
    groupKey === "aquatic foods" &&
    subKey &&
    AQUATIC_PLANT_SUB_GROUPS.has(subKey)
  ) {
    return "Vegetables";
  }
  return getAisleForFoodGroup(foodGroup);
}
