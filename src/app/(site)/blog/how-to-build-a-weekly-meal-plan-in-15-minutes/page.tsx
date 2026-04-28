import { ROUTES } from "@/app/constants";
import {
  buildStaticGuideMetadata,
  StaticSeoGuideLayout,
} from "@/app/(site)/blog/_components/static-seo-guide-layout";

const GUIDE_PATH = "/blog/how-to-build-a-weekly-meal-plan-in-15-minutes";

export const metadata = buildStaticGuideMetadata({
  title: "How to Build a Weekly Meal Plan in 15 Minutes",
  description:
    "A practical 15-minute routine to create your weekly meal plan and stay realistic on busy days.",
  canonicalPath: GUIDE_PATH,
});

export default function HowToBuildWeeklyMealPlanIn15MinutesGuide() {
  return (
    <StaticSeoGuideLayout
      title="How to Build a Weekly Meal Plan in 15 Minutes"
      description="A quick structure that helps you plan dinners fast without overthinking."
      sections={[
        {
          heading: "Minute 1-3: set your week shape",
          body: "Check your calendar and mark your busiest nights first. Decide how many dinners you actually need this week.",
        },
        {
          heading: "Minute 4-7: add your easiest wins",
          body: "Place 2 to 3 reliable favourites first. This reduces decision fatigue and gives your week a stable base.",
        },
        {
          heading: "Minute 8-11: fill gaps with one or two fresh ideas",
          body: "Use your saved recipes, imported links, or Discover to fill the remaining nights. Keep it simple and realistic.",
        },
        {
          heading: "Minute 12-15: generate list and prep to shop",
          body: "Generate one shopping list from your planned meals, add household basics, and check your pantry before leaving.",
        },
      ]}
      ctaHref={ROUTES.HOW_TO_CREATE_A_WEEKLY_MEAL_PLAN_FAST}
      ctaLabel="See the full quick meal-planning page"
    />
  );
}
