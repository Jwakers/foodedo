import { createClerkClient } from "@clerk/backend";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";
import {
  internalAction,
  internalMutation,
  mutation,
  MutationCtx,
  query,
  QueryCtx,
} from "./_generated/server";
import {
  canUseHouseholdPreferences,
  MEAL_PLAN_ERRORS,
  PLANS,
  PRIMARY_PROTEINS,
  SUBSCRIPTION_TIERS,
  USER_PREFERENCE_ALLERGY_PHRASE_MAX_LENGTH,
  USER_PREFERENCE_ALLERGY_TARGETS_MAX,
} from "./lib/constants";

export const current = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

export const upsertFromClerk = internalMutation({
  args: {
    firstName: v.optional(v.union(v.string(), v.null())),
    lastName: v.optional(v.union(v.string(), v.null())),
    email: v.optional(v.union(v.string(), v.null())),
    image: v.optional(v.union(v.string(), v.null())),
    subscriptionTier: v.optional(v.string()),
    subscriptionStatus: v.optional(v.string()),
    subscriptionId: v.optional(v.string()),
    externalId: v.string(),
  },
  async handler(ctx, { firstName, lastName, email, image, externalId }) {
    const nameParts = [firstName, lastName].filter(Boolean);
    const userAttributes = {
      name: nameParts.join(" ") ?? undefined,
      firstName: firstName ?? undefined,
      lastName: lastName ?? undefined,
      email: email ?? undefined,
      image: image ?? undefined,
      externalId,
    };

    const user = await userByExternalId(ctx, externalId);
    if (user === null) {
      await ctx.db.insert("users", userAttributes);
    } else {
      await ctx.db.patch(user._id, userAttributes);
    }
  },
});

export const updateSubscriptionTier = internalMutation({
  args: {
    externalId: v.string(),
    subscriptionTier: v.string(),
    subscriptionStatus: v.string(),
    subscriptionId: v.string(),
  },
  async handler(ctx, args) {
    console.log("Subscription webhook received:", {
      subscriptionTier: args.subscriptionTier,
      subscriptionStatus: args.subscriptionStatus,
      subscriptionId: args.subscriptionId,
    });

    const user = await userByExternalId(ctx, args.externalId);
    if (user === null) {
      console.error(`User not found for Clerk user ID: ${args.externalId}`);
      throw new ConvexError(
        `User not found for Clerk user ID: ${args.externalId}`,
      );
    }

    let subscriptionTier: (typeof SUBSCRIPTION_TIERS)[number] | undefined =
      user.subscriptionTier;

    if (
      !SUBSCRIPTION_TIERS.includes(
        args.subscriptionTier as (typeof SUBSCRIPTION_TIERS)[number],
      )
    ) {
      throw new ConvexError(
        `Invalid subscription tier: ${args.subscriptionTier}. Valid tiers: ${SUBSCRIPTION_TIERS.join(", ")}`,
      );
    }

    subscriptionTier =
      args.subscriptionTier as (typeof SUBSCRIPTION_TIERS)[number];

    console.log(
      `Updating user ${user._id} to ${subscriptionTier} tier (status: ${args.subscriptionStatus}, subscription: ${args.subscriptionId})`,
    );

    // Update user with subscription details for failsafe tracking
    await ctx.db.patch(user._id, {
      subscriptionTier,
      subscriptionStatus: args.subscriptionStatus,
      subscriptionId: args.subscriptionId,
      lastSubscriptionSync: Date.now(),
    });
  },
});

export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  async handler(ctx, { clerkUserId }) {
    const user = await userByExternalId(ctx, clerkUserId);

    if (user !== null) {
      await ctx.db.delete(user._id);
    } else {
      console.warn(
        `Can't delete user, there is none for Clerk user ID: ${clerkUserId}`,
      );
    }
  },
});

export async function getCurrentUserOrThrow(ctx: QueryCtx) {
  const userRecord = await getCurrentUser(ctx);
  if (!userRecord) throw new ConvexError("Can't get current user");
  return userRecord;
}

export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    return null;
  }
  return await userByExternalId(ctx, identity.subject);
}

async function userByExternalId(ctx: QueryCtx, externalId: string) {
  return await ctx.db
    .query("users")
    .withIndex("byExternalId", (q) => q.eq("externalId", externalId))
    .unique();
}

