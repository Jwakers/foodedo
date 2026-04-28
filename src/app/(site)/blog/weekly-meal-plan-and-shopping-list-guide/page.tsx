import { ROUTES } from "@/app/constants";
import {
  buildStaticGuideMetadata,
  StaticSeoGuideLayout,
} from "@/app/(site)/blog/_components/static-seo-guide-layout";

const GUIDE_PATH = "/blog/weekly-meal-plan-and-shopping-list-guide";

export const metadata = buildStaticGuideMetadata({
  title: "Weekly Meal Plan and Shopping List Guide",
  description:
    "A repeatable weekly routine to plan meals and generate one grocery list for households and families.",
  canonicalPath: GUIDE_PATH,
});

export default function WeeklyMealPlanAndShoppingListGuide() {
  return (
    <StaticSeoGuideLayout
      title="Weekly Meal Plan + Shopping List Guide"
      description="A repeatable weekly routine for planning meals, shopping once, and staying on track."
      sections={[
        {
          heading: "Pick one planning window each week",
          body: "Use one short planning slot each week, such as Sunday evening. Keeping the same routine reduces decision fatigue during busy weekdays.",
        },
        {
          heading: "Build your week before you shop",
          body: "Choose your meals first, then place them across the week. Starting with a realistic plan makes your shopping list much more useful.",
        },
        {
          heading: "Generate one shopping list from the plan",
          body: "Once the week looks right, generate one list from all meals. This keeps shopping tied to what you are actually cooking.",
        },
        {
          heading: "Share plan and list if you live with others",
          body: "If multiple people cook or shop, keep one shared plan and one shared list so there is less confusion and fewer duplicate purchases.",
        },
        {
          heading: "Review and adjust next week",
          body: "At the end of the week, keep what worked and swap what did not. This makes the next plan quicker and more accurate.",
        },
      ]}
      ctaHref={ROUTES.MEAL_PLANNER_WITH_GROCERY_LIST}
      ctaLabel="See meal planner + grocery list page"
    />
  );
}
