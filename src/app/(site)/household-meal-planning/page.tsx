import { ROUTES } from "@/app/constants";
import { IntentLandingBody } from "@/components/seo/intent-landing-body";
import { buildFaqJsonLdFromPairs } from "@/lib/faq-json-ld";
import { serializeJsonLd } from "@/lib/json-ld";
import { getSiteBaseUrl } from "@/lib/site-url";
import { INTENT_HOUSEHOLD_MEAL_PLANNING } from "@/lib/seo-intent-data";
import { buildIntentPageMetadata } from "@/lib/seo-intent-metadata";
import type { Metadata } from "next";

export const metadata: Metadata = buildIntentPageMetadata(
  INTENT_HOUSEHOLD_MEAL_PLANNING,
);

export default function HouseholdMealPlanningPage() {
  const pageUrl = `${getSiteBaseUrl()}${INTENT_HOUSEHOLD_MEAL_PLANNING.path}`;
  const faqJsonLd = buildFaqJsonLdFromPairs(
    INTENT_HOUSEHOLD_MEAL_PLANNING.faq,
    pageUrl,
  );
  const safeJsonLd = serializeJsonLd(faqJsonLd);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd }}
      />
      <IntentLandingBody
        intent={INTENT_HOUSEHOLD_MEAL_PLANNING}
        secondaryHref={ROUTES.PRICING}
        secondaryLabel="View pricing"
      />
    </>
  );
}
