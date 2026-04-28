import { ROUTES } from "@/app/constants";
import { PublicPageTracker } from "@/components/analytics/public-page-tracker";
import { IntentLandingBody } from "@/components/seo/intent-landing-body";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { buildFaqJsonLdFromPairs } from "@/lib/faq-json-ld";
import { serializeJsonLd } from "@/lib/json-ld";
import {
  INTENT_HOW_TO_MAKE_A_SHOPPING_LIST_FROM_RECIPES,
} from "@/lib/seo-intent-data";
import { buildIntentPageMetadata } from "@/lib/seo-intent-metadata";
import { getSiteBaseUrl } from "@/lib/site-url";
import type { Metadata } from "next";

export const metadata: Metadata = buildIntentPageMetadata(
  INTENT_HOW_TO_MAKE_A_SHOPPING_LIST_FROM_RECIPES,
);

export default function HowToMakeAShoppingListFromRecipesPage() {
  const pageUrl = `${getSiteBaseUrl()}${INTENT_HOW_TO_MAKE_A_SHOPPING_LIST_FROM_RECIPES.path}`;
  const faqJsonLd = buildFaqJsonLdFromPairs(
    INTENT_HOW_TO_MAKE_A_SHOPPING_LIST_FROM_RECIPES.faq,
    pageUrl,
  );
  const safeJsonLd = serializeJsonLd(faqJsonLd);

  return (
    <>
      <PublicPageTracker
        event={ANALYTICS_EVENTS.LANDING_VIEWED}
        props={{ intent_topic: "how_to_make_shopping_list_from_recipes" }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd }}
      />
      <IntentLandingBody
        intent={INTENT_HOW_TO_MAKE_A_SHOPPING_LIST_FROM_RECIPES}
        secondaryHref={ROUTES.RECIPE_TO_SHOPPING_LIST}
        secondaryLabel="See how recipe-to-list works"
      />
    </>
  );
}
