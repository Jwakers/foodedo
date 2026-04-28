import { ROUTES } from "@/app/constants";
import { IntentLandingPageWrapper } from "@/components/seo/intent-landing-page-wrapper";
import { INTENT_FAMILY_MEAL_PLANNING } from "@/lib/seo-intent-data";
import { buildIntentPageMetadata } from "@/lib/seo-intent-metadata";
import type { Metadata } from "next";

export const metadata: Metadata = buildIntentPageMetadata(
  INTENT_FAMILY_MEAL_PLANNING,
);

export default function FamilyMealPlanningPage() {
  return (
    <IntentLandingPageWrapper
      intent={INTENT_FAMILY_MEAL_PLANNING}
      secondaryHref={ROUTES.DISCOVER}
      secondaryLabel="Browse recipe ideas"
    />
  );
}
