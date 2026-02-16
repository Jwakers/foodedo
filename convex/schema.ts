import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  COMPLEXITY_TIERS,
  CUISINES,
  PREPARATION_OPTIONS,
  PRIMARY_PROTEINS,
  RECIPE_CATEGORIES,
  RECIPE_CREATION_SOURCES,
  RECIPE_SOURCES,
  SUBSCRIPTION_TIERS,
  UNITS_FLAT,
} from "./lib/constants";

const categoriesUnion = v.union(...RECIPE_CATEGORIES.map(v.literal));
const creationSourceUnion = v.union(...RECIPE_CREATION_SOURCES.map(v.literal));
const preparationUnion = v.union(...PREPARATION_OPTIONS.map(v.literal));
const unitsUnion = v.union(...UNITS_FLAT.map(v.literal));
const subscriptionTiersUnion = v.union(...SUBSCRIPTION_TIERS.map(v.literal));
const recipeSourceUnion = v.union(...RECIPE_SOURCES.map(v.literal));
const primaryProteinUnion = v.union(...PRIMARY_PROTEINS.map(v.literal));
const complexityTierUnion = v.union(...COMPLEXITY_TIERS.map(v.literal));
const cuisineUnion = v.union(...CUISINES.map(v.literal));

export {
  categoriesUnion,
  complexityTierUnion,
  creationSourceUnion,
  cuisineUnion,
  preparationUnion,
  primaryProteinUnion,
  recipeSourceUnion,
  subscriptionTiersUnion,
  unitsUnion,
};

