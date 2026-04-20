/**
 * Run with: pnpm exec tsx convex/lib/leftoverIngredients.test.ts
 */

import assert from "node:assert/strict";
import type { Doc, Id } from "../_generated/dataModel";
import {
  collectLeftoverMatchKeys,
  countRecipeLeftoverMatches,
  lineMatchesLeftoverPhrase,
  leftoverWeightMultiplier,
  normaliseLeftoverPhrasesList,
} from "./leftoverIngredients";

const id = (s: string) => s as Id<"ingredients">;

function doc(
  _id: string,
  overrides: Partial<Doc<"ingredients">> = {},
): Doc<"ingredients"> {
  return {
    _id: id(_id),
    _creationTime: 0,
    name: "x",
    ...overrides,
  } as Doc<"ingredients">;
}

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

  console.log("🧪 leftoverIngredients\n");

  test("counts ingredientId matches once per target", () => {
    const t1 = id("k1");
    const t2 = id("k2");
    const n = countRecipeLeftoverMatches(
      [
        { ingredientId: t1, name: "Chicken" },
        { ingredientId: t1, name: "Chicken again" },
        { ingredientId: t2, name: "Rice" },
      ],
      [t1, t2],
      [doc("k1", { name: "Chicken" }), doc("k2", { name: "Rice" })],
    );
    assert.equal(n, 2);
  });

  test("fallback matches line name to alias", () => {
    const t1 = id("k1");
    const n = countRecipeLeftoverMatches(
      [{ name: "Chicken Thighs" }],
      [t1],
      [
        doc("k1", {
          name: "other",
          aliases: ["chicken thighs"],
        }),
      ],
    );
    assert.equal(n, 1);
  });

  test("leftoverWeightMultiplier is 1 when no match", () => {
    assert.equal(leftoverWeightMultiplier(0, 3), 1);
  });

  test("leftoverWeightMultiplier increases with ratio", () => {
    const full = leftoverWeightMultiplier(3, 3);
    const half = leftoverWeightMultiplier(2, 4);
    assert.ok(full > half);
    assert.ok(half > 1);
  });

  test("lineMatchesLeftoverPhrase multi-word token overlap", () => {
    assert.equal(
      lineMatchesLeftoverPhrase(
        "boneless chicken thighs",
        "chicken thigh",
      ),
      true,
    );
  });

  test("lineMatchesLeftoverPhrase substring", () => {
    assert.equal(lineMatchesLeftoverPhrase("extra virgin olive oil", "olive"), true);
  });

  test("lineMatchesLeftoverPhrase minced vs mince wording", () => {
    assert.equal(
      lineMatchesLeftoverPhrase("500g beef mince", "minced beef"),
      true,
    );
  });

  test("normaliseLeftoverPhrasesList dedupes", () => {
    const a = normaliseLeftoverPhrasesList(["  Chicken  ", "chicken"]);
    assert.equal(a.length, 1);
    assert.equal(a[0], "chicken");
  });

  test("collectLeftoverMatchKeys includes phrase when line matches", () => {
    const keys = collectLeftoverMatchKeys(
      [{ name: "ground pork mince" }],
      [],
      [],
      ["pork"],
    );
    assert.ok(keys.some((k) => k.startsWith("phr:")));
  });

  console.log(failed === 0 ? "\n✅ All passed\n" : `\n❌ ${failed} failed\n`);
  return failed === 0;
}

if (!runTests()) {
  process.exit(1);
}
