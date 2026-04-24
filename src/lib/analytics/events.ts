export const ANALYTICS_EVENTS = {
  LANDING_VIEWED: "landing_viewed",
  CTA_CLICKED: "cta_clicked",
  SUPPORT_PAGE_VIEWED: "support_page_viewed",
  SUPPORT_HOW_TO_VIEWED: "support_how_to_viewed",
  FAQ_VIEWED: "faq_viewed",
  DISCOVER_VIEWED: "discover_viewed",
  SECONDARY_ACTION_TAKEN: "secondary_action_taken",
  SIGNUP_STARTED: "signup_started",
  SIGNUP_COMPLETED: "signup_completed",
  SIGNIN_COMPLETED: "signin_completed",
  /**
   * Install funnel. Payloads include `surface` where emitted (e.g. `global_banner`;
   * legacy events may omit it).
   */
  INSTALL_PROMPT_SHOWN: "install_prompt_shown",
  INSTALL_PROMPT_CLICKED: "install_prompt_clicked",
  INSTALL_PROMPT_OUTCOME: "install_prompt_outcome",
  RECIPE_IMPORTED: "recipe_imported",
  RECIPE_CREATED: "recipe_created",
  RECIPE_DELETED: "recipe_deleted",
  RECIPE_SHARED_TO_HOUSEHOLD: "recipe_shared_to_household",
  RECIPE_UNSHARED_FROM_HOUSEHOLD: "recipe_unshared_from_household",
  HOUSEHOLD_CREATED: "household_created",
  HOUSEHOLD_INVITATION_ACCEPTED: "household_invitation_accepted",
  MEAL_PLAN_GENERATED: "meal_plan_generated",
  /** Fired once per session when the dashboard loads and there is no current meal plan. */
  ONBOARDING_DASHBOARD_NO_PLAN_VIEWED: "onboarding_dashboard_no_plan_viewed",
  /** Fired once per session when the meal plan page shows the empty (no plans) state. */
  ONBOARDING_MEAL_PLAN_EMPTY_VIEWED: "onboarding_meal_plan_empty_viewed",
  /** User tapped generate before the mutation runs (empty state or top bar). */
  ONBOARDING_GENERATE_WEEK_CLICKED: "onboarding_generate_week_clicked",
  /** Generate week failed (e.g. empty recipe pool). */
  MEAL_PLAN_GENERATE_FAILED: "meal_plan_generate_failed",
  MEAL_PLAN_BLANK_CREATED: "meal_plan_blank_created",
  MEAL_PLAN_REGENERATED: "meal_plan_regenerated",
  MEAL_PLAN_FINALISED: "meal_plan_finalised",
  MEAL_PLAN_SHARED_WITH_HOUSEHOLD: "meal_plan_shared_with_household",
  SHOPPING_LIST_GENERATED: "shopping_list_generated",
  SERVINGS_TARGET_UPDATED: "servings_target_updated",
  SERVINGS_TARGET_RESET: "servings_target_reset",
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export type SharedAttributionProps = {
  page_path?: string;
  intent_topic?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer_domain?: string;
};

export type AnalyticsProps = SharedAttributionProps & Record<string, unknown>;
