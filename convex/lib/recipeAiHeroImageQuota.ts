import {
  RECIPE_AI_HERO_ERRORS,
  RECIPE_AI_HERO_LIMITS,
} from "./constants";

export type HeroImageAttemptForQuota = {
  recipeId: string;
  status: "pending" | "succeeded" | "failed" | "expired";
  createdAt: number;
  completedAt?: number;
};

function effectiveTime(a: HeroImageAttemptForQuota): number {
  return a.completedAt ?? a.createdAt;
}

export function countSucceededUserBetween(
  attempts: HeroImageAttemptForQuota[],
  sinceMsExclusive: number,
  now: number,
): number {
  let n = 0;
  for (const a of attempts) {
    if (a.status !== "succeeded") continue;
    const t = effectiveTime(a);
    if (t > sinceMsExclusive && t <= now) n++;
  }
  return n;
}

export function countSucceededRecipeBetween(
  attempts: HeroImageAttemptForQuota[],
  recipeId: string,
  sinceMsExclusive: number,
  now: number,
): number {
  let n = 0;
  for (const a of attempts) {
    if (a.status !== "succeeded" || a.recipeId !== recipeId) continue;
    const t = effectiveTime(a);
    if (t > sinceMsExclusive && t <= now) n++;
  }
  return n;
}

export function hasFreshPendingJob(
  attempts: HeroImageAttemptForQuota[],
  now: number,
): boolean {
  const ttl = RECIPE_AI_HERO_LIMITS.JOB_TTL_MS;
  return attempts.some(
    (a) => a.status === "pending" && now - a.createdAt < ttl,
  );
}

export function minMsSinceLastJobStart(
  attempts: HeroImageAttemptForQuota[],
  now: number,
): number | null {
  if (attempts.length === 0) return null;
  let maxCreated = 0;
  for (const a of attempts) {
    if (a.createdAt > maxCreated) maxCreated = a.createdAt;
  }
  return now - maxCreated;
}

export type QuotaCheckResult =
  | { ok: true }
  | { ok: false; code: (typeof RECIPE_AI_HERO_ERRORS)[keyof typeof RECIPE_AI_HERO_ERRORS] };

/**
 * Pure quota / cooldown checks before inserting a new pending job.
 * Caller must pass attempts for this user (e.g. last 35 days) newest-first optional.
 */
export function checkRecipeAiHeroImageQuota(args: {
  now: number;
  recipeId: string;
  attempts: HeroImageAttemptForQuota[];
}): QuotaCheckResult {
  const { now, recipeId, attempts } = args;
  const L = RECIPE_AI_HERO_LIMITS;

  if (hasFreshPendingJob(attempts, now)) {
    return { ok: false, code: RECIPE_AI_HERO_ERRORS.PENDING_JOB };
  }

  const sinceLastStart = minMsSinceLastJobStart(attempts, now);
  if (sinceLastStart !== null && sinceLastStart < L.MIN_INTERVAL_MS) {
    return { ok: false, code: RECIPE_AI_HERO_ERRORS.COOLDOWN };
  }

  const dayAgo = now - 24 * 60 * 60 * 1000;
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

  if (countSucceededUserBetween(attempts, dayAgo, now) >= L.MAX_SUCCEEDED_PER_24H) {
    return { ok: false, code: RECIPE_AI_HERO_ERRORS.RATE_LIMIT_USER_24H };
  }

  if (countSucceededUserBetween(attempts, monthAgo, now) >= L.MAX_SUCCEEDED_PER_30D) {
    return { ok: false, code: RECIPE_AI_HERO_ERRORS.RATE_LIMIT_USER_30D };
  }

  if (
    countSucceededRecipeBetween(attempts, recipeId, dayAgo, now) >=
    L.MAX_SUCCEEDED_PER_RECIPE_PER_24H
  ) {
    return { ok: false, code: RECIPE_AI_HERO_ERRORS.RATE_LIMIT_RECIPE_24H };
  }

  return { ok: true };
}
