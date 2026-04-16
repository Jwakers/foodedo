/**
 * Payload from {@link api.recipes.getHomepageShowcaseRecipes} (serialized for the client).
 */
export type HomepageShowcaseRecipe = {
  _id: string;
  title: string;
  publicSlug: string | null;
  image: string | null;
  prepTime: number;
  cookTime?: number | null;
  totalTimeMinutes?: number;
  category: string;
  primaryProtein?: string | null;
  nutrition?: { calories?: number } | null;
};
