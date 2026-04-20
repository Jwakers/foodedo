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
  weight,
  type BehaviourStatsMap,
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

  return failed === 0;
}

const ok = runTests();
process.exit(ok ? 0 : 1);
