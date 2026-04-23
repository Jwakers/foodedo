/**
 * Builds schema.org Recipe JSON-LD for public recipe pages (SEO).
 * @see https://schema.org/Recipe
 */

type RecipeForJsonLd = {
  _id: string;
  title: string;
  description?: string | null;
  prepTime: number;
  cookTime?: number | null;
  serves: number;
  category: string;
  image?: string | null;
  ingredients?: Array<{
    name: string;
    amount?: number;
    unit?: string;
    preparation?: string | null;
  }>;
  method?: Array<{
    title: string;
    description?: string | null;
  }>;
  nutrition?: {
    calories?: number;
    protein?: number;
    fat?: number;
    carbohydrates?: number;
  } | null;
  originalAuthor?: string | null;
  originalPublishedDate?: number | null;
  cuisine?: string[] | null;
};

/** Format minutes as ISO 8601 duration (e.g. PT30M). */
function toIsoDuration(minutes: number): string {
  if (minutes <= 0) return "PT0M";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `PT${hours}H${mins}M`;
  if (hours > 0) return `PT${hours}H`;
  return `PT${mins}M`;
}

/** Format a single ingredient for recipeIngredient (e.g. "2 cups flour, sifted"). */
function formatIngredient(ing: {
  name: string;
  amount?: number;
  unit?: string;
  preparation?: string | null;
}): string {
  const parts: string[] = [];
  if (ing.amount != null) parts.push(String(ing.amount));
  if (ing.unit) parts.push(ing.unit);
  parts.push(ing.name);
  let text = parts.join(" ");
  if (ing.preparation) text += `, ${ing.preparation}`;
  return text;
}

export function buildRecipeJsonLd(
  recipe: RecipeForJsonLd,
  recipeUrl: string,
): Record<string, unknown> {
  const totalMins = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    url: recipeUrl,
    ...(recipe.description?.trim() && { description: recipe.description.trim() }),
    ...(recipe.image && { image: recipe.image }),
    ...(recipe.serves > 0 && {
      recipeYield: recipe.serves === 1 ? "1 serving" : `${recipe.serves} servings`,
    }),
    ...(recipe.category && { recipeCategory: recipe.category }),
    ...(recipe.cuisine &&
      recipe.cuisine.length > 0 && {
        recipeCuisine: recipe.cuisine.length === 1 ? recipe.cuisine[0] : recipe.cuisine,
      }),
    ...(recipe.prepTime > 0 && { prepTime: toIsoDuration(recipe.prepTime) }),
    ...(recipe.cookTime != null &&
      recipe.cookTime > 0 && { cookTime: toIsoDuration(recipe.cookTime) }),
    ...(totalMins > 0 && { totalTime: toIsoDuration(totalMins) }),
    ...(recipe.originalAuthor?.trim() && {
      author: {
        "@type": "Person",
        name: recipe.originalAuthor.trim(),
      },
    }),
    ...(recipe.originalPublishedDate != null && {
      datePublished: new Date(recipe.originalPublishedDate).toISOString(),
    }),
  };

  if (recipe.ingredients && recipe.ingredients.length > 0) {
    schema.recipeIngredient = recipe.ingredients.map(formatIngredient);
  }

  if (recipe.method && recipe.method.length > 0) {
    schema.recipeInstructions = recipe.method.map((step) => ({
      "@type": "HowToStep",
      ...(step.title?.trim() && { name: step.title.trim() }),
      ...(step.description?.trim() && { text: step.description.trim() }),
    }));
  }

  if (
    recipe.nutrition &&
    (recipe.nutrition.calories != null ||
      recipe.nutrition.protein != null ||
      recipe.nutrition.fat != null ||
      recipe.nutrition.carbohydrates != null)
  ) {
    const nutrition: Record<string, number | string> = {};
    if (recipe.nutrition.calories != null)
      nutrition.calories = recipe.nutrition.calories;
    if (recipe.nutrition.protein != null)
      nutrition.proteinContent = `${recipe.nutrition.protein} g`;
    if (recipe.nutrition.fat != null)
      nutrition.fatContent = `${recipe.nutrition.fat} g`;
    if (recipe.nutrition.carbohydrates != null)
      nutrition.carbohydrateContent = `${recipe.nutrition.carbohydrates} g`;
    if (Object.keys(nutrition).length > 0) {
      schema.nutrition = {
        "@type": "NutritionInformation",
        ...nutrition,
      };
    }
  }

  return schema;
}
