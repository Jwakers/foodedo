// ============================================================================
// RECIPE CONSTANTS
// ============================================================================

// Recipe Categories
export const RECIPE_CATEGORIES = [
  "main",
  "dessert",
  "snack",
  "appetizer",
  "side",
  "beverage",
  "breakfast",
  "lunch",
  "dinner",
] as const;

// How the recipe was created (for publishing rights / attribution)
export const RECIPE_CREATION_SOURCES = [
  "manual",
  "imported_website",
  "imported_text",
  "imported_photograph",
] as const;

// Preparation Options
export const PREPARATION_OPTIONS = [
  // Cutting styles
  "chopped",
  "finely chopped",
  "roughly chopped",
  "diced",
  "finely diced",
  "rough chop",
  "sliced",
  "thinly sliced",
  "thickly sliced",
  "chiffonade",
  "julienned",
  "brunoise",
  "minced",
  "grated",
  "finely grated",
  "shredded",
  "cubed",
  "quartered",
  "halved",
  "whole",
  "crushed",
  "crumbled",
  "mashed",
  "pureed",
  // Temperature states
  "room temperature",
  "chilled",
  "warmed",
  "softened",
  "melted",
  "frozen",
  "defrosted",
  // Processing methods
  "beaten",
  "whipped",
  "folded",
  "kneaded",
  "rolled",
  "pressed",
  "strained",
  "drained",
  "rinsed",
  "peeled",
  "trimmed",
  "seeded",
  "cored",
  "stemmed",
  "zested",
  "de-boned",
  "deveined",
  "filleted",
  "butterflied",
  // Cooking methods (pre-cooked ingredients)
  "blanched",
  "toasted",
  "roasted",
  "caramelized",
  "sautéed",
  "fried",
  "poached",
  "grilled",
  "boiled",
  "steamed",
  "smoked",
  // Freshness states
  "fresh",
  "dried",
] as const;

// Units - organised by category for better maintainability
export const UNITS = {
  volume: ["cups", "tsp", "tbsp", "fl oz", "gal", "ml", "l", "pt", "qt"],
  weight: ["lbs", "oz", "g", "kg", "mg"],
  count: ["pinch", "dash", "handful", "drop"],
  // Abstract/item-based measurements
  items: [
    "piece",
    "whole",
    "clove",
    "slice",
    "sheet",
    "sprig",
    "stalk",
    "stem",
    "head",
    "bunch",
    "bulb",
    "wedge",
    "cube",
    "strip",
    "fillet",
    "leaf",
    "can",
    "jar",
    "packet",
    "package",
    "container",
    "bottle",
    "bag",
    "box",
    "loaf",
    "stick",
    "square",
    "round",
    "breast",
    "thigh",
    "leg",
    "rack",
  ],
} as const;

// Flattened units array for schema compatibility
export const UNITS_FLAT = [
  ...UNITS.volume,
  ...UNITS.weight,
  ...UNITS.count,
  ...UNITS.items,
] as const;

// Recipe source (ownership/visibility for pool building)
export const RECIPE_SOURCES = ["user", "system", "community"] as const;

// Primary protein for variety constraints
export const PRIMARY_PROTEINS = [
  "chicken",
  "beef",
  "pork",
  "fish",
  "seafood",
  "vegetarian",
  "vegan",
  "lamb",
  "turkey",
  "other",
  "none",
] as const;

// Complexity tier (not speed — prep/cook time cover that)
export const COMPLEXITY_TIERS = ["simple", "moderate", "complex"] as const;

// Cuisine / cuisine-type for diversification (e.g. Thai curry vs korma = different cuisines). Max 2 per recipe for fusion.
export const CUISINES = [
  "italian",
  "indian",
  "mexican",
  "thai",
  "chinese",
  "japanese",
  "korean",
  "french",
  "mediterranean",
  "middle_eastern",
  "british",
  "american",
  "caribbean",
  "african",
  "vietnamese",
  "greek",
  "spanish",
  "other",
] as const;

/** Max cuisine selections per recipe (fusion food) */
export const CUISINE_MAX_SELECTIONS = 2;

// Intelligent Weekly Generator (Spec 4.4, 6.4)
/** Recipes suggested within this many days are excluded from the next generation (avoid repetition). */
export const RECENTLY_SUGGESTED_DAYS = 14;
/** Smoothing for acceptance score: (kept + SMOOTHING) / (suggested + SMOOTHING_FACTOR). Avoids 0/0; new recipes get ~0.5. */
export const SMOOTHING = 1;
export const SMOOTHING_FACTOR = 2;
/** Max times the same primary protein can appear in a generated week (variety constraint). */
export const MAX_PRIMARY_PROTEIN_PER_WEEK = 2;
/** Max times the same cuisine can appear in a generated week (diversification). */
export const MAX_CUISINE_PER_WEEK = 2;
/**
 * Multiplier applied to selection weight for non–Discover (non-system) recipes so a user’s
 * library is preferred over the system catalog when both are eligible.
 */
export const LIBRARY_MEAL_PLAN_WEIGHT_MULTIPLIER = 4;
/** Upper bound for getRecipesForWeeklyPlan limit (pool size for client/weekly plan). */
export const MAX_WEEKLY_PLAN_POOL_SIZE = 50;
export const MAX_DAYS_IN_MEAL_PLAN = 7;

/**
 * Recipe categories the weekly meal plan generator may pick (centrepiece meals).
 * Desserts, sides, snacks, appetizers, and drinks are never auto-selected.
 */
export const MEAL_PLAN_GENERATOR_CATEGORIES = [
  "main",
  "dinner",
  "lunch",
  "breakfast",
] as const;

export type MealPlanGeneratorCategory =
  (typeof MEAL_PLAN_GENERATOR_CATEGORIES)[number];

