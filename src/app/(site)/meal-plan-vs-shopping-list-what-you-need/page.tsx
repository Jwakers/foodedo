import { ROUTES } from "@/app/constants";
import { PublicPageTracker } from "@/components/analytics/public-page-tracker";
import { IntentLandingBody } from "@/components/seo/intent-landing-body";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { buildFaqJsonLdFromPairs } from "@/lib/faq-json-ld";
import { serializeJsonLd } from "@/lib/json-ld";
import {
  INTENT_MEAL_PLAN_VS_SHOPPING_LIST_WHAT_YOU_NEED,
} from "@/lib/seo-intent-data";
import { buildIntentPageMetadata } from "@/lib/seo-intent-metadata";
import { getSiteBaseUrl } from "@/lib/site-url";
import type { Metadata } from "next";

export const metadata: Metadata = buildIntentPageMetadata(
  INTENT_MEAL_PLAN_VS_SHOPPING_LIST_WHAT_YOU_NEED,
);

export default function MealPlanVsShoppingListPage() {
  const pageUrl = `${getSiteBaseUrl()}${INTENT_MEAL_PLAN_VS_SHOPPING_LIST_WHAT_YOU_NEED.path}`;
  const faqJsonLd = buildFaqJsonLdFromPairs(
    INTENT_MEAL_PLAN_VS_SHOPPING_LIST_WHAT_YOU_NEED.faq,
    pageUrl,
  );
  const safeJsonLd = serializeJsonLd(faqJsonLd);

  return (
    <>
      <PublicPageTracker
        event={ANALYTICS_EVENTS.LANDING_VIEWED}
        props={{ intent_topic: "meal_plan_vs_shopping_list_what_you_need" }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd }}
      />
      <IntentLandingBody
        intent={INTENT_MEAL_PLAN_VS_SHOPPING_LIST_WHAT_YOU_NEED}
        secondaryHref={ROUTES.MEAL_PLANNER_WITH_GROCERY_LIST}
        secondaryLabel="See meal planner and list in one place"
      />
    </>
  );
}
