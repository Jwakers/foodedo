type SearchableIngredient = {
  name?: string | null;
};

type RecipeSearchSource = {
  title?: string | null;
  description?: string | null;
  ingredients?: SearchableIngredient[] | null;
};

function normalizeSearchFragment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

export function buildRecipeSearchText(recipe: RecipeSearchSource): string {
  const fragments = [
    recipe.title ?? "",
    recipe.description ?? "",
    ...(recipe.ingredients ?? []).map((ingredient) => ingredient?.name ?? ""),
  ]
    .map(normalizeSearchFragment)
    .filter((fragment) => fragment.length > 0);

  if (fragments.length === 0) {
    return "";
  }

  return Array.from(new Set(fragments.join(" ").split(" ")))
    .filter(Boolean)
    .join(" ");
}