export default defineSchema({
  users: defineTable({
    name: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    // this the Clerk ID, stored in the subject JWT field
    externalId: v.string(),
    subscriptionTier: v.optional(subscriptionTiersUnion),
    // Subscription tracking for failsafe sync
    subscriptionStatus: v.optional(v.string()), // active, canceled, etc.
    subscriptionId: v.optional(v.string()), // Clerk subscription ID
    lastSubscriptionSync: v.optional(v.number()), // timestamp of last sync
  }).index("byExternalId", ["externalId"]),

  recipes: defineTable({
    userId: v.optional(v.id("users")), // Optional for system recipes
    title: v.string(),
    description: v.optional(v.string()),
    image: v.optional(v.id("_storage")),
    prepTime: v.number(),
    cookTime: v.optional(v.number()),
    serves: v.number(),
    category: categoriesUnion,
    ingredients: v.optional(
      v.array(
        v.object({
          ingredientId: v.optional(v.id("ingredients")),
          name: v.string(),
          amount: v.optional(v.number()),
          unit: v.optional(unitsUnion),
          preparation: v.optional(preparationUnion),
        })
      )
    ),
    method: v.optional(
      v.array(
        v.object({
          title: v.string(),
          description: v.optional(v.string()),
          image: v.optional(v.id("_storage")),
        })
      )
    ),
    updatedAt: v.number(),
    // How the recipe was created (for publishing rights / attribution)
    creationSource: v.optional(creationSourceUnion),
    // Attribution & Source Information
    originalUrl: v.optional(v.string()), // URL where recipe was imported from
    originalAuthor: v.optional(v.string()), // Original recipe author/creator
    importedAt: v.optional(v.number()), // Timestamp when recipe was imported
    originalPublishedDate: v.optional(v.number()), // Original publication date from source
    nutrition: v.optional(
      v.object({
        calories: v.optional(v.number()),
        protein: v.optional(v.number()),
        fat: v.optional(v.number()),
        carbohydrates: v.optional(v.number()),
      })
    ),
    // Intelligent Weekly Generator metadata
    source: v.optional(recipeSourceUnion),
    primaryProtein: v.optional(primaryProteinUnion),
    complexityTier: v.optional(complexityTierUnion),
    cuisine: v.optional(v.array(cuisineUnion)), // Max 2 for fusion; validated in mutations
    totalTimeMinutes: v.optional(v.number()),
    editorialBias: v.optional(v.number()), // [0, 2]; neutral = 1
    isGeneratorEligible: v.optional(v.boolean()),
  })
    .index("by_user", ["userId"])
    .index("by_category", ["category"])
    .index("by_user_and_category", ["userId", "category"])
    .index("by_user_updatedAt", ["userId", "updatedAt"])
    .index("by_source", ["source"])
    .index("by_cuisine", ["cuisine"])
    .index("by_primaryProtein", ["primaryProtein"])
    .index("by_complexityTier", ["complexityTier"])
    .index("by_isGeneratorEligible", ["isGeneratorEligible"]),

  ingredients: defineTable({
    name: v.string(),
    displayName: v.optional(v.string()),
    foodGroup: v.optional(v.string()),
    foodSubGroup: v.optional(v.string()),
    isCustom: v.boolean(),
  }),

  households: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    updatedAt: v.number(),
  }).index("by_owner", ["ownerId"]),

  householdMembers: defineTable({
    householdId: v.id("households"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("member")),
    joinedAt: v.number(),
  })
    .index("by_household", ["householdId"])
    .index("by_user", ["userId"])
    .index("by_user_and_household", ["userId", "householdId"]),

  householdInvitations: defineTable({
    householdId: v.id("households"),
    invitedByUserId: v.id("users"),
    invitedUserId: v.optional(v.id("users")), // Set when invitation is accepted
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("expired")
    ),
    token: v.string(),
    expiresAt: v.number(),
  })
    .index("by_household", ["householdId"])
    .index("by_token", ["token"])
    .index("by_user", ["invitedUserId"])
    .index("by_status", ["status"]),

  recipeBehaviourStats: defineTable({
    recipeId: v.id("recipes"),
    actorType: v.union(v.literal("user"), v.literal("household")),
    actorId: v.union(v.id("users"), v.id("households")),
    suggestedCount: v.number(),
    swappedCount: v.number(),
    removedCount: v.number(),
    lastSuggestedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_recipe_and_actor", ["recipeId", "actorType", "actorId"])
    .index("by_actor", ["actorType", "actorId"])
    .index("by_actor_lastSuggestedAt", ["actorType", "actorId", "lastSuggestedAt"]),

  householdRecipes: defineTable({
    householdId: v.id("households"),
    recipeId: v.id("recipes"),
    sharedByUserId: v.id("users"),
    sharedAt: v.number(),
  })
    .index("by_household", ["householdId"])
    .index("by_recipe", ["recipeId"])
    .index("by_household_and_recipe", ["householdId", "recipeId"]),

  chalkboardItems: defineTable({
    text: v.string(),
    addedBy: v.id("users"),
    householdId: v.optional(v.id("households")),
  })
    .index("by_user", ["addedBy"])
    .index("by_household", ["householdId"])
    .index("by_user_and_household", ["addedBy", "householdId"]),

  shoppingLists: defineTable({
    userId: v.id("users"),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("completed")
    ),
    finalisedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    expiresAt: v.number(), // Auto-delete after 1 week
    // Track chalkboard items to delete on finalization
    chalkboardItemIds: v.array(v.id("chalkboardItems")),
    // Optional link to meal plan; users with meal plan access can access this list
    mealPlanId: v.optional(v.id("mealPlans")),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "status"])
    .index("by_expires", ["expiresAt"])
    .index("by_meal_plan", ["mealPlanId"]),

  shoppingListItems: defineTable({
    shoppingListId: v.id("shoppingLists"),
    name: v.string(),
    amount: v.union(v.number(), v.string(), v.null()),
    unit: v.optional(v.string()),
    preparation: v.optional(v.string()),
    checked: v.boolean(),
    order: v.number(), // Preserve item order
  }).index("by_shopping_list", ["shoppingListId"]),

  mealPlans: defineTable({
    userId: v.id("users"),
    householdId: v.optional(v.id("households")),
    endDate: v.number(), // start of day in ms
    startDate: v.optional(v.number()), // start of day in ms
    updatedAt: v.number(),
    isGenerated: v.optional(v.boolean()), // Should be changed to required post data migration
    generationSeed: v.optional(v.string()),
    generationVersion: v.optional(v.number()),
    generatedAt: v.optional(v.number()),
    replacedByPlanId: v.optional(v.id("mealPlans")),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_endDate", ["userId", "endDate"])
    .index("by_household", ["householdId"])
    .index("by_household_and_endDate", ["householdId", "endDate"])
    .index("by_replacedByPlanId", ["replacedByPlanId"]),

  mealPlanEntries: defineTable({
    mealPlanId: v.id("mealPlans"),
    date: v.number(), // start of day in ms
    recipeId: v.id("recipes"),
    mealLabel: v.optional(v.string()),
    order: v.optional(v.number()),
    isLocked: v.optional(v.boolean()),
  })
    .index("by_meal_plan", ["mealPlanId"])
    .index("by_meal_plan_and_date", ["mealPlanId", "date"]),
});
