import { ROUTES } from "@/app/constants";
import { PublicPageTracker } from "@/components/analytics/public-page-tracker";
import { IntentLandingBody } from "@/components/seo/intent-landing-body";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { buildFaqJsonLdFromPairs } from "@/lib/faq-json-ld";
import { serializeJsonLd } from "@/lib/json-ld";
import { getSiteBaseUrl } from "@/lib/site-url";
import { buildIntentPageMetadata } from "@/lib/seo-intent-metadata";
import { INTENT_HOW_TO_CREATE_A_WEEKLY_MEAL_PLAN_FAST } from "@/lib/seo-intent-data";
import type { Metadata } from "next";

export const metadata: Metadata = buildIntentPageMetadata(
  INTENT_HOW_TO_CREATE_A_WEEKLY_MEAL_PLAN_FAST,
);

export default function HowToCreateWeeklyMealPlanFastPage() {
  const pageUrl = `${getSiteBaseUrl()}${INTENT_HOW_TO_CREATE_A_WEEKLY_MEAL_PLAN_FAST.path}`;
  const faqJsonLd = buildFaqJsonLdFromPairs(
    INTENT_HOW_TO_CREATE_A_WEEKLY_MEAL_PLAN_FAST.faq,
    pageUrl,
  );
  const safeJsonLd = serializeJsonLd(faqJsonLd);

  return (
    <>
      <PublicPageTracker
        event={ANALYTICS_EVENTS.LANDING_VIEWED}
        props={{ intent_topic: "how_to_create_weekly_meal_plan_fast" }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd }}
      />
      <IntentLandingBody
        intent={INTENT_HOW_TO_CREATE_A_WEEKLY_MEAL_PLAN_FAST}
        secondaryHref={ROUTES.MEAL_PLANNER_WITH_GROCERY_LIST}
        secondaryLabel="See meal planner and list together"
      />
    </>
  );
}
