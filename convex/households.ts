import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import {
  internalMutation,
  mutation,
  query,
  QueryCtx,
} from "./_generated/server";
import { canUseHouseholdPreferences } from "./lib/constants";
import {
  sortRecipesBySearchScore,
  recipeMatchesServerFilter,
  type RecipeListServerFilter,
} from "./lib/recipeListFilters";
import { recipeListServerFilterValidator } from "./lib/recipeListFilterValidation";
import {
  getCurrentUser,
  getCurrentUserOrThrow,
  getUserSubscription,
} from "./users";

function buildPreferenceSummary(
  prefs:
    | {
        allergyIngredientIds?: Id<"ingredients">[];
        allergyPhrases?: string[];
        excludedPrimaryProteins?: string[];
      }
    | undefined,
) {
  if (!prefs) {
    return {
      hasAny: false,
      allergyCount: 0,
      excludedProteinCount: 0,
    };
  }
  const allergyCount =
    (prefs.allergyIngredientIds?.length ?? 0) +
    (prefs.allergyPhrases?.length ?? 0);
  return {
    hasAny:
      allergyCount > 0 || (prefs.excludedPrimaryProteins?.length ?? 0) > 0,
    allergyCount,
    excludedProteinCount: prefs.excludedPrimaryProteins?.length ?? 0,
  };
}

function paginateArray<T>(
  items: T[],
  paginationOpts: { numItems: number; cursor: string | null },
): {
  page: T[];
  isDone: boolean;
  continueCursor: string;
  splitCursor: null;
} {
  const start = Number.parseInt(paginationOpts.cursor ?? "0", 10);
  const safeStart = Number.isFinite(start) && start >= 0 ? start : 0;
  const size = Math.max(1, paginationOpts.numItems);
  const page = items.slice(safeStart, safeStart + size);
  const nextOffset = safeStart + page.length;
  const isDone = nextOffset >= items.length;

  return {
    page,
    isDone,
    continueCursor: String(nextOffset),
    splitCursor: null,
  };
}

const MAX_SHARED_RECIPES_TO_SEARCH = 500;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a user is the owner of a household
 */
export async function isHouseholdOwner(
  ctx: QueryCtx,
  userId: Id<"users">,
  householdId: Id<"households">,
): Promise<boolean> {
  const membership = await ctx.db
    .query("householdMembers")
    .withIndex("by_user_and_household", (q) =>
      q.eq("userId", userId).eq("householdId", householdId),
    )
    .unique();

  return membership?.role === "owner";
}

/**
 * Check if a user is a member of a household (including owner)
 */
export async function isHouseholdMember(
  ctx: QueryCtx,
  userId: Id<"users">,
  householdId: Id<"households">,
): Promise<boolean> {
  const membership = await ctx.db
    .query("householdMembers")
    .withIndex("by_user_and_household", (q) =>
      q.eq("userId", userId).eq("householdId", householdId),
    )
    .unique();

  return membership !== null;
}

/**
 * Resolve which household to attach for default-shared content (meal plans, shopping lists).
 * - Explicit `householdId`: must be a household the user belongs to (throws if not a member).
 * - Omitted: no households → undefined; exactly one → that household; multiple → undefined
 *   (no guess—callers that need sharing should pass `householdId`, e.g. from the client UI).
 */
export async function resolveDefaultHouseholdIdForSharing(
  ctx: QueryCtx,
  userId: Id<"users">,
  explicitHouseholdId: Id<"households"> | undefined,
): Promise<Id<"households"> | undefined> {
  const memberships = await ctx.db
    .query("householdMembers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  if (explicitHouseholdId !== undefined) {
    const ok = memberships.some((m) => m.householdId === explicitHouseholdId);
    if (!ok) {
      throw new ConvexError("You are not a member of that household");
    }
    return explicitHouseholdId;
  }

  if (memberships.length === 0) return undefined;
  if (memberships.length === 1) return memberships[0]!.householdId;
  return undefined;
}

/**
 * Check if a user can access a recipe (owns it or it's shared to their household)
 */
