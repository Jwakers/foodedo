/**
 * Common pantry staples – shown separately at bottom of shopping list,
 * deselected by default so users opt-in to include them.
 */

import { normaliseNameForGrouping } from "convex/lib/ingredientGrouping";

export const PANTRY_STAPLE_NAMES = new Set([
  // Salt & pepper
  "salt",
  "table salt",
  "sea salt",
  "black pepper",
  "pepper (spice)",
  "white pepper",
  // Oils
  "olive oil",
  "extra virgin olive oil",
  "vegetable oil",
  "canola oil",
  "sunflower oil",
  "rapeseed oil",
  // Baking
  "flour",
  "all purpose flour",
  "plain flour",
  "self raising flour",
  "baking powder",
  "baking soda",
  "bicarbonate of soda",
  "sugar",
  // Dairy & fats
  "butter",
  "milk",
  // Condiments & liquids
  "vinegar",
  "white vinegar",
  // Other
  "water",
]);

export function isPantryStaple(name: string): boolean {
  const normalised = normaliseNameForGrouping(name);
  return normalised.length > 0 && PANTRY_STAPLE_NAMES.has(normalised);
}
