import { ROUTES } from "@/app/constants";
import {
  buildStaticGuideMetadata,
  StaticSeoGuideLayout,
} from "@/app/(site)/blog/_components/static-seo-guide-layout";

const GUIDE_PATH = "/blog/how-to-turn-recipes-into-one-grocery-list";

export const metadata = buildStaticGuideMetadata({
  title: "How to Turn Recipes Into One Grocery List",
  description:
    "A practical way to turn multiple recipes into a single weekly grocery list without missed ingredients.",
  canonicalPath: GUIDE_PATH,
});

export default function HowToTurnRecipesIntoOneGroceryListGuide() {
  return (
    <StaticSeoGuideLayout
      title="How to Turn Recipes Into One Grocery List"
      description="Use this practical method to go from saved recipes to one clear shopping list for the week."
      sections={[
        {
          heading: "Pick this week's meals first",
          body: "Before writing any list, choose the meals you are genuinely likely to cook this week. This keeps your shop focused on real dinners, not good intentions.",
        },
        {
          heading: "Create one list from all meals",
          body: "Once the plan is set, generate one shopping list from all selected meals. You avoid switching between recipe tabs and reduce the chance of missing items.",
        },
        {
          heading: "Add household staples and pantry checks",
          body: "Add basics like milk, foil, or cleaning supplies before heading out. Then quickly check your pantry and adjust quantities so you only buy what you need.",
        },
        {
          heading: "Use the list while you shop",
          body: "Tick items off as you go in-store. If meals change later in the week, adjust your plan and regenerate your list so everything stays aligned.",
        },
        {
          heading: "Quick reset for next week",
          body: "After cooking, keep the meals that worked and replace the ones that did not. This makes next week faster without starting from zero.",
        },
      ]}
      ctaHref={ROUTES.HOW_TO_MAKE_A_SHOPPING_LIST_FROM_RECIPES}
      ctaLabel="See the full step-by-step method"
    />
  );
}
