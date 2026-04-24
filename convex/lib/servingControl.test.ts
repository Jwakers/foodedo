/**
 * Run with: pnpm exec tsx convex/lib/servingControl.test.ts
 */

import assert from "node:assert/strict";
import {
  clampTargetServings,
  TARGET_SERVINGS_MAX,
  TARGET_SERVINGS_MIN,
} from "./constants";

function runTests(): boolean {
  let failed = 0;
  const test = (name: string, fn: () => void) => {
    try {
      fn();
      console.log(`  ✓ ${name}`);
    } catch (error) {
      failed++;
      console.error(`  ✗ ${name}`, error);
    }
  };

  console.log("🧪 servingControl\n");

  test("clamps below minimum", () => {
    assert.equal(clampTargetServings(0), TARGET_SERVINGS_MIN);
  });

  test("clamps above maximum", () => {
    assert.equal(clampTargetServings(999), TARGET_SERVINGS_MAX);
  });

  test("rounds and keeps in-range values", () => {
    assert.equal(clampTargetServings(3.6), 4);
    assert.equal(clampTargetServings(7.2), 7);
  });

  if (failed > 0) {
    console.error(`\n❌ ${failed} test(s) failed`);
    return false;
  }
  console.log("\n✅ all tests passed");
  return true;
}

if (!runTests()) {
  process.exit(1);
}
