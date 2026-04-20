import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import {
  canGenerateRecipeHeroImageWithAI,
  RECIPE_AI_HERO_ERRORS,
  RECIPE_AI_HERO_LIMITS,
} from "./lib/constants";
import {
  checkRecipeAiHeroImageQuota,
  type HeroImageAttemptForQuota,
} from "./lib/recipeAiHeroImageQuota";
import { getCurrentUserOrThrow } from "./users";

const IMAGE_PREFIX = "image/";

function truncateError(msg: string, max = 400): string {
  const t = msg.trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

async function expireStalePendingForUser(
  ctx: MutationCtx,
  userId: Id<"users">,
  now: number,
): Promise<void> {
  const ttl = RECIPE_AI_HERO_LIMITS.JOB_TTL_MS;
  const pending = await ctx.db
    .query("recipeAiHeroImageAttempts")
    .withIndex("by_user_status", (q) =>
      q.eq("userId", userId).eq("status", "pending"),
    )
    .collect();
  for (const row of pending) {
    if (now - row.createdAt >= ttl) {
      await ctx.db.patch(row._id, {
        status: "expired",
        completedAt: now,
        errorMessage: "Job timed out",
      });
    }
  }
}

function recipeAlreadyHasAiHeroImage(recipe: {
  heroImageOrigin?: "user_upload" | "ai";
  image?: unknown;
}): boolean {
  return recipe.heroImageOrigin === "ai" && recipe.image != null;
}

/** Recipe fields for the image prompt, or a block reason; only for the job owner while job is pending. */
export const getRecipeSnapshotForAiHeroJob = query({
  args: { jobId: v.id("recipeAiHeroImageAttempts") },
  returns: v.union(
    v.null(),
    v.object({ status: v.literal("already_ai") }),
    v.object({
      status: v.literal("ok"),
      recipeId: v.id("recipes"),
      title: v.string(),
      description: v.union(v.string(), v.null()),
      method: v.array(
        v.object({
          title: v.string(),
          description: v.optional(v.string()),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const row = await ctx.db.get(args.jobId);
    if (!row || row.userId !== user._id || row.status !== "pending") {
      return null;
    }
    const now = Date.now();
    if (now - row.createdAt >= RECIPE_AI_HERO_LIMITS.JOB_TTL_MS) {
      return null;
    }
    const recipe = await ctx.db.get(row.recipeId);
    if (!recipe || recipe.userId !== user._id) {
      return null;
    }
    if (recipeAlreadyHasAiHeroImage(recipe)) {
      return { status: "already_ai" as const };
    }
    return {
      status: "ok" as const,
      recipeId: row.recipeId,
      title: recipe.title,
      description: recipe.description ?? null,
      method: (recipe.method ?? []).map((step) => ({
        title: step.title,
        description: step.description ?? undefined,
      })),
    };
  },
});

export const startRecipeAiHeroImageJob = mutation({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    if (!canGenerateRecipeHeroImageWithAI(user.subscriptionTier)) {
      throw new ConvexError(RECIPE_AI_HERO_ERRORS.PREMIUM_REQUIRED);
    }

    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe || recipe.userId !== user._id) {
      throw new ConvexError(RECIPE_AI_HERO_ERRORS.NOT_OWNER);
    }
    if (recipeAlreadyHasAiHeroImage(recipe)) {
      throw new ConvexError(RECIPE_AI_HERO_ERRORS.ALREADY_HAS_AI_HERO);
    }

    const now = Date.now();
    await expireStalePendingForUser(ctx, user._id, now);

    const freshPending = await ctx.db
      .query("recipeAiHeroImageAttempts")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "pending"),
      )
      .collect();
    if (
      freshPending.some(
        (row) => now - row.createdAt < RECIPE_AI_HERO_LIMITS.JOB_TTL_MS,
      )
    ) {
      throw new ConvexError(RECIPE_AI_HERO_ERRORS.PENDING_JOB);
    }

    const lookback = now - 35 * 24 * 60 * 60 * 1000;
    const recent = await ctx.db
      .query("recipeAiHeroImageAttempts")
      .withIndex("by_user_created", (q) =>
        q.eq("userId", user._id).gte("createdAt", lookback),
      )
      .collect();

    const forQuota: HeroImageAttemptForQuota[] = recent.map((r) => ({
      recipeId: r.recipeId,
      status: r.status,
      createdAt: r.createdAt,
      completedAt: r.completedAt,
    }));

    const quota = checkRecipeAiHeroImageQuota({
      now,
      recipeId: args.recipeId,
      attempts: forQuota,
    });
    if (!quota.ok) {
      throw new ConvexError(quota.code);
    }

    const jobId = await ctx.db.insert("recipeAiHeroImageAttempts", {
      userId: user._id,
      recipeId: args.recipeId,
      status: "pending",
      createdAt: now,
      recipeTitleSnapshot: recipe.title.slice(0, 200),
    });

    return { jobId };
  },
});

export const issueUploadUrlForRecipeAiHeroJob = mutation({
  args: { jobId: v.id("recipeAiHeroImageAttempts") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const row = await ctx.db.get(args.jobId);
    if (!row || row.userId !== user._id) {
      throw new ConvexError(RECIPE_AI_HERO_ERRORS.NOT_FOUND);
    }
    const now = Date.now();
    if (row.status !== "pending") {
      throw new ConvexError(RECIPE_AI_HERO_ERRORS.INVALID_JOB_STATE);
    }
    if (now - row.createdAt >= RECIPE_AI_HERO_LIMITS.JOB_TTL_MS) {
      await ctx.db.patch(args.jobId, {
        status: "expired",
        completedAt: now,
        errorMessage: "Job timed out before upload",
      });
      throw new ConvexError(RECIPE_AI_HERO_ERRORS.EXPIRED);
    }

    const recipe = await ctx.db.get(row.recipeId);
    if (recipe && recipeAlreadyHasAiHeroImage(recipe)) {
      await ctx.db.patch(args.jobId, {
        status: "failed",
        completedAt: now,
        errorMessage: "Recipe already has an AI-generated image",
      });
      throw new ConvexError(RECIPE_AI_HERO_ERRORS.ALREADY_HAS_AI_HERO);
    }

    const uploadUrl = await ctx.storage.generateUploadUrl();
    return { uploadUrl };
  },
});

export const finalizeRecipeAiHeroJob = mutation({
  args: {
    jobId: v.id("recipeAiHeroImageAttempts"),
    storageId: v.id("_storage"),
    model: v.string(),
    promptCharLength: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const row = await ctx.db.get(args.jobId);
    if (!row || row.userId !== user._id) {
      throw new ConvexError(RECIPE_AI_HERO_ERRORS.NOT_FOUND);
    }
    if (row.status !== "pending") {
      throw new ConvexError(RECIPE_AI_HERO_ERRORS.INVALID_JOB_STATE);
    }

    const now = Date.now();
    if (now - row.createdAt >= RECIPE_AI_HERO_LIMITS.JOB_TTL_MS) {
      await ctx.db.patch(args.jobId, {
        status: "expired",
        completedAt: now,
        errorMessage: "Job timed out before finalize",
      });
      throw new ConvexError(RECIPE_AI_HERO_ERRORS.EXPIRED);
    }

    const recipe = await ctx.db.get(row.recipeId);
    if (!recipe || recipe.userId !== user._id) {
      throw new ConvexError(RECIPE_AI_HERO_ERRORS.NOT_OWNER);
    }
    if (recipeAlreadyHasAiHeroImage(recipe)) {
      await ctx.db.patch(args.jobId, {
        status: "failed",
        completedAt: now,
        errorMessage: "Recipe already has an AI-generated image",
      });
      throw new ConvexError(RECIPE_AI_HERO_ERRORS.ALREADY_HAS_AI_HERO);
    }

    const meta = await ctx.storage.getMetadata(args.storageId);
    if (!meta) {
      throw new ConvexError(RECIPE_AI_HERO_ERRORS.STORAGE_VERIFY);
    }
    const ct = meta.contentType ?? "";
    if (!ct.startsWith(IMAGE_PREFIX)) {
      throw new ConvexError(RECIPE_AI_HERO_ERRORS.STORAGE_VERIFY);
    }

    const oldImageId = recipe.image;

    await ctx.db.patch(row.recipeId, {
      image: args.storageId,
      heroImageOrigin: "ai",
      updatedAt: now,
    });

    await ctx.db.patch(args.jobId, {
      status: "succeeded",
      completedAt: now,
      storageId: args.storageId,
      model: args.model,
      promptCharLength: args.promptCharLength,
    });

    if (oldImageId) {
      try {
        await ctx.storage.delete(oldImageId);
      } catch (e) {
        console.warn("recipe AI hero: old image delete failed", {
          recipeId: row.recipeId,
          oldImageId,
          e,
        });
      }
    }

    return { ok: true as const };
  },
});

export const markRecipeAiHeroJobFailed = mutation({
  args: {
    jobId: v.id("recipeAiHeroImageAttempts"),
    errorMessage: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const row = await ctx.db.get(args.jobId);
    if (!row || row.userId !== user._id) {
      throw new ConvexError(RECIPE_AI_HERO_ERRORS.NOT_FOUND);
    }
    if (row.status !== "pending") {
      return { ok: false as const };
    }
    const now = Date.now();
    await ctx.db.patch(args.jobId, {
      status: "failed",
      completedAt: now,
      errorMessage: truncateError(args.errorMessage),
    });
    return { ok: true as const };
  },
});
