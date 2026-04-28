import { ROUTES } from "@/app/constants";
import { IntentLandingPageWrapper } from "@/components/seo/intent-landing-page-wrapper";
import {
  INTENT_HOW_TO_MAKE_A_SHOPPING_LIST_FROM_RECIPES,
} from "@/lib/seo-intent-data";
import { buildIntentPageMetadata } from "@/lib/seo-intent-metadata";
import type { Metadata } from "next";

export const metadata: Metadata = buildIntentPageMetadata(
  INTENT_HOW_TO_MAKE_A_SHOPPING_LIST_FROM_RECIPES,
);

export default function HowToMakeAShoppingListFromRecipesPage() {
  return (
    <IntentLandingPageWrapper
      intent={INTENT_HOW_TO_MAKE_A_SHOPPING_LIST_FROM_RECIPES}
      secondaryHref={ROUTES.RECIPE_TO_SHOPPING_LIST}
      secondaryLabel="See how recipe-to-list works"
    />
  );
}
