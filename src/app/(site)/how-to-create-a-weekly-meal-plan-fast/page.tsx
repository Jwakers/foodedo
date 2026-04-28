import { ROUTES } from "@/app/constants";
import { IntentLandingPageWrapper } from "@/components/seo/intent-landing-page-wrapper";
import { buildIntentPageMetadata } from "@/lib/seo-intent-metadata";
import { INTENT_HOW_TO_CREATE_A_WEEKLY_MEAL_PLAN_FAST } from "@/lib/seo-intent-data";
import type { Metadata } from "next";

export const metadata: Metadata = buildIntentPageMetadata(
  INTENT_HOW_TO_CREATE_A_WEEKLY_MEAL_PLAN_FAST,
);

export default function HowToCreateWeeklyMealPlanFastPage() {
  return (
    <IntentLandingPageWrapper
      intent={INTENT_HOW_TO_CREATE_A_WEEKLY_MEAL_PLAN_FAST}
      secondaryHref={ROUTES.MEAL_PLANNER_WITH_GROCERY_LIST}
      secondaryLabel="See meal planner and list together"
    />
  );
}
