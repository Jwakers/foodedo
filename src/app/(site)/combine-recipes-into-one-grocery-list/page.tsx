import { ROUTES } from "@/app/constants";
import { PublicPageTracker } from "@/components/analytics/public-page-tracker";
import { IntentLandingBody } from "@/components/seo/intent-landing-body";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { buildFaqJsonLdFromPairs } from "@/lib/faq-json-ld";
import { serializeJsonLd } from "@/lib/json-ld";
import {
  INTENT_COMBINE_RECIPES_INTO_ONE_GROCERY_LIST,
} from "@/lib/seo-intent-data";
import { buildIntentPageMetadata } from "@/lib/seo-intent-metadata";
import { getSiteBaseUrl } from "@/lib/site-url";
import type { Metadata } from "next";

export const metadata: Metadata = buildIntentPageMetadata(
  INTENT_COMBINE_RECIPES_INTO_ONE_GROCERY_LIST,
);

export default function CombineRecipesIntoOneGroceryListPage() {
  const pageUrl = `${getSiteBaseUrl()}${INTENT_COMBINE_RECIPES_INTO_ONE_GROCERY_LIST.path}`;
  const faqJsonLd = buildFaqJsonLdFromPairs(
    INTENT_COMBINE_RECIPES_INTO_ONE_GROCERY_LIST.faq,
    pageUrl,
  );
  const safeJsonLd = serializeJsonLd(faqJsonLd);

  return (
    <>
      <PublicPageTracker
        event={ANALYTICS_EVENTS.LANDING_VIEWED}
        props={{ intent_topic: "combine_recipes_into_one_grocery_list" }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd }}
      />
      <IntentLandingBody
        intent={INTENT_COMBINE_RECIPES_INTO_ONE_GROCERY_LIST}
        secondaryHref={ROUTES.HOW_TO_MAKE_A_SHOPPING_LIST_FROM_RECIPES}
        secondaryLabel="See the step-by-step page"
      />
    </>
  );
}
