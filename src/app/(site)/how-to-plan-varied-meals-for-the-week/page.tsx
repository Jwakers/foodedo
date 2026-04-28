import { ROUTES } from "@/app/constants";
import { PublicPageTracker } from "@/components/analytics/public-page-tracker";
import { IntentLandingBody } from "@/components/seo/intent-landing-body";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { buildFaqJsonLdFromPairs } from "@/lib/faq-json-ld";
import { serializeJsonLd } from "@/lib/json-ld";
import { getSiteBaseUrl } from "@/lib/site-url";
import {
  INTENT_HOW_TO_PLAN_VARIED_MEALS_FOR_THE_WEEK,
} from "@/lib/seo-intent-data";
import { buildIntentPageMetadata } from "@/lib/seo-intent-metadata";
import type { Metadata } from "next";

export const metadata: Metadata = buildIntentPageMetadata(
  INTENT_HOW_TO_PLAN_VARIED_MEALS_FOR_THE_WEEK,
);

export default function HowToPlanVariedMealsForTheWeekPage() {
  const pageUrl = `${getSiteBaseUrl()}${INTENT_HOW_TO_PLAN_VARIED_MEALS_FOR_THE_WEEK.path}`;
  const faqJsonLd = buildFaqJsonLdFromPairs(
    INTENT_HOW_TO_PLAN_VARIED_MEALS_FOR_THE_WEEK.faq,
    pageUrl,
  );
  const safeJsonLd = serializeJsonLd(faqJsonLd);

  return (
    <>
      <PublicPageTracker
        event={ANALYTICS_EVENTS.LANDING_VIEWED}
        props={{ intent_topic: "how_to_plan_varied_meals_for_the_week" }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd }}
      />
      <IntentLandingBody
        intent={INTENT_HOW_TO_PLAN_VARIED_MEALS_FOR_THE_WEEK}
        secondaryHref={ROUTES.DISCOVER}
        secondaryLabel="Browse recipe ideas"
      />
    </>
  );
}