export async function canAccessRecipe(
  ctx: QueryCtx,
  userId: Id<"users">,
  recipeId: Id<"recipes">,
): Promise<{ canAccess: boolean; isOwner: boolean }> {
  const recipe = await ctx.db.get(recipeId);
  if (!recipe) {
    return { canAccess: false, isOwner: false };
  }

  if (recipe.source === "system") {
    return { canAccess: true, isOwner: false };
  }

  // Check if user owns the recipe
  if (recipe.userId === userId) {
    return { canAccess: true, isOwner: true };
  }

  // Check if recipe is shared to any of user's households
  const userMemberships = await ctx.db
    .query("householdMembers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  const householdIds = userMemberships.map((m) => m.householdId);

  const sharedRecipes = await Promise.all(
    householdIds.map((householdId) =>
      ctx.db
        .query("householdRecipes")
        .withIndex("by_household_and_recipe", (q) =>
          q.eq("householdId", householdId).eq("recipeId", recipeId),
        )
        .unique(),
    ),
  );

  if (sharedRecipes.some((recipe) => recipe != null)) {
    return { canAccess: true, isOwner: false };
  }

  return { canAccess: false, isOwner: false };
}

/**
 * Generate a secure random token for invitations
 */
function generateInvitationToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/**
 * Enrich a shared recipe record with recipe data, user info, and image URL
 */
async function enrichSharedRecipe(
  ctx: QueryCtx,
  shared: Doc<"householdRecipes">,
  userId: Id<"users">,
  includeHouseholdId?: boolean,
) {
  const recipe = await ctx.db.get(shared.recipeId);
  if (!recipe) return null;

  const sharedByUser = await ctx.db.get(shared.sharedByUserId);
  const owner = recipe.userId ? await ctx.db.get(recipe.userId) : null;

  let image: string | null = null;
  if (recipe.image) {
    image = await ctx.storage.getUrl(recipe.image);
  }

  return {
    ...recipe,
    image,
    sharedBy: sharedByUser?.name ?? "Unknown User",
    sharedAt: shared.sharedAt,
    owner: owner?.name ?? "Unknown User",
    isOwner: recipe.userId === userId,
    ...(includeHouseholdId ? { householdId: shared.householdId } : {}),
  };
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get a single household with its details
 */
export const getHousehold = query({
  args: {
    householdId: v.id("households"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Check if user is a member
    const isMember = await isHouseholdMember(ctx, user._id, args.householdId);
    if (!isMember) {
      throw new ConvexError("You are not a member of this household");
    }

    const household = await ctx.db.get(args.householdId);
    if (!household) {
      throw new ConvexError("Household not found");
    }

    const isOwner = await isHouseholdOwner(ctx, user._id, args.householdId);

    return {
      ...household,
      isOwner,
    };
  },
});

/**
 * Get all households the current user belongs to
 */
export const getUserHouseholds = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    // Return empty array if user doesn't exist yet (race condition on sign-in)
    if (!user) {
      return [];
    }

    const memberships = await ctx.db
      .query("householdMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const households = await Promise.all(
      memberships.map(async (membership) => {
        const household = await ctx.db.get(membership.householdId);
        if (!household) return null;

        // Get member count
        const memberCount = await ctx.db
          .query("householdMembers")
          .withIndex("by_household", (q) =>
            q.eq("householdId", membership.householdId),
          )
          .collect();

        // Get recipe count
        const recipeCount = await ctx.db
          .query("householdRecipes")
          .withIndex("by_household", (q) =>
            q.eq("householdId", membership.householdId),
          )
          .collect();

        return {
          ...household,
          role: membership.role,
          memberCount: memberCount.length,
          recipeCount: recipeCount.length,
        };
      }),
    );

    return households.filter((h) => h !== null);
  },
});

/**
 * Get all members of a household
 */