export function isRecipeCategoryUsedByMealPlanGenerator(
  category: string | undefined | null,
): boolean {
  if (category == null || category === "") return false;
  return (MEAL_PLAN_GENERATOR_CATEGORIES as readonly string[]).includes(
    category,
  );
}

type MealPlanPoolRecipeFields = {
  category?: string | null;
  excludeFromMealPlanGenerator?: boolean | null;
  primaryProtein?: string | null;
  complexityTier?: string | null;
  isGeneratorEligible?: boolean | null;
};

/** True when primary protein + complexity are set, or legacy isGeneratorEligible flag. */
export function recipeHasMealPlanGeneratorMetadata(
  recipe: Pick<
    MealPlanPoolRecipeFields,
    "primaryProtein" | "complexityTier" | "isGeneratorEligible"
  >,
): boolean {
  const hasMetadata =
    recipe.primaryProtein != null &&
    recipe.primaryProtein !== "" &&
    recipe.complexityTier != null &&
    recipe.complexityTier !== "";
  return recipe.isGeneratorEligible === true || hasMetadata;
}

/** Same rules as meal plan buildPool: category, opt-out, and generator metadata. */
export function recipeIsInMealPlanGeneratorPool(
  recipe: MealPlanPoolRecipeFields,
): boolean {
  if (recipe.excludeFromMealPlanGenerator === true) return false;
  if (!isRecipeCategoryUsedByMealPlanGenerator(recipe.category)) return false;
  return recipeHasMealPlanGeneratorMetadata(recipe);
}

// TypeScript types
export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number];
export type PreparationOption = (typeof PREPARATION_OPTIONS)[number];
export type Unit = (typeof UNITS_FLAT)[number];
export type RecipeSource = (typeof RECIPE_SOURCES)[number];
export type PrimaryProtein = (typeof PRIMARY_PROTEINS)[number];
export type ComplexityTier = (typeof COMPLEXITY_TIERS)[number];
export type Cuisine = (typeof CUISINES)[number];

// Property names should match clerk subscription tiers
export const SUBSCRIPTION_TIERS = ["free_user", "pro_user"] as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

/**
 * While true, free-tier users get premium features (e.g. leftover ingredients).
 * Set to false when leaving beta so only `pro_user` retains access via {@link canUseLeftoverIngredients}.
 */
export const BETA_FREE_INCLUDES_PREMIUM_FEATURES = true;

/** Max ingredients a user can select for “use up leftovers” flows. */
export const LEFTOVER_INGREDIENTS_MAX = 10;

/** Premium feature: search/rank recipes and boost meal-plan generation by leftover ingredients. */
export function canUseLeftoverIngredients(
  subscriptionTier: string | undefined,
): boolean {
  const tier = (subscriptionTier ?? "free_user") as SubscriptionTier;
  if (tier === "pro_user") return true;
  if (tier === "free_user") return BETA_FREE_INCLUDES_PREMIUM_FEATURES;
  return false;
}

type PlanLimits = {
  maxRecipes: number;
  maxHouseholds: number;
  maxActiveShoppingLists: number;
};

/** Plan limits by subscription tier. Use -1 to represent unlimited. */
export const PLANS: Record<SubscriptionTier, PlanLimits> = {
  // Beta: increased free tier limits. Original values: maxRecipes 15, maxHouseholds 1, maxActiveShoppingLists 3
  free_user: {
    maxRecipes: 100,
    maxHouseholds: 5,
    maxActiveShoppingLists: 10,
  },
  pro_user: {
    maxRecipes: -1, // unlimited
    maxHouseholds: -1, // unlimited
    maxActiveShoppingLists: -1, // unlimited
  },
} as const satisfies Record<SubscriptionTier, PlanLimits>;

export const FREE_TIER_LIMITS = PLANS.free_user;

// ============================================================================
// APP LIMITS & RESTRICTIONS
// Single source of truth for all limits, restrictions, and validations
// ============================================================================

/**
 * Image upload limits
 */
export const IMAGE_LIMITS = {
  /** Maximum file size for image uploads in bytes (10MB) */
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
  /** Maximum file size for image uploads in MB (for display) */
  MAX_FILE_SIZE_MB: 10,
  /** Allowed image MIME types */
  ALLOWED_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif",
  ] as const,
} as const;

/**
 * Text input limits
 */
export const TEXT_LIMITS = {
  /** Maximum length for chalkboard items */
  CHALKBOARD_MAX_LENGTH: 100,
  /** Minimum length for recipe text parsing */
  RECIPE_TEXT_MIN_LENGTH: 50,
  /** Maximum length for recipe text parsing */
  RECIPE_TEXT_MAX_LENGTH: 6000,
} as const;

/**
 * Recipe limits
 */
export const RECIPE_LIMITS = {
  /** Pagination limit for recipe listings */
  PAGINATION_LIMIT: 20,
  /** Maximum number of images for photo recipe import */
  MAX_PHOTO_IMAGES: 3,
} as const;

/**
 * Image compression settings
 */
export const IMAGE_COMPRESSION = {
  /** File size threshold (bytes) above which images should be compressed */
  COMPRESSION_THRESHOLD_BYTES: 2 * 1024 * 1024, // 2MB
  /** Maximum width for compressed images (pixels) */
  MAX_WIDTH: 2000,
  /** JPEG quality for compression (0-1) */
  QUALITY: 0.8,
} as const;

/**
 * Clamp editorialBias to schema invariant (0, 2]; neutral = 1.
 * Use in any mutation that writes recipe generator metadata (editorialBias).
 */
export function clampEditorialBias(value: number): number {
  return Math.min(Math.max(value, 0.001), 2);
}
