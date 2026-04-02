export const ANALYTICS_EVENTS = {
  LANDING_VIEWED: "landing_viewed",
  CTA_CLICKED: "cta_clicked",
  SUPPORT_PAGE_VIEWED: "support_page_viewed",
  FAQ_VIEWED: "faq_viewed",
  DISCOVER_VIEWED: "discover_viewed",
  SECONDARY_ACTION_TAKEN: "secondary_action_taken",
  SIGNUP_STARTED: "signup_started",
  SIGNUP_COMPLETED: "signup_completed",
  SIGNIN_COMPLETED: "signin_completed",
  INSTALL_PROMPT_SHOWN: "install_prompt_shown",
  INSTALL_PROMPT_CLICKED: "install_prompt_clicked",
  INSTALL_PROMPT_OUTCOME: "install_prompt_outcome",
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