export const getHouseholdMembers = query({
  args: {
    householdId: v.id("households"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Check if user is a member
    const isMember = await isHouseholdMember(ctx, user._id, args.householdId);
    if (!isMember) {
      throw new ConvexError("You are not a member of this household");
    }

    const memberships = await ctx.db
      .query("householdMembers")
      .withIndex("by_household", (q) => q.eq("householdId", args.householdId))
      .collect();

    const members = await Promise.all(
      memberships.map(async (membership) => {
        const memberUser = await ctx.db.get(membership.userId);
        if (!memberUser) return null;

        return {
          _id: membership._id,
          userId: memberUser._id,
          name: memberUser.name,
          role: membership.role,
          joinedAt: membership.joinedAt,
        };
      }),
    );

    return members.filter((m) => m !== null);
  },
});

/** Members available as preference contributors when generating a household meal plan. */
export const getGenerationMembersWithPreferences = query({
  args: {
    householdId: v.id("households"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const isMember = await isHouseholdMember(ctx, user._id, args.householdId);
    if (!isMember) {
      throw new ConvexError("You are not a member of this household");
    }
    const canSeePreferenceSummary = canUseHouseholdPreferences(
      user.subscriptionTier,
    );

    const memberships = await ctx.db
      .query("householdMembers")
      .withIndex("by_household", (q) => q.eq("householdId", args.householdId))
      .collect();

    const members = await Promise.all(
      memberships.map(async (membership) => {
        const memberUser = await ctx.db.get(membership.userId);
        if (!memberUser) return null;
        const summary = canSeePreferenceSummary
          ? buildPreferenceSummary(memberUser.preferences)
          : { hasAny: false, allergyCount: 0, excludedProteinCount: 0 };
        return {
          userId: memberUser._id,
          name: memberUser.name,
          ...summary,
        };
      }),
    );

    return members.filter(
      (member): member is NonNullable<typeof member> => !!member,
    );
  },
});

/**
 * Get invitation details for display (public, used by invite page)
 */
export const getInvitationDetails = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("householdInvitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!invitation) {
      return null;
    }

    // Check if expired
    if (invitation.expiresAt < Date.now()) {
      return {
        ...invitation,
        householdName: undefined,
        invitedByName: undefined,
        isExpired: true,
        isConsumed: false,
      };
    }

    // Check if already used (consumed)
    if (invitation.status === "accepted") {
      return {
        ...invitation,
        householdName: undefined,
        invitedByName: undefined,
        isExpired: false,
        isConsumed: true,
      };
    }

    const household = await ctx.db.get(invitation.householdId);
    const invitedBy = await ctx.db.get(invitation.invitedByUserId);

    return {
      ...invitation,
      householdName: household?.name ?? "Unknown Household",
      invitedByName: invitedBy?.name ?? "Unknown User",
      isExpired: false,
      isConsumed: false,
    };
  },
});

/**
 * Get all recipes shared to a household
 */
