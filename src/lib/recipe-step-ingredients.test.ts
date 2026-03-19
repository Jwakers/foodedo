/**
 * Run with: pnpm exec tsx src/lib/recipe-step-ingredients.test.ts
 */

import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import {
  getRecipeIngredientIndicesForStep,
  getRecipeIngredientsForStep,
  normaliseIngredientName,
  normaliseTextForIngredientMatch,
  type CanonicalIngredientForMatch,
  type RecipeIngredientLine,
} from "./recipe-step-ingredients";

function runTests(): boolean {
  let failed = 0;
  const test = (name: string, fn: () => void) => {
    try {
      fn();
      console.log(`  ✓ ${name}`);
    } catch (e) {
      failed++;
      console.error(`  ✗ ${name}`, e);
    }
  };

  console.log("🧪 recipe-step-ingredients\n");

  test("normaliseIngredientName collapses spaces", () => {
    assert.equal(normaliseIngredientName("  Olive   Oil  "), "olive oil");
  });

  test("normaliseTextForIngredientMatch strips punctuation", () => {
    assert.equal(
      normaliseTextForIngredientMatch("Stir, then add—oil!"),
      "stir then add oil",
    );
  });

  test("multi-word ingredient matches in step", () => {
    const lines: RecipeIngredientLine[] = [
      { name: "olive oil", amount: 2, unit: "tbsp" },
      { name: "salt" },
    ];
    const idx = getRecipeIngredientIndicesForStep(
      { title: "Dress", description: "Whisk in the olive oil." },
      lines,
      undefined,
    );
    assert.deepEqual(idx, [0]);
  });

  test("alias match via canonical doc", () => {
    const lines: RecipeIngredientLine[] = [
      { name: "cilantro", ingredientId: "ing1" },
    ];
    const docs: Record<string, CanonicalIngredientForMatch> = {
      ing1: {
        name: "coriander leaf",
        displayName: "Cilantro",
        aliases: ["coriander", "fresh coriander"],
      },
    };
    const idx = getRecipeIngredientIndicesForStep(
      { title: "Finish", description: "Sprinkle chopped coriander on top." },
      lines,
      docs,
    );
    assert.deepEqual(idx, [0]);
  });

  test("longer ingredient wins span over shorter (ice cream vs cream)", () => {
    const lines: RecipeIngredientLine[] = [
      { name: "cream" },
      { name: "ice cream", amount: 1, unit: "cup" },
    ];
    const idx = getRecipeIngredientIndicesForStep(
      { title: "Dessert", description: "Fold in the ice cream gently." },
      lines,
      undefined,
    );
    // Only ice cream line should match; "cream" substring is inside ice cream span
    assert.deepEqual(idx, [1]);
  });

  test("same line uses longest phrase first (sour cream)", () => {
    const lines: RecipeIngredientLine[] = [
      {
        name: "dairy",
        ingredientId: "d1",
      },
    ];
    const docs: Record<string, CanonicalIngredientForMatch> = {
      d1: {
        name: "cream",
        aliases: ["sour cream"],
      },
    };
    const idx = getRecipeIngredientIndicesForStep(
      { title: "Mix", description: "Add sour cream and stir." },
      lines,
      docs,
    );
    assert.deepEqual(idx, [0]);
    const matched = getRecipeIngredientsForStep(
      { title: "Mix", description: "Add sour cream and stir." },
      lines,
      docs,
    );
    assert.equal(matched.length, 1);
    assert.equal(matched[0]!.name, "dairy");
  });

  test("no false match for unrelated substring (olive vs olive oil line only)", () => {
    const lines: RecipeIngredientLine[] = [{ name: "olive oil" }];
    const idx = getRecipeIngredientIndicesForStep(
      { title: "Note", description: "Olives are optional on the side." },
      lines,
      undefined,
    );
    assert.deepEqual(idx, []);
  });

  test("returns indices in recipe order", () => {
    const lines: RecipeIngredientLine[] = [
      { name: "butter" },
      { name: "garlic" },
      { name: "milk" },
    ];
    const idx = getRecipeIngredientIndicesForStep(
      {
        title: "Cook",
        description: "Melt butter, add garlic, then milk.",
      },
      lines,
      undefined,
    );
    assert.deepEqual(idx, [0, 1, 2]);
  });

  test("partial match: red onion matches when step says sliced onion", () => {
    const lines: RecipeIngredientLine[] = [
      { name: "red onion", amount: 1, preparation: "sliced" },
    ];
    const idx = getRecipeIngredientIndicesForStep(
      { title: "Sauté", description: "Add the sliced onion and cook until soft." },
      lines,
      undefined,
    );
    assert.deepEqual(idx, [0]);
  });

  test("partial match: cremini mushrooms matches when step says mushrooms", () => {
    const lines: RecipeIngredientLine[] = [
      { name: "cremini mushrooms", amount: 200, unit: "g" },
    ];
    const idx = getRecipeIngredientIndicesForStep(
      { title: "Cook", description: "Stir in the mushrooms and season." },
      lines,
      undefined,
    );
    assert.deepEqual(idx, [0]);
  });

  test("ambiguous token beef: step says beef only -> match neither (no false positive for beef broth)", () => {
    const lines: RecipeIngredientLine[] = [
      { name: "boneless beef chuck roast" },
      { name: "beef broth", amount: 1, unit: "cup" },
    ];
    const idx = getRecipeIngredientIndicesForStep(
      {
        title: "Season",
        description:
          "Season beef pieces evenly on all sides with 3 1/2 teaspoons salt, 2 teaspoons pepper, and garlic powder.",
      },
      lines,
      undefined,
    );
    assert.deepEqual(idx, []);
  });

  console.log(`\nDone. Failed: ${failed}`);
  return failed === 0;
}

const isMain =
  typeof process !== "undefined" &&
  process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  const ok = runTests();
  process.exit(ok ? 0 : 1);
}

export { runTests };
