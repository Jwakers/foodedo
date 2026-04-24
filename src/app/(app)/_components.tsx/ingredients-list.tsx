import { scaleNumericAmountForServings } from "convex/lib/servings";

type Ingredient = {
  name: string;
  amount?: number;
  unit?: string;
  preparation?: string | null;
};

function scaledAmount(
  ingredient: Ingredient,
  ratio: number,
): number | undefined {
  if (ingredient.amount === undefined) return undefined;
  const scaled = scaleNumericAmountForServings(ingredient.amount, ratio, {
    ingredientName: ingredient.name,
    unit: ingredient.unit,
  });
  return typeof scaled === "number" ? scaled : undefined;
}

export function IngredientsList(props: {
  ingredients: Ingredient[];
  sourceServings?: number;
  targetServings?: number;
}) {
  const ratio =
    props.sourceServings &&
    props.sourceServings > 0 &&
    props.targetServings &&
    props.targetServings > 0
      ? props.targetServings / props.sourceServings
      : 1;
  return (
    <ul className="space-y-2">
      {props.ingredients.map((ingredient, index) => (
        <li
          key={`${index}-${ingredient.name}-${ingredient.amount}-${ingredient.unit}`}
          className="space-x-1"
        >
          {ingredient.amount !== undefined ? (
            <span className="font-medium">
              {scaledAmount(ingredient, ratio)}
            </span>
          ) : null}
          {ingredient.unit ? <span>{ingredient.unit}</span> : null}
          {ingredient.name ? (
            <span className="capitalize">{ingredient.name}</span>
          ) : null}
          {ingredient.preparation ? (
            <span className="text-muted-foreground italic capitalize">
              - {ingredient.preparation}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
