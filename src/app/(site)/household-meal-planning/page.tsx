import { ROUTES } from "@/app/constants";
import { IntentLandingPageWrapper } from "@/components/seo/intent-landing-page-wrapper";
import { INTENT_HOUSEHOLD_MEAL_PLANNING } from "@/lib/seo-intent-data";
import { buildIntentPageMetadata } from "@/lib/seo-intent-metadata";
import type { Metadata } from "next";

export const metadata: Metadata = buildIntentPageMetadata(
  INTENT_HOUSEHOLD_MEAL_PLANNING,
);

export default function HouseholdMealPlanningPage() {
  return (
    <IntentLandingPageWrapper
      intent={INTENT_HOUSEHOLD_MEAL_PLANNING}
      secondaryHref={ROUTES.PRICING}
      secondaryLabel="View pricing"
    />
  );
}