export const getHouseholdRecipes = query({
  args: {
    householdId: v.id("households"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Check if user is a member
    const isMember = await isHouseholdMember(ctx, user._id, args.householdId);
    if (!isMember) {
      throw new ConvexError("You are not a member of this household");
    }

    const sharedRecipes = await ctx.db
      .query("householdRecipes")
      .withIndex("by_household", (q) => q.eq("householdId", args.householdId))
      .collect();

    const recipes = await Promise.all(
      sharedRecipes.map((shared) =>
        enrichSharedRecipe(ctx, shared, user._id, false),
      ),
    );

    return recipes.filter((r): r is NonNullable<typeof r> => r !== null);
  },
});

export const listHouseholdRecipesPaginated = query({
  args: {
    householdId: v.id("households"),
    paginationOpts: paginationOptsValidator,
    filter: v.optional(recipeListServerFilterValidator),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const isMember = await isHouseholdMember(ctx, user._id, args.householdId);
    if (!isMember) {
      throw new ConvexError("You are not a member of this household");
    }

    const filter: RecipeListServerFilter | undefined = args.filter;
    const searchQuery = filter?.searchQuery?.trim() ?? "";

    if (searchQuery.length > 0) {
      const sharedRows = await ctx.db
        .query("householdRecipes")
        .withIndex("by_household_and_sharedAt", (q) =>
          q.eq("householdId", args.householdId),
        )
        .order("desc")
        // TODO: Replace this capped in-memory path with proper indexed search for household-shared recipes.
        .take(MAX_SHARED_RECIPES_TO_SEARCH);

      const recipes = await Promise.all(
        sharedRows.map((row) => enrichSharedRecipe(ctx, row, user._id, false)),
      );
      const filtered = recipes.filter(
        (recipe): recipe is NonNullable<typeof recipe> =>
          recipe != null && recipeMatchesServerFilter(recipe, filter),
      );
      const ranked = sortRecipesBySearchScore(filtered, filter);
      return paginateArray(ranked, args.paginationOpts);
    }

    const result = await ctx.db
      .query("householdRecipes")
      .withIndex("by_household_and_sharedAt", (q) =>
        q.eq("householdId", args.householdId),
      )
      .order("desc")
      .paginate(args.paginationOpts);

    const recipes = await Promise.all(
      result.page.map((shared) =>
        enrichSharedRecipe(ctx, shared, user._id, false),
      ),
    );
    const out = recipes.filter(
      (recipe): recipe is NonNullable<typeof recipe> =>
        recipe != null && recipeMatchesServerFilter(recipe, filter),
    );
    const ranked = sortRecipesBySearchScore(out, filter);

    return {
      page: ranked,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
      splitCursor: result.splitCursor,
    };
  },
});

export const getAllHouseholdRecipes = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    // Return empty array if user doesn't exist yet (race condition on sign-in)
    if (!user) {
      return [];
    }

    // Get all household memberships for the user
    const memberships = await ctx.db
      .query("householdMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Collect all recipes from all households
    const allRecipes = [];

    for (const membership of memberships) {
      const sharedRecipes = await ctx.db
        .query("householdRecipes")
        .withIndex("by_household", (q) =>
          q.eq("householdId", membership.householdId),
        )
        .collect();

      const recipes = await Promise.all(
        sharedRecipes.map((shared) =>
          enrichSharedRecipe(ctx, shared, user._id, true),
        ),
      );

      // Filter out null recipes and recipes owned by the current user
      const validRecipes = recipes.filter(
        (r): r is NonNullable<typeof r> => r !== null && !r.isOwner,
      );

      allRecipes.push(...validRecipes);
    }

    // Remove duplicates (same recipe shared to multiple households)
    const uniqueRecipes = new Map<Id<"recipes">, (typeof allRecipes)[number]>();
    for (const recipe of allRecipes) {
      if (recipe && !uniqueRecipes.has(recipe._id)) {
        uniqueRecipes.set(recipe._id, recipe);
      }
    }

    return Array.from(uniqueRecipes.values());
  },
});

export const getHouseholdsByRecipeId = query({
  args: {
    recipeId: v.id("recipes"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const recipe = await ctx.db.get(args.recipeId);

    if (!recipe) {
      throw new ConvexError("Recipe not found");
    }

    // System recipes: do not expose household associations. Only return households
    // where the user is a member (no global access to household membership).
    if (recipe.source === "system") {
      const householdRecipes = await ctx.db
        .query("householdRecipes")
        .withIndex("by_recipe", (q) => q.eq("recipeId", args.recipeId))
        .collect();

      const filtered: typeof householdRecipes = [];
      for (const hr of householdRecipes) {
        const isMember = await isHouseholdMember(ctx, user._id, hr.householdId);
        if (isMember) {
          filtered.push(hr);
        }
      }

      if (!filtered.length) {
        return null;
      }
      return filtered;
    }

    const { canAccess } = await canAccessRecipe(ctx, user._id, args.recipeId);
    if (!canAccess) {
      throw new ConvexError("You do not have access to this recipe");
    }

    const households = await ctx.db
      .query("householdRecipes")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.recipeId))
      .collect();

    if (!households.length) {
      return null;
    }

    return households;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new household
 */
export const createHousehold = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const subscription = await getUserSubscription(user, ctx);

    if (!args.name || args.name.trim().length === 0) {
      throw new ConvexError("Household name is required");
    }

    // Check free tier household limit
    const memberships = await ctx.db
      .query("householdMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    if (
      subscription.maxHouseholds !== -1 &&
      memberships.length >= subscription.maxHouseholds
    ) {
      throw new ConvexError(
        `You've reached the limit of ${subscription.maxHouseholds} household${subscription.maxHouseholds === 1 ? "" : "s"} on this plan.`,
      );
    }

    const now = Date.now();

    // Create the household
    const householdId = await ctx.db.insert("households", {
      name: args.name.trim(),
      ownerId: user._id,
      updatedAt: now,
    });

    // Add the creator as owner member
    await ctx.db.insert("householdMembers", {
      householdId,
      userId: user._id,
      role: "owner",
      joinedAt: now,
    });

    return { householdId };
  },
});

