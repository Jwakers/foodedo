import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  COMPLEXITY_TIERS,
  CUISINES,
  // ... keep alphabetical-ish import grouping
  PREPARATION_OPTIONS,
  PRIMARY_PROTEINS,
  RECIPE_CATEGORIES,
  RECIPE_CREATION_SOURCES,
  RECIPE_SOURCES,
  SUBSCRIPTION_TIERS,
  UNITS_FLAT,
} from "./lib/constants";
import { INGREDIENT_FOOD_GROUPS } from "./lib/ingredientFoodGroups";
import { INGREDIENT_FOOD_SUB_GROUPS } from "./lib/ingredientFoodSubGroups";

const categoriesUnion = v.union(...RECIPE_CATEGORIES.map(v.literal));
const creationSourceUnion = v.union(...RECIPE_CREATION_SOURCES.map(v.literal));
const preparationUnion = v.union(...PREPARATION_OPTIONS.map(v.literal));
const unitsUnion = v.union(...UNITS_FLAT.map(v.literal));
const subscriptionTiersUnion = v.union(...SUBSCRIPTION_TIERS.map(v.literal));
const recipeSourceUnion = v.union(...RECIPE_SOURCES.map(v.literal));
const primaryProteinUnion = v.union(...PRIMARY_PROTEINS.map(v.literal));
const complexityTierUnion = v.union(...COMPLEXITY_TIERS.map(v.literal));
const cuisineUnion = v.union(...CUISINES.map(v.literal));
const ingredientFoodGroupUnion = v.union(
  ...INGREDIENT_FOOD_GROUPS.map(v.literal),
);
const ingredientFoodSubGroupUnion = v.union(
  ...INGREDIENT_FOOD_SUB_GROUPS.map(v.literal),
);

