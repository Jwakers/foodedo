import { ROUTES } from "@/app/constants";
import { IntentLandingPageWrapper } from "@/components/seo/intent-landing-page-wrapper";
import {
  INTENT_HOW_TO_PLAN_VARIED_MEALS_FOR_THE_WEEK,
} from "@/lib/seo-intent-data";
import { buildIntentPageMetadata } from "@/lib/seo-intent-metadata";
import type { Metadata } from "next";

export const metadata: Metadata = buildIntentPageMetadata(
  INTENT_HOW_TO_PLAN_VARIED_MEALS_FOR_THE_WEEK,
);

export default function HowToPlanVariedMealsForTheWeekPage() {
  return (
    <IntentLandingPageWrapper
      intent={INTENT_HOW_TO_PLAN_VARIED_MEALS_FOR_THE_WEEK}
      secondaryHref={ROUTES.DISCOVER}
      secondaryLabel="Browse recipe ideas"
    />
  );
}
