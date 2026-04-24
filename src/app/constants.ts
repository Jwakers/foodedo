import { IMAGE_LIMITS, RECIPE_CATEGORIES } from "convex/lib/constants";

// ============================================================================
// APP BRANDING
// ============================================================================

/**
 * Application name - used throughout the app for branding
 * Falls back to "Foodedo" if environment variable is not set
 */
export const APP_NAME = process.env.APP_NAME || "Foodedo";

export const ROUTES = {
  HOME: "/",
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  DASHBOARD: "/dashboard",
  /**
   * After sign-up: land on dashboard with a flag so we can send users without a
   * current-week meal plan straight to meal planning (see PostAuthMealPlanRedirect).
   */
  DASHBOARD_AFTER_SIGNUP: "/dashboard?planning=1",
  MY_RECIPES: "/dashboard/my-recipes",
  /** My Recipes page with Discover tab selected (use for in-app Discover links) */
  MY_RECIPES_DISCOVER_TAB: "/dashboard/my-recipes?tab=discover",
  RECIPE: "/recipe",
  IMPORT_RECIPE: "/dashboard/import-recipe",
  CREATE_RECIPE: "/dashboard/create-recipe",
  MEAL_PLAN: "/dashboard/meal-plan",
  /** Meal plan screen with a specific plan selected */
  mealPlanWithId: (planId: string) =>
    `/dashboard/meal-plan/${encodeURIComponent(planId)}`,
  SHOPPING_LIST: "/dashboard/shopping-list",
  /** URL for a specific shopping list (use with query param listId) */
  shoppingListWithId: (listId: string) =>
    `/dashboard/shopping-list?listId=${listId}`,
  HOUSEHOLDS: "/dashboard/households",
  PREFERENCES: "/dashboard/preferences",
  DISCOVER: "/discover",
  /** Public SEO intent landing pages (indexable). @see docs/GROWTH.md */
  FAMILY_MEAL_PLANNING: "/family-meal-planning",
  RECIPE_TO_SHOPPING_LIST: "/recipe-to-shopping-list",
  HOUSEHOLD_MEAL_PLANNING: "/household-meal-planning",
  /** Public help hub and docs (crawlable; no login required). */
  PUBLIC_SUPPORT: "/support",
  PUBLIC_SUPPORT_HOW_TO: "/support/how-to-use",
  PUBLIC_SUPPORT_CONTACT: "/support/contact",
  /** Public discover recipe (SEO-friendly). Use for links from Discover page. */
  DISCOVER_RECIPE: "/discover/recipe",
  /** URL for a specific discover recipe (use with `publicSlug`). */
  discoverRecipe: (publicSlug: string) => `/discover/recipe/${publicSlug}`,
  CHALKBOARD: "/dashboard/chalkboard",
  SUPPORT: "/dashboard/support",
  /** Public FAQ (indexable, JSON-LD). Prefer for marketing links. */
  FAQ: "/faq",
  SUPPORT_FAQ: "/dashboard/support/faq",
  SUPPORT_HOW_TO: "/dashboard/support/how-to-use",
  CONTACT: "/dashboard/support/contact",
  PRIVACY: "/privacy",
  TERMS: "/terms",
  PRICING: "/pricing",
  BLOG: "/blog",
  /** URL for a specific blog post (use with slug from Sanity) */
  blogPost: (slug: string) => `/blog/${slug}`,
  BETA: "/beta",
  /** Super user: manage canonical ingredients (admin only) */
  ADMIN_INGREDIENTS: "/dashboard/admin/ingredients",
  /** Super user: generate blog drafts (admin only) */
  ADMIN_BLOG_GENERATOR: "/dashboard/admin/blog-generator",
  /** Super user: generate blog hero images (admin only) */
  ADMIN_BLOG_IMAGES: "/dashboard/admin/blog-images",
  /** Super user: enhance recipe ingredients and method with AI (admin only) */
  ADMIN_RECIPE_ENHANCE: "/dashboard/admin/recipe-enhance",
} as const;

/** Recipe page: search param that opens cook mode on load (`?cook=1`). */
export const RECIPE_COOK_MODE_PARAM = "cook";

export function recipeUrlWithCookMode(recipeId: string): string {
  return `${ROUTES.RECIPE}/${recipeId}?${RECIPE_COOK_MODE_PARAM}=1`;
}

export const CATEGORY_COLORS: Record<
  (typeof RECIPE_CATEGORIES)[number],
  string
> = {
  main: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  dessert: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  snack:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  appetizer:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  side: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  beverage: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  breakfast:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  lunch:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  dinner: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export const CANNY_BOARD_SLUGS = {
  RECIPE_IMPORT_PARSING: "recipe-import-parsing",
  RECIPES_ORGANISATION: "recipes-organisation",
  HOUSEHOLD_SHARING: "household-sharing",
  SHOPPING_LISTS: "shopping-lists",
  BUGS_BROKEN_THINGS: "bugs-broken-things",
  IDEAS_FEATURE_REQUESTS: "ideas-feature-requests",
} as const;

// ============================================================================
// CLIENT-SIDE HELPER FUNCTIONS
// These use browser APIs (File) so must remain on the client
// Limits are defined in convex/lib/constants.ts (single source of truth)
// ============================================================================

/**
 * Helper function to format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Helper function to validate image file
 * Uses limits from convex/lib/constants.ts
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check file type against allowed types
  // Also check file extension for HEIC/HEIF since MIME type might not be set correctly
  const fileExtension = file.name.toLowerCase().split(".").pop();
  const isHeicByExtension =
    fileExtension === "heic" || fileExtension === "heif";
  const isHeicByType = file.type === "image/heic" || file.type === "image/heif";

  if (
    !IMAGE_LIMITS.ALLOWED_TYPES.includes(
      file.type as (typeof IMAGE_LIMITS.ALLOWED_TYPES)[number],
    ) &&
    !isHeicByExtension &&
    !isHeicByType
  ) {
    return {
      valid: false,
      error: `Please select a valid image file. Allowed types: ${IMAGE_LIMITS.ALLOWED_TYPES.join(", ")}, HEIC`,
    };
  }

  // Check file size
  if (file.size > IMAGE_LIMITS.MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Please select an image smaller than ${IMAGE_LIMITS.MAX_FILE_SIZE_MB}MB`,
    };
  }

  return { valid: true };
}