export {
  categoriesUnion,
  complexityTierUnion,
  creationSourceUnion,
  cuisineUnion,
  ingredientFoodGroupUnion,
  ingredientFoodSubGroupUnion,
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
    // Super user: only set via Convex dashboard / DB; no app mutation may update this
    isSuperUser: v.optional(v.boolean()),
    subscriptionTier: v.optional(subscriptionTiersUnion),
    // Subscription tracking for failsafe sync
    subscriptionStatus: v.optional(v.string()), // active, canceled, etc.
    subscriptionId: v.optional(v.string()), // Clerk subscription ID
    lastSubscriptionSync: v.optional(v.number()), // timestamp of last sync
    preferences: v.optional(
      v.object({
        allergyIngredientIds: v.optional(v.array(v.id("ingredients"))),
        allergyPhrases: v.optional(v.array(v.string())),
        excludedPrimaryProteins: v.optional(v.array(primaryProteinUnion)),
      }),
    ),
  }).index("byExternalId", ["externalId"]),

  recipes: defineTable({
    userId: v.optional(v.id("users")), // Optional for system recipes
    title: v.string(),
    description: v.optional(v.string()),
    image: v.optional(v.id("_storage")),
    /** Main recipe image: set when it came from AI vs manual upload (manual path sets user_upload). */
    heroImageOrigin: v.optional(
      v.union(v.literal("user_upload"), v.literal("ai")),
    ),
    prepTime: v.number(),
    cookTime: v.optional(v.number()),
    serves: v.number(),
    category: categoriesUnion,
    ingredients: v.optional(
      v.array(
        v.object({
          id: v.optional(v.string()), // Stable id unique within this recipe; backfilled by migration
          ingredientId: v.optional(v.id("ingredients")),
          name: v.string(),
          amount: v.optional(v.number()),
          unit: v.optional(unitsUnion),
          preparation: v.optional(v.union(preparationUnion, v.null())),
        }),
      ),
    ),
    method: v.optional(
      v.array(
        v.object({
          title: v.string(),
          description: v.optional(v.string()),
          image: v.optional(v.id("_storage")),
          // Deprecated: legacy step-level canonical ids; strip via backfillMethodStepIngredientRefs, then remove from schema
          ingredientIds: v.optional(v.array(v.id("ingredients"))),
          ingredientRefs: v.optional(v.array(v.string())), // recipe.ingredients[].id
          ingredientRefsSource: v.optional(
            v.union(v.literal("auto"), v.literal("user")),
          ),
        }),
      ),
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
      }),
    ),
    // Intelligent Weekly Generator metadata
    source: v.optional(recipeSourceUnion),
    primaryProtein: v.optional(primaryProteinUnion),
    complexityTier: v.optional(complexityTierUnion),
    cuisine: v.optional(v.array(cuisineUnion)), // Max 2 for fusion; validated in mutations
    totalTimeMinutes: v.optional(v.number()),
    editorialBias: v.optional(v.number()), // (0, 2]; neutral = 1
    isGeneratorEligible: v.optional(v.boolean()),
    /** When true, recipe is omitted from the weekly meal plan generator pool (default: included). */
    excludeFromMealPlanGenerator: v.optional(v.boolean()),
    /** URL segment for public discover pages; unique among system recipes when set */
    publicSlug: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_category", ["category"])
    .index("by_user_and_category", ["userId", "category"])
    .index("by_user_updatedAt", ["userId", "updatedAt"])
    .index("by_source", ["source"])
    .index("by_cuisine", ["cuisine"])
    .index("by_primaryProtein", ["primaryProtein"])
    .index("by_complexityTier", ["complexityTier"])
    .index("by_isGeneratorEligible", ["isGeneratorEligible"])
    .index("by_publicSlug", ["publicSlug"]),

  /** Audit + quota for Pro AI recipe image generation (one row per attempt/job). */
  recipeAiHeroImageAttempts: defineTable({
    userId: v.id("users"),
    recipeId: v.id("recipes"),
    status: v.union(
      v.literal("pending"),
      v.literal("succeeded"),
      v.literal("failed"),
      v.literal("expired"),
    ),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    model: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    recipeTitleSnapshot: v.optional(v.string()),
    promptCharLength: v.optional(v.number()),
    storageId: v.optional(v.id("_storage")),
  })
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_recipe_created", ["recipeId", "createdAt"])
    .index("by_user_status", ["userId", "status"]),

  ingredients: defineTable({
    name: v.string(),
    displayName: v.optional(v.string()),
    foodGroup: v.optional(ingredientFoodGroupUnion),
    foodSubGroup: v.optional(ingredientFoodSubGroupUnion),
    externalId: v.optional(v.string()), // e.g. FOOD00001 for sync/upsert from seed
    aliases: v.optional(v.array(v.string())), // optional; for manual synonym lookup
  }).index("by_externalId", ["externalId"]),

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
      v.literal("expired"),
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
    .index("by_actor_lastSuggestedAt", [
      "actorType",
      "actorId",
      "lastSuggestedAt",
    ]),

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
      v.literal("completed"),
    ),
    finalisedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    expiresAt: v.number(), // Auto-delete after 1 week
    // Track chalkboard items to delete on finalization
    chalkboardItemIds: v.array(v.id("chalkboardItems")),
    // Optional link to meal plan; users with meal plan access can access this list
    mealPlanId: v.optional(v.id("mealPlans")),
    // When set and not private, any member of this household can access the list
    householdId: v.optional(v.id("households")),
    // When true, only the owner can access (opt-out of household visibility)
    isPrivate: v.optional(v.boolean()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "status"])
    .index("by_expires", ["expiresAt"])
    .index("by_meal_plan", ["mealPlanId"])
    .index("by_household", ["householdId"]),

  shoppingListItems: defineTable({
    shoppingListId: v.id("shoppingLists"),
    name: v.string(),
    amount: v.union(v.number(), v.string(), v.null()),
    unit: v.optional(v.string()),
    preparation: v.optional(v.string()),
    checked: v.boolean(),
    order: v.number(), // Preserve item order
    ingredientId: v.optional(v.id("ingredients")), // Canonical ingredient for grouping
    // List of (amount, unit) per use – when present, display these instead of combining
    amountEntries: v.optional(
      v.array(
        v.object({
          amount: v.union(v.number(), v.string(), v.null()),
          unit: v.optional(v.string()),
        }),
      ),
    ),
    // Recipe IDs this line came from (for dev-mode "from" links)
    recipeIds: v.optional(v.array(v.id("recipes"))),
    /** Meal-plan “already have” overlap: canonical ingredient + inclusion mode + baseline for edits */
    mealPlanLeftoverIngredientId: v.optional(v.id("ingredients")),
    leftoverIncludeMode: v.optional(
      v.union(v.literal("full"), v.literal("reduced")),
    ),
    leftoverReducedScale: v.optional(v.number()),
    leftoverBaseline: v.optional(
      v.object({
        amount: v.union(v.number(), v.string(), v.null()),
        unit: v.optional(v.string()),
        amountEntries: v.array(
          v.object({
            amount: v.union(v.number(), v.string(), v.null()),
            unit: v.optional(v.string()),
          }),
        ),
      }),
    ),
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
    isFinalised: v.optional(v.boolean()), // when true, no add/remove/swap/regenerate; only move between days
    /** When set, generation used “use up leftovers” for this plan (audit / future UX). */
    leftoverIngredientIds: v.optional(v.array(v.id("ingredients"))),
    /** Free-text targets (no catalog row); matched with fuzzy line matching. */
    leftoverIngredientPhrases: v.optional(v.array(v.string())),
    /** Household members included when generation aggregated profile constraints. */
    includedMemberUserIds: v.optional(v.array(v.id("users"))),
    /** Snapshot of generation-time aggregated preference constraints for audit/debug. */
    preferenceFilterSnapshot: v.optional(
      v.object({
        allergyIngredientIds: v.array(v.id("ingredients")),
        allergyPhrases: v.array(v.string()),
        excludedPrimaryProteins: v.array(primaryProteinUnion),
      }),
    ),
    /** Optional generation-time target: guarantee this many meals at or under max total minutes. */
    quickMealsCount: v.optional(v.number()),
    quickMealsMaxMinutes: v.optional(v.number()),
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
