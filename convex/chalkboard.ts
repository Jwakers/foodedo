import { ConvexError, v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { mutation, query, QueryCtx } from "./_generated/server";
import { TEXT_LIMITS } from "./lib/constants";
import { isHouseholdMember } from "./households";
import { getCurrentUser, getCurrentUserOrThrow } from "./users";

const MAX_TEXT_LENGTH = TEXT_LIMITS.CHALKBOARD_MAX_LENGTH;

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all personal chalkboard items for the current user
 */
export const getPersonalChalkboard = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    // Return empty array if user doesn't exist yet (race condition on sign-in)
    if (!user) {
      return [];
    }

    const items = await ctx.db
      .query("chalkboardItems")
      .withIndex("by_user", (q) => q.eq("addedBy", user._id))
      .filter((q) => q.eq(q.field("householdId"), undefined))
      .collect();

    // Get user details for each item
    const itemsWithUser = await Promise.all(
      items.map(async (item) => {
        const addedByUser = await ctx.db.get(item.addedBy);
        return {
          ...item,
          addedByName: addedByUser?.name ?? "Unknown User",
        };
      })
    );

    return itemsWithUser.sort((a, b) => b._creationTime - a._creationTime);
  },
});

/**
 * Get all chalkboard items for a specific household
 */
export const getHouseholdChalkboard = query({
  args: {
    householdId: v.id("households"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Check if user is a member of the household
    const isMember = await isHouseholdMember(ctx, user._id, args.householdId);
    if (!isMember) {
      throw new ConvexError("You are not a member of this household");
    }

    const items = await ctx.db
      .query("chalkboardItems")
      .withIndex("by_household", (q) => q.eq("householdId", args.householdId))
      .collect();

    // Get user details for each item
    const itemsWithUser = await enrichItemsWithUserNames(ctx, items);

    return itemsWithUser.sort((a, b) => b._creationTime - a._creationTime);
  },
});

/**
 * Get all chalkboard items for all households the user is a member of.
 * Returns empty object if user is not yet authenticated (e.g. during initial load).
 */
export const getAllHouseholdChalkboards = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return {};
    }

    // Get all household memberships for the user
    const memberships = await ctx.db
      .query("householdMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Fetch chalkboard items for each household
    const householdChalkboards = new Map<
      Id<"households">,
      (Doc<"chalkboardItems"> & { addedByName: string })[]
    >();

    for (const membership of memberships) {
      const items = await ctx.db
        .query("chalkboardItems")
        .withIndex("by_household", (q) =>
          q.eq("householdId", membership.householdId)
        )
        .collect();

      // Get user details for each item
      const itemsWithUser = await enrichItemsWithUserNames(ctx, items);

      householdChalkboards.set(membership.householdId, itemsWithUser);
    }

    // Convert Map to plain object for Convex serialization
    return Object.fromEntries(householdChalkboards);
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Add an item to the user's personal chalkboard
 */
export const addPersonalItem = mutation({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Validate text length
    if (!args.text || args.text.trim().length === 0) {
      throw new ConvexError("Item text cannot be empty");
    }

    if (args.text.length > MAX_TEXT_LENGTH) {
      throw new ConvexError(
        `Item text cannot exceed ${MAX_TEXT_LENGTH} characters`
      );
    }

    const itemId = await ctx.db.insert("chalkboardItems", {
      text: args.text.trim(),
      addedBy: user._id,
      householdId: undefined,
    });

    return { itemId };
  },
});

/**
 * Add an item to a household chalkboard
 */
