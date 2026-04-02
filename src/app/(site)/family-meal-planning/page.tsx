import { ROUTES } from "@/app/constants";
import { IntentLandingBody } from "@/components/seo/intent-landing-body";
import { buildFaqJsonLdFromPairs } from "@/lib/faq-json-ld";
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
  const safeJsonLd = JSON.stringify(faqJsonLd).replace(/</g, "\\u003c");

  return (
    <>
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
