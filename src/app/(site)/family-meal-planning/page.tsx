import { ROUTES } from "@/app/constants";
import { PublicPageTracker } from "@/components/analytics/public-page-tracker";
import { IntentLandingBody } from "@/components/seo/intent-landing-body";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { buildFaqJsonLdFromPairs } from "@/lib/faq-json-ld";
import { serializeJsonLd } from "@/lib/json-ld";
import { getSiteBaseUrl } from "@/lib/site-url";
import { INTENT_FAMILY_MEAL_PLANNING } from "@/lib/seo-intent-data";
import { buildIntentPageMetadata } from "@/lib/seo-intent-metadata";
import type { Metadata } from "next";

export const metadata: Metadata = buildIntentPageMetadata(
  INTENT_FAMILY_MEAL_PLANNING,
);

export default function FamilyMealPlanningPage() {
  const pageUrl = `${getSiteBaseUrl()}${INTENT_FAMILY_MEAL_PLANNING.path}`;
  const faqJsonLd = buildFaqJsonLdFromPairs(
    INTENT_FAMILY_MEAL_PLANNING.faq,
    pageUrl,
  );
  const safeJsonLd = serializeJsonLd(faqJsonLd);

  return (
    <>
      <PublicPageTracker
        event={ANALYTICS_EVENTS.LANDING_VIEWED}
        props={{ intent_topic: "family_meal_planning" }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd }}
      />
      <IntentLandingBody
        intent={INTENT_FAMILY_MEAL_PLANNING}
        secondaryHref={ROUTES.DISCOVER}
        secondaryLabel="Browse recipe ideas"
      />
    </>
  );
}