export const addHouseholdItem = mutation({
  args: {
    text: v.string(),
    householdId: v.id("households"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Check if user is a member of the household
    const isMember = await isHouseholdMember(ctx, user._id, args.householdId);
    if (!isMember) {
      throw new ConvexError("You are not a member of this household");
    }

    // Validate text length
    if (!args.text || args.text.trim().length === 0) {
      throw new ConvexError("Item text cannot be empty");
    }

    if (args.text.length > MAX_TEXT_LENGTH) {
      throw new ConvexError(
        `Item text cannot exceed ${MAX_TEXT_LENGTH} characters`
      );
    }

    const itemId = await ctx.db.insert("chalkboardItems", {
      text: args.text.trim(),
      addedBy: user._id,
      householdId: args.householdId,
    });

    return { itemId };
  },
});

/**
 * Delete an item from personal chalkboard (must be the owner)
 */
export const deletePersonalItem = mutation({
  args: {
    itemId: v.id("chalkboardItems"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new ConvexError("Item not found");
    }

    // Check if user owns the item
    if (item.addedBy !== user._id) {
      throw new ConvexError("You can only delete your own items");
    }

    // Check if it's a personal item (no household)
    if (item.householdId !== undefined) {
      throw new ConvexError("This is not a personal item");
    }

    await ctx.db.delete(args.itemId);

    return { success: true };
  },
});

/**
 * Delete an item from household chalkboard (any household member can delete)
 */
export const deleteHouseholdItem = mutation({
  args: {
    itemId: v.id("chalkboardItems"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new ConvexError("Item not found");
    }

    // Check if it's a household item
    if (item.householdId === undefined) {
      throw new ConvexError("This is not a household item");
    }

    // Check if user is a member of the household (any member can delete)
    const isMember = await isHouseholdMember(ctx, user._id, item.householdId);
    if (!isMember) {
      throw new ConvexError("Only household members can delete items");
    }

    await ctx.db.delete(args.itemId);

    return { success: true };
  },
});

/**
 * Clear all personal chalkboard items for current user
 */
export const clearPersonalChalkboard = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);

    const items = await ctx.db
      .query("chalkboardItems")
      .withIndex("by_user", (q) => q.eq("addedBy", user._id))
      .filter((q) => q.eq(q.field("householdId"), undefined))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    return { deletedCount: items.length };
  },
});

/**
 * Clear all household chalkboard items (any member can call)
 */
export const clearHouseholdChalkboard = mutation({
  args: {
    householdId: v.id("households"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Check if user is a member of the household
    const isMember = await isHouseholdMember(ctx, user._id, args.householdId);
    if (!isMember) {
      throw new ConvexError("You are not a member of this household");
    }

    const items = await ctx.db
      .query("chalkboardItems")
      .withIndex("by_household", (q) => q.eq("householdId", args.householdId))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    return { deletedCount: items.length };
  },
});

/**
 * Delete specific chalkboard items by IDs (used when combining with shopping list)
 */
export const deleteItemsByIds = mutation({
  args: {
    itemIds: v.array(v.id("chalkboardItems")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    let deletedCount = 0;

    for (const itemId of args.itemIds) {
      const item = await ctx.db.get(itemId);
      if (!item) continue;

      // For personal items, only the owner can delete
      // For household items, any member can delete when combining with shopping list
      if (item.householdId === undefined) {
        if (item.addedBy !== user._id) {
          continue; // Skip items user doesn't own
        }
      } else {
        // Check household membership
        const isMember = await isHouseholdMember(
          ctx,
          user._id,
          item.householdId
        );
        if (!isMember) {
          continue; // Skip items from households user isn't in
        }
      }

      await ctx.db.delete(itemId);
      deletedCount++;
    }

    return { deletedCount };
  },
});

// ============================================================================
// HELPERS
// ============================================================================

async function enrichItemsWithUserNames(
  ctx: QueryCtx,
  items: Doc<"chalkboardItems">[]
) {
  const itemsWithUser = await Promise.all(
    items.map(async (item) => {
      const addedByUser = await ctx.db.get(item.addedBy);
      return {
        ...item,
        addedByName: addedByUser?.name ?? "Unknown User",
      };
    })
  );
  return itemsWithUser.sort((a, b) => b._creationTime - a._creationTime);
}
