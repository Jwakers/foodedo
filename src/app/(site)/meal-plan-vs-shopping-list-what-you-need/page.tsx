import { ROUTES } from "@/app/constants";
import { IntentLandingPageWrapper } from "@/components/seo/intent-landing-page-wrapper";
import {
  INTENT_MEAL_PLAN_VS_SHOPPING_LIST_WHAT_YOU_NEED,
} from "@/lib/seo-intent-data";
import { buildIntentPageMetadata } from "@/lib/seo-intent-metadata";
import type { Metadata } from "next";

export const metadata: Metadata = buildIntentPageMetadata(
  INTENT_MEAL_PLAN_VS_SHOPPING_LIST_WHAT_YOU_NEED,
);

export default function MealPlanVsShoppingListPage() {
  return (
    <IntentLandingPageWrapper
      intent={INTENT_MEAL_PLAN_VS_SHOPPING_LIST_WHAT_YOU_NEED}
      secondaryHref={ROUTES.MEAL_PLANNER_WITH_GROCERY_LIST}
      secondaryLabel="See meal planner and list in one place"
    />
  );
}
