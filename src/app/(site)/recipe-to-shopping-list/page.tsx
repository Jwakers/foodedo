import { ROUTES } from "@/app/constants";
import { IntentLandingBody } from "@/components/seo/intent-landing-body";
import { buildFaqJsonLdFromPairs } from "@/lib/faq-json-ld";
import { serializeJsonLd } from "@/lib/json-ld";
import { getSiteBaseUrl } from "@/lib/site-url";
import { INTENT_RECIPE_TO_SHOPPING_LIST } from "@/lib/seo-intent-data";
import { buildIntentPageMetadata } from "@/lib/seo-intent-metadata";
import type { Metadata } from "next";

export const metadata: Metadata = buildIntentPageMetadata(
  INTENT_RECIPE_TO_SHOPPING_LIST,
);

export default function RecipeToShoppingListPage() {
  const pageUrl = `${getSiteBaseUrl()}${INTENT_RECIPE_TO_SHOPPING_LIST.path}`;
  const faqJsonLd = buildFaqJsonLdFromPairs(
    INTENT_RECIPE_TO_SHOPPING_LIST.faq,
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
        intent={INTENT_RECIPE_TO_SHOPPING_LIST}
        secondaryHref={ROUTES.FAQ}
        secondaryLabel="Read the FAQ"
      />
    </>
  );
}
