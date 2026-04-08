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
  MEAL_PLAN_BLANK_CREATED: "meal_plan_blank_created",
  MEAL_PLAN_REGENERATED: "meal_plan_regenerated",
  MEAL_PLAN_FINALISED: "meal_plan_finalised",
  MEAL_PLAN_SHARED_WITH_HOUSEHOLD: "meal_plan_shared_with_household",
  SHOPPING_LIST_GENERATED: "shopping_list_generated",
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