export async function getUserSubscription(
  user: Doc<"users">,
  ctx: MutationCtx,
) {
  // Get the subscription tier from the user
  const subscriptionTier = user.subscriptionTier ?? "free_user";
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  // Last sync greater than 7 days, sync with clerk
  if (
    user.subscriptionTier === undefined ||
    user.lastSubscriptionSync === undefined ||
    user.lastSubscriptionSync < sevenDaysAgo
  ) {
    // Schedule an update
    await ctx.scheduler.runAfter(0, internal.users.syncUserWithClerk, {
      externalId: user.externalId,
    });
  }

  return PLANS[subscriptionTier];
}

export const syncUserWithClerk = internalAction({
  args: {
    externalId: v.string(),
  },
  handler: async (ctx, { externalId }) => {
    try {
      if (!process.env.CLERK_SECRET_KEY)
        throw new ConvexError(
          "CLERK_SECRET_KEY environment variable is not set",
        );

      // Initialize Clerk client
      const clerkClient = createClerkClient({
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      // Fetch user data from Clerk
      const clerkUser = await clerkClient.users.getUser(externalId);
      const subscription = await clerkClient.billing.getUserBillingSubscription(
        clerkUser.id,
      );

      const [subItem] = subscription.subscriptionItems;

      if (!subItem) {
        console.log(
          `User ${externalId} has no active subscription, defaulting to free tier`,
        );
        await ctx.runMutation(internal.users.updateSubscriptionTier, {
          externalId,
          subscriptionTier: "free_user",
          subscriptionStatus: "active",
          subscriptionId: subscription.id ?? "",
        });
        return;
      }

      // Update basic user data
      await ctx.runMutation(internal.users.updateSubscriptionTier, {
        externalId,
        subscriptionTier: subItem.plan?.slug ?? "free_user",
        subscriptionStatus: subItem.status,
        subscriptionId: subscription.id,
      });

      console.log(`Successfully synced user ${externalId} with Clerk`);
    } catch (error) {
      console.error(`Error syncing user ${externalId} with Clerk:`, error);
    }
  },
});

function normalisePreferencePhrase(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

export const getMyPreferences = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    return (
      user.preferences ?? {
        allergyIngredientIds: [],
        allergyPhrases: [],
        excludedPrimaryProteins: [],
      }
    );
  },
});

export const updateMyPreferences = mutation({
  args: {
    allergyIngredientIds: v.optional(v.array(v.id("ingredients"))),
    allergyPhrases: v.optional(v.array(v.string())),
    excludedPrimaryProteins: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    if (!canUseHouseholdPreferences(user.subscriptionTier)) {
      throw new ConvexError(
        MEAL_PLAN_ERRORS.PREMIUM_REQUIRED_HOUSEHOLD_PREFERENCES,
      );
    }

    const allergyIngredientIds = Array.from(
      new Set(args.allergyIngredientIds ?? []),
    );
    const allergyPhrases = Array.from(
      new Set(
        (args.allergyPhrases ?? [])
          .map(normalisePreferencePhrase)
          .filter(Boolean)
          .filter(
            (phrase) =>
              phrase.length <= USER_PREFERENCE_ALLERGY_PHRASE_MAX_LENGTH,
          ),
      ),
    );

    if (
      allergyIngredientIds.length + allergyPhrases.length >
      USER_PREFERENCE_ALLERGY_TARGETS_MAX
    ) {
      throw new ConvexError(
        `At most ${USER_PREFERENCE_ALLERGY_TARGETS_MAX} allergy targets are allowed`,
      );
    }

    const excludedPrimaryProteins = Array.from(
      new Set(args.excludedPrimaryProteins ?? []),
    ) as (typeof PRIMARY_PROTEINS)[number][];
    const invalidProteins = excludedPrimaryProteins.filter(
      (protein) => !(PRIMARY_PROTEINS as readonly string[]).includes(protein),
    );
    if (invalidProteins.length > 0) {
      throw new ConvexError(
        `Invalid primary proteins: ${invalidProteins.join(", ")}`,
      );
    }
    await ctx.db.patch(user._id, {
      preferences: {
        allergyIngredientIds,
        allergyPhrases,
        excludedPrimaryProteins,
      },
    });

    return { success: true };
  },
});