/**
 * Update household name (owner only)
 */
export const updateHousehold = mutation({
  args: {
    householdId: v.id("households"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Check ownership
    const isOwner = await isHouseholdOwner(ctx, user._id, args.householdId);
    if (!isOwner) {
      throw new ConvexError(
        "Only the household owner can update the household",
      );
    }

    if (!args.name || args.name.trim().length === 0) {
      throw new ConvexError("Household name is required");
    }

    await ctx.db.patch(args.householdId, {
      name: args.name.trim(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete a household and all related data (owner only)
 */
export const deleteHousehold = mutation({
  args: {
    householdId: v.id("households"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Check ownership
    const isOwner = await isHouseholdOwner(ctx, user._id, args.householdId);
    if (!isOwner) {
      throw new ConvexError(
        "Only the household owner can delete the household",
      );
    }

    // Delete all members
    const members = await ctx.db
      .query("householdMembers")
      .withIndex("by_household", (q) => q.eq("householdId", args.householdId))
      .collect();

    // Delete all invitations
    const invitations = await ctx.db
      .query("householdInvitations")
      .withIndex("by_household", (q) => q.eq("householdId", args.householdId))
      .collect();

    // Delete all shared recipes
    const sharedRecipes = await ctx.db
      .query("householdRecipes")
      .withIndex("by_household", (q) => q.eq("householdId", args.householdId))
      .collect();

    // Delete chalkboard items for this household
    const chalkboardItems = await ctx.db
      .query("chalkboardItems")
      .withIndex("by_household", (q) => q.eq("householdId", args.householdId))
      .collect();

    // Delete all related items
    const idsForDeletion = [
      ...members.map((member) => member._id),
      ...invitations.map((invitation) => invitation._id),
      ...sharedRecipes.map((sharedRecipe) => sharedRecipe._id),
      ...chalkboardItems.map((item) => item._id),
    ];

    await Promise.all(idsForDeletion.map((id) => ctx.db.delete(id)));

    // Finally, delete the household
    await ctx.db.delete(args.householdId);

    return { success: true };
  },
});

/**
 * Create a single-use invitation link
 */
export const createInvitationLink = mutation({
  args: {
    householdId: v.id("households"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Check ownership
    const isOwner = await isHouseholdOwner(ctx, user._id, args.householdId);
    if (!isOwner) {
      throw new ConvexError("Only the household owner can create invitations");
    }

    const token = generateInvitationToken();
    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

    const invitationId = await ctx.db.insert("householdInvitations", {
      householdId: args.householdId,
      invitedByUserId: user._id,
      status: "pending",
      token,
      expiresAt,
    });

    // Schedule to delete the invitation after it expires
    await ctx.scheduler.runAt(
      expiresAt,
      internal.households.deleteInvitationLink,
      {
        invitationId,
      },
    );

    return { invitationId, token };
  },
});

/**
 * Delete invitation link (internal)
 */
export const deleteInvitationLink = internalMutation({
  args: {
    invitationId: v.id("householdInvitations"),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) return;

    await ctx.db.delete(args.invitationId);
  },
});

/**
 * Accept invitation by token (single-use)
 */
export const acceptInvitationByToken = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const invitation = await ctx.db
      .query("householdInvitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!invitation) {
      throw new ConvexError("Invitation not found");
    }

    // Check if already used (consumed) - single-use only
    if (invitation.status === "accepted") {
      throw new ConvexError(
        "This invitation has already been used. Each invitation link can only be used once.",
      );
    }

    if (invitation.status === "expired") {
      throw new ConvexError("This invitation has expired");
    }

    if (invitation.expiresAt < Date.now()) {
      await ctx.db.patch(invitation._id, { status: "expired" });
      throw new ConvexError("This invitation has expired");
    }

    // Check if already a member
    const existingMembership = await ctx.db
      .query("householdMembers")
      .withIndex("by_user_and_household", (q) =>
        q.eq("userId", user._id).eq("householdId", invitation.householdId),
      )
      .unique();

    if (existingMembership) {
      // Already a member, just mark invitation as accepted
      await ctx.db.patch(invitation._id, {
        status: "accepted",
        invitedUserId: user._id,
      });
      return { householdId: invitation.householdId };
    }

    // Add user as member
    await ctx.db.insert("householdMembers", {
      householdId: invitation.householdId,
      userId: user._id,
      role: "member",
      joinedAt: Date.now(),
    });

    // Mark invitation as accepted and consumed
    await ctx.db.patch(invitation._id, {
      status: "accepted",
      invitedUserId: user._id,
    });

    return { householdId: invitation.householdId };
  },
});

/**
 * Remove a member from household (owner only)
 */
export const removeMember = mutation({
  args: {
    householdId: v.id("households"),
    membershipId: v.id("householdMembers"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Check ownership
    const isOwner = await isHouseholdOwner(ctx, user._id, args.householdId);
    if (!isOwner) {
      throw new ConvexError("Only the household owner can remove members");
    }

    const membership = await ctx.db.get(args.membershipId);
    if (!membership) {
      throw new ConvexError("Membership not found");
    }

    if (membership.householdId !== args.householdId) {
      throw new ConvexError("Membership does not belong to this household");
    }

    if (membership.role === "owner") {
      throw new ConvexError("Cannot remove the household owner");
    }

    await ctx.db.delete(args.membershipId);

    return { success: true };
  },
});

/**
 * Leave a household voluntarily
 */
export const leaveHousehold = mutation({
  args: {
    householdId: v.id("households"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const membership = await ctx.db
      .query("householdMembers")
      .withIndex("by_user_and_household", (q) =>
        q.eq("userId", user._id).eq("householdId", args.householdId),
      )
      .unique();

    if (!membership) {
      throw new ConvexError("You are not a member of this household");
    }

    if (membership.role === "owner") {
      throw new ConvexError(
        "The household owner cannot leave. Delete the household instead.",
      );
    }

    await ctx.db.delete(membership._id);

    return { success: true };
  },
});

/**
 * Share a recipe to a household
 */
export const shareRecipeToHousehold = mutation({
  args: {
    recipeId: v.id("recipes"),
    householdId: v.id("households"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Check if user is a member of the household
    const isMember = await isHouseholdMember(ctx, user._id, args.householdId);
    if (!isMember) {
      throw new ConvexError("You are not a member of this household");
    }

    // Check if user owns the recipe
    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe) {
      throw new ConvexError("Recipe not found");
    }

    if (recipe.userId !== user._id) {
      throw new ConvexError("You can only share your own recipes");
    }

    // Check if recipe is already shared
    const existingShare = await ctx.db
      .query("householdRecipes")
      .withIndex("by_household_and_recipe", (q) =>
        q.eq("householdId", args.householdId).eq("recipeId", args.recipeId),
      )
      .unique();

    if (existingShare) {
      throw new ConvexError("Recipe is already shared to this household");
    }

    await ctx.db.insert("householdRecipes", {
      householdId: args.householdId,
      recipeId: args.recipeId,
      sharedByUserId: user._id,
      sharedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Unshare a recipe from a household
 */
export const unshareRecipeFromHousehold = mutation({
  args: {
    recipeId: v.id("recipes"),
    householdId: v.id("households"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Check if recipe is shared
    const sharedRecipe = await ctx.db
      .query("householdRecipes")
      .withIndex("by_household_and_recipe", (q) =>
        q.eq("householdId", args.householdId).eq("recipeId", args.recipeId),
      )
      .unique();

    if (!sharedRecipe) {
      throw new ConvexError("Recipe is not shared to this household");
    }

    // Only the person who shared it or the household owner can unshare
    const isOwner = await isHouseholdOwner(ctx, user._id, args.householdId);
    const isSharer = sharedRecipe.sharedByUserId === user._id;

    if (!isOwner && !isSharer) {
      throw new ConvexError(
        "Only the household owner or the person who shared the recipe can unshare it",
      );
    }

    await ctx.db.delete(sharedRecipe._id);

    return { success: true };
  },
});

// ============================================================================
// INTERNAL QUERIES (for HTTP endpoints)
// ============================================================================
