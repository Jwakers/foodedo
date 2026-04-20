/**
 * Run with: pnpm exec tsx convex/lib/recipeAiHeroImageQuota.test.ts
 */

import assert from "node:assert/strict";
import { RECIPE_AI_HERO_ERRORS } from "./constants";
import {
  checkRecipeAiHeroImageQuota,
  countSucceededRecipeBetween,
  countSucceededUserBetween,
  hasFreshPendingJob,
  minMsSinceLastJobStart,
  type HeroImageAttemptForQuota,
} from "./recipeAiHeroImageQuota";

const recipeA = "r1";
const recipeB = "r2";

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

  console.log("🧪 recipeAiHeroImageQuota\n");

  test("countSucceededUserBetween counts only succeeded in window", () => {
    const now = 1_000_000;
    const attempts: HeroImageAttemptForQuota[] = [
      {
        recipeId: recipeA,
        status: "succeeded",
        createdAt: now - 1000,
        completedAt: now - 500,
      },
      {
        recipeId: recipeA,
        status: "failed",
        createdAt: now - 400,
        completedAt: now - 300,
      },
    ];
    assert.equal(countSucceededUserBetween(attempts, now - 600, now), 1);
  });

  test("countSucceededRecipeBetween filters by recipe", () => {
    const now = 2_000_000;
    const attempts: HeroImageAttemptForQuota[] = [
      {
        recipeId: recipeA,
        status: "succeeded",
        createdAt: now - 10_000,
        completedAt: now - 1000,
      },
      {
        recipeId: recipeB,
        status: "succeeded",
        createdAt: now - 10_000,
        completedAt: now - 1000,
      },
    ];
    assert.equal(
      countSucceededRecipeBetween(attempts, recipeA, now - 5000, now),
      1,
    );
  });

  test("hasFreshPendingJob detects pending within TTL", () => {
    const now = 5_000_000;
    const attempts: HeroImageAttemptForQuota[] = [
      {
        recipeId: recipeA,
        status: "pending",
        createdAt: now - 60_000,
      },
    ];
    assert.equal(hasFreshPendingJob(attempts, now), true);
  });

  test("hasFreshPendingJob ignores stale pending", () => {
    const now = 5_000_000;
    const attempts: HeroImageAttemptForQuota[] = [
      {
        recipeId: recipeA,
        status: "pending",
        createdAt: now - 20 * 60_000,
      },
    ];
    assert.equal(hasFreshPendingJob(attempts, now), false);
  });

  test("minMsSinceLastJobStart uses newest createdAt", () => {
    const now = 10_000_000;
    const attempts: HeroImageAttemptForQuota[] = [
      { recipeId: recipeA, status: "failed", createdAt: now - 10_000 },
      { recipeId: recipeA, status: "succeeded", createdAt: now - 30_000 },
    ];
    assert.equal(minMsSinceLastJobStart(attempts, now), 10_000);
  });

  test("checkRecipeAiHeroImageQuota allows empty history", () => {
    const now = 1_000;
    assert.deepEqual(
      checkRecipeAiHeroImageQuota({
        now,
        recipeId: recipeA,
        attempts: [],
      }),
      { ok: true },
    );
  });

  test("checkRecipeAiHeroImageQuota blocks fresh pending", () => {
    const now = 100_000;
    const attempts: HeroImageAttemptForQuota[] = [
      { recipeId: recipeA, status: "pending", createdAt: now - 1000 },
    ];
    assert.deepEqual(
      checkRecipeAiHeroImageQuota({ now, recipeId: recipeA, attempts }),
      { ok: false, code: RECIPE_AI_HERO_ERRORS.PENDING_JOB },
    );
  });

  test("checkRecipeAiHeroImageQuota blocks cooldown", () => {
    const now = 200_000;
    const attempts: HeroImageAttemptForQuota[] = [
      { recipeId: recipeA, status: "failed", createdAt: now - 5000 },
    ];
    assert.deepEqual(
      checkRecipeAiHeroImageQuota({ now, recipeId: recipeA, attempts }),
      { ok: false, code: RECIPE_AI_HERO_ERRORS.COOLDOWN },
    );
  });

  test("checkRecipeAiHeroImageQuota blocks user 24h cap", () => {
    const now = 1_000_000;
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const attempts: HeroImageAttemptForQuota[] = [];
    for (let i = 0; i < 5; i++) {
      attempts.push({
        recipeId: recipeA,
        status: "succeeded",
        createdAt: dayAgo + i * 1000,
        completedAt: dayAgo + i * 1000 + 100,
      });
    }
    assert.deepEqual(
      checkRecipeAiHeroImageQuota({ now, recipeId: recipeA, attempts }),
      { ok: false, code: RECIPE_AI_HERO_ERRORS.RATE_LIMIT_USER_24H },
    );
  });

  test("checkRecipeAiHeroImageQuota blocks recipe 24h cap", () => {
    const now = 2_000_000;
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const attempts: HeroImageAttemptForQuota[] = [
      {
        recipeId: recipeA,
        status: "succeeded",
        createdAt: dayAgo,
        completedAt: dayAgo + 100,
      },
      {
        recipeId: recipeA,
        status: "succeeded",
        createdAt: dayAgo + 2000,
        completedAt: dayAgo + 2100,
      },
    ];
    assert.deepEqual(
      checkRecipeAiHeroImageQuota({ now, recipeId: recipeA, attempts }),
      { ok: false, code: RECIPE_AI_HERO_ERRORS.RATE_LIMIT_RECIPE_24H },
    );
  });

  return failed === 0;
}

const ok = runTests();
if (!ok) process.exit(1);
