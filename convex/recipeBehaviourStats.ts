/**
 * Recipe behaviour stats for the Intelligent Weekly Generator.
 *
 * Tracks per (recipe, actor): suggestedCount, swappedCount, removedCount, lastSuggestedAt.
 * Actor = user (personal plan) or household (shared plan). Spec 4 (Behavioural Learning Model).
 *
 * Invariant: suggestedCount is total exposure and must never be decremented (Spec 4.1).
 */

import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

export type ActorType = "user" | "household";

/** Resolve actor for a plan: household plans use household-level stats, else user-level (Spec 4.5). */
export function getActorForPlan(plan: {
  userId: Id<"users">;
  householdId?: Id<"households">;
}): { actorType: ActorType; actorId: Id<"users"> | Id<"households"> } {
  if (plan.householdId) {
    return { actorType: "household", actorId: plan.householdId };
  }
  return { actorType: "user", actorId: plan.userId };
}

/**
 * Get or create a behaviour stats row for (recipe, actor).
 * Used before incrementing any counter. Spec 4: stats are per (recipe, actor).
 */
export async function getOrCreateBehaviourStats(
  ctx: MutationCtx,
  recipeId: Id<"recipes">,
  actorType: ActorType,
  actorId: Id<"users"> | Id<"households">,
): Promise<{ _id: Id<"recipeBehaviourStats">; suggestedCount: number; swappedCount: number; removedCount: number }> {
  const existing = await ctx.db
    .query("recipeBehaviourStats")
    .withIndex("by_recipe_and_actor", (q) =>
      q.eq("recipeId", recipeId).eq("actorType", actorType).eq("actorId", actorId),
    )
    .first();

  if (existing) return existing;

  const now = Date.now();
  const id = await ctx.db.insert("recipeBehaviourStats", {
    recipeId,
    actorType,
    actorId,
    suggestedCount: 0,
    swappedCount: 0,
    removedCount: 0,
    lastSuggestedAt: 0,
    updatedAt: now,
  });
  return {
    _id: id,
    suggestedCount: 0,
    swappedCount: 0,
    removedCount: 0,
  };
}

/**
 * Increment suggestedCount and set lastSuggestedAt when a recipe is suggested in a generated plan.
 * Spec 4.1: suggestedCount = total exposure; never decrement.
 */
export async function incrementSuggested(
  ctx: MutationCtx,
  recipeId: Id<"recipes">,
  actorType: ActorType,
  actorId: Id<"users"> | Id<"households">,
): Promise<void> {
  const stats = await getOrCreateBehaviourStats(ctx, recipeId, actorType, actorId);
  const now = Date.now();
  await ctx.db.patch(stats._id, {
    suggestedCount: stats.suggestedCount + 1,
    lastSuggestedAt: now,
    updatedAt: now,
  });
}

/**
 * Increment swappedCount when a recipe is swapped out (user chose a different recipe for that slot).
 * Spec 4.3: swap = increment swappedCount for old recipe; new recipe gets incrementSuggested elsewhere.
 */
export async function incrementSwapped(
  ctx: MutationCtx,
  recipeId: Id<"recipes">,
  actorType: ActorType,
  actorId: Id<"users"> | Id<"households">,
): Promise<void> {
  const stats = await getOrCreateBehaviourStats(ctx, recipeId, actorType, actorId);
  await ctx.db.patch(stats._id, {
    swappedCount: stats.swappedCount + 1,
    updatedAt: Date.now(),
  });
}

/**
 * Increment removedCount when a recipe is removed from the plan.
 * Spec 4.3: removed = increment removedCount for that recipe.
 */
export async function incrementRemoved(
  ctx: MutationCtx,
  recipeId: Id<"recipes">,
  actorType: ActorType,
  actorId: Id<"users"> | Id<"households">,
): Promise<void> {
  const stats = await getOrCreateBehaviourStats(ctx, recipeId, actorType, actorId);
  await ctx.db.patch(stats._id, {
    removedCount: stats.removedCount + 1,
    updatedAt: Date.now(),
  });
}
