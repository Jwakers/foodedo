import { ROUTES } from "@/app/constants";
import { IntentLandingPageWrapper } from "@/components/seo/intent-landing-page-wrapper";
import {
  INTENT_COMBINE_RECIPES_INTO_ONE_GROCERY_LIST,
} from "@/lib/seo-intent-data";
import { buildIntentPageMetadata } from "@/lib/seo-intent-metadata";
import type { Metadata } from "next";

export const metadata: Metadata = buildIntentPageMetadata(
  INTENT_COMBINE_RECIPES_INTO_ONE_GROCERY_LIST,
);

export default function CombineRecipesIntoOneGroceryListPage() {
  return (
    <IntentLandingPageWrapper
      intent={INTENT_COMBINE_RECIPES_INTO_ONE_GROCERY_LIST}
      secondaryHref={ROUTES.HOW_TO_MAKE_A_SHOPPING_LIST_FROM_RECIPES}
      secondaryLabel="See the step-by-step page"
    />
  );
}
