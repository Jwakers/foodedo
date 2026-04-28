import { ROUTES } from "@/app/constants";
import { IntentLandingPageWrapper } from "@/components/seo/intent-landing-page-wrapper";
import {
  INTENT_MEAL_PLANNING_FOR_BUSY_WEEKNIGHTS,
} from "@/lib/seo-intent-data";
import { buildIntentPageMetadata } from "@/lib/seo-intent-metadata";
import type { Metadata } from "next";

export const metadata: Metadata = buildIntentPageMetadata(
  INTENT_MEAL_PLANNING_FOR_BUSY_WEEKNIGHTS,
);

export default function MealPlanningForBusyWeeknightsPage() {
  return (
    <IntentLandingPageWrapper
      intent={INTENT_MEAL_PLANNING_FOR_BUSY_WEEKNIGHTS}
      secondaryHref={ROUTES.HOUSEHOLD_MEAL_PLANNING}
      secondaryLabel="See household meal planning"
    />
  );
}
