import { ROUTES } from "@/app/constants";
import { PublicPageTracker } from "@/components/analytics/public-page-tracker";
import { IntentLandingBody } from "@/components/seo/intent-landing-body";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { buildFaqJsonLdFromPairs } from "@/lib/faq-json-ld";
import { serializeJsonLd } from "@/lib/json-ld";
import {
  INTENT_MEAL_PLANNING_FOR_BUSY_WEEKNIGHTS,
} from "@/lib/seo-intent-data";
import { buildIntentPageMetadata } from "@/lib/seo-intent-metadata";
import { getSiteBaseUrl } from "@/lib/site-url";
import type { Metadata } from "next";

export const metadata: Metadata = buildIntentPageMetadata(
  INTENT_MEAL_PLANNING_FOR_BUSY_WEEKNIGHTS,
);

export default function MealPlanningForBusyWeeknightsPage() {
  const pageUrl = `${getSiteBaseUrl()}${INTENT_MEAL_PLANNING_FOR_BUSY_WEEKNIGHTS.path}`;
  const faqJsonLd = buildFaqJsonLdFromPairs(
    INTENT_MEAL_PLANNING_FOR_BUSY_WEEKNIGHTS.faq,
    pageUrl,
  );
  const safeJsonLd = serializeJsonLd(faqJsonLd);

  return (
    <>
      <PublicPageTracker
        event={ANALYTICS_EVENTS.LANDING_VIEWED}
        props={{ intent_topic: "meal_planning_for_busy_weeknights" }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd }}
      />
      <IntentLandingBody
        intent={INTENT_MEAL_PLANNING_FOR_BUSY_WEEKNIGHTS}
        secondaryHref={ROUTES.HOUSEHOLD_MEAL_PLANNING}
        secondaryLabel="See household meal planning"
      />
    </>
  );
}
