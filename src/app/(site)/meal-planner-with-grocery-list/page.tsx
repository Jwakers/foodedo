import { ROUTES } from "@/app/constants";
import { IntentLandingPageWrapper } from "@/components/seo/intent-landing-page-wrapper";
import { INTENT_MEAL_PLANNER_WITH_GROCERY_LIST } from "@/lib/seo-intent-data";
import { buildIntentPageMetadata } from "@/lib/seo-intent-metadata";
import type { Metadata } from "next";

export const metadata: Metadata = buildIntentPageMetadata(
  INTENT_MEAL_PLANNER_WITH_GROCERY_LIST,
);

export default function MealPlannerWithGroceryListPage() {
  return (
    <IntentLandingPageWrapper
      intent={INTENT_MEAL_PLANNER_WITH_GROCERY_LIST}
      secondaryHref={ROUTES.FAMILY_MEAL_PLANNING}
      secondaryLabel="Explore family meal planning"
    />
  );
}
