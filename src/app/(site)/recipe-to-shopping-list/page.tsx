import { ROUTES } from "@/app/constants";
import { IntentLandingPageWrapper } from "@/components/seo/intent-landing-page-wrapper";
import { INTENT_RECIPE_TO_SHOPPING_LIST } from "@/lib/seo-intent-data";
import { buildIntentPageMetadata } from "@/lib/seo-intent-metadata";
import type { Metadata } from "next";

export const metadata: Metadata = buildIntentPageMetadata(
  INTENT_RECIPE_TO_SHOPPING_LIST,
);

export default function RecipeToShoppingListPage() {
  return (
    <IntentLandingPageWrapper
      intent={INTENT_RECIPE_TO_SHOPPING_LIST}
      secondaryHref={ROUTES.FAQ}
      secondaryLabel="Read the FAQ"
    />
  );
}
