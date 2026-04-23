/**
 * Run with: pnpm exec tsx convex/mealPlanGenerator.test.ts
 */

import assert from "node:assert/strict";
import type { Id } from "./_generated/dataModel";
import {
  idTargetKey,
  leftoverWeightMultiplier,
} from "./lib/leftoverIngredients";
import {
  recipePassesPreferenceConstraints,
  weight,
  type BehaviourStatsMap,
  type GenerationPreferenceConstraints,
  type PoolRecipe,
} from "./mealPlanGenerator";

const rid = (s: string) => s as Id<"recipes">;
const iid = (s: string) => s as Id<"ingredients">;

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

  console.log("🧪 mealPlanGenerator\n");

  test("weight drops leftover boost when target ids are already covered", () => {
    const stats: BehaviourStatsMap = new Map();
    const chicken = iid("chicken");
    const recipe: PoolRecipe = {
      _id: rid("r1"),
      isSystem: true,
      leftoverTargetCount: 1,
      leftoverMatchCount: 1,
      leftoverMatchKeys: [idTargetKey(chicken)],
    };
    const withoutCovered = weight(recipe, stats, []);
    const withCovered = weight(
      recipe,
      stats,
      [],
      undefined,
      undefined,
      new Set([idTargetKey(chicken)]),
    );
    const expectedBase = withoutCovered / leftoverWeightMultiplier(1, 1);
    assert.ok(withoutCovered > withCovered);
    assert.equal(withCovered, expectedBase);
  });

  test("second candidate loses leftover multiplier when prior pick covered same ids", () => {
    const stats: BehaviourStatsMap = new Map();
    const chicken = iid("chicken");
    const a: PoolRecipe = {
      _id: rid("aaaa"),
      isSystem: true,
      primaryProtein: "chicken",
      leftoverTargetCount: 1,
      leftoverMatchCount: 1,
      leftoverMatchKeys: [idTargetKey(chicken)],
    };
    const b: PoolRecipe = {
      _id: rid("bbbb"),
      isSystem: true,
      primaryProtein: "chicken",
      leftoverTargetCount: 1,
      leftoverMatchCount: 1,
      leftoverMatchKeys: [idTargetKey(chicken)],
    };
    const pool = [a, b];
    const wSecondNoCovered = weight(b, stats, [a]);
    const wSecondCovered = weight(
      b,
      stats,
      [a],
      undefined,
      undefined,
      new Set([idTargetKey(chicken)]),
    );
    assert.equal(
      wSecondCovered,
      wSecondNoCovered / leftoverWeightMultiplier(1, 1),
    );
  });

  test("locked recipes pre-cover leftover ids for weight on remaining pool", () => {
    const stats: BehaviourStatsMap = new Map();
    const chicken = iid("chicken");
    const locked: PoolRecipe = {
      _id: rid("locked"),
      isSystem: true,
      leftoverTargetCount: 1,
      leftoverMatchCount: 1,
      leftoverMatchKeys: [idTargetKey(chicken)],
    };
    const open: PoolRecipe = {
      _id: rid("open"),
      isSystem: true,
      leftoverTargetCount: 1,
      leftoverMatchCount: 1,
      leftoverMatchKeys: [idTargetKey(chicken)],
    };
    const covered = new Set<string>([idTargetKey(chicken)]);
    const w = weight(open, stats, [locked], undefined, undefined, covered);
    const wFresh = weight(open, stats, []);
    assert.equal(w, wFresh / leftoverWeightMultiplier(1, 1));
  });

  test("preference constraints block allergen by canonical ingredient id", () => {
    const constraints: GenerationPreferenceConstraints = {
      allergyIngredientIds: [iid("peanut")],
    };
    const allowed = recipePassesPreferenceConstraints(
      {
        ingredients: [{ name: "Garlic", ingredientId: iid("garlic") }],
      },
      constraints,
    );
    const blocked = recipePassesPreferenceConstraints(
      {
        ingredients: [{ name: "Peanut butter", ingredientId: iid("peanut") }],
      },
      constraints,
    );
    assert.equal(allowed, true);
    assert.equal(blocked, false);
  });

  test("preference constraints block allergen by phrase fallback", () => {
    const constraints: GenerationPreferenceConstraints = {
      allergyPhrases: ["shellfish"],
    };
    const blocked = recipePassesPreferenceConstraints(
      {
        ingredients: [{ name: "Mixed shellfish stock" }],
      },
      constraints,
    );
    assert.equal(blocked, false);
  });

  test("preference constraints apply protein exclusions", () => {
    const constraints: GenerationPreferenceConstraints = {
      excludedPrimaryProteins: ["fish"],
    };
    assert.equal(
      recipePassesPreferenceConstraints(
        {
          primaryProtein: "fish",
        },
        constraints,
      ),
      false,
    );
    assert.equal(
      recipePassesPreferenceConstraints(
        {
          primaryProtein: "chicken",
        },
        constraints,
      ),
      true,
    );
  });

  return failed === 0;
}

const ok = runTests();
process.exit(ok ? 0 : 1);
