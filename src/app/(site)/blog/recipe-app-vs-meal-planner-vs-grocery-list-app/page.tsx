import { ROUTES } from "@/app/constants";
import {
  buildStaticGuideMetadata,
  StaticSeoGuideLayout,
} from "@/app/(site)/blog/_components/static-seo-guide-layout";

const GUIDE_PATH = "/blog/recipe-app-vs-meal-planner-vs-grocery-list-app";

export const metadata = buildStaticGuideMetadata({
  title: "Recipe App vs Meal Planner vs Grocery List App",
  description:
    "What each tool does, where each one helps, and why connected meal planning plus grocery list tools are easier to maintain.",
  canonicalPath: GUIDE_PATH,
});

export default function RecipeAppVsMealPlannerVsGroceryListAppGuide() {
  return (
    <StaticSeoGuideLayout
      title="Recipe App vs Meal Planner vs Grocery List App"
      description="Most people need all three. The easiest setup is keeping recipes, planning, and shopping connected in one place."
      sections={[
        {
          heading: "Recipe apps store ideas and instructions",
          body: "Recipe tools are great for saving meals and instructions. They help with ideas, but not always with choosing what to cook across a full week.",
        },
        {
          heading: "Meal planners decide what gets cooked this week",
          body: "Meal planning turns recipe ideas into a practical week. This is where you choose what happens on each day, especially on busy evenings.",
        },
        {
          heading: "Grocery list tools execute the plan",
          body: "A grocery list helps you buy what you need. It works best when it comes directly from your meal plan instead of a manual note.",
        },
        {
          heading: "The easiest setup for most households",
          body: "Use one place that handles recipes, meal planning, and shopping together. That way, every part of the week supports the next step.",
        },
        {
          heading: "What to do first if you are starting today",
          body: "Start by building a simple 5 to 7 meal plan, then generate your shopping list from it. You can improve variety and speed in later weeks.",
        },
      ]}
      ctaHref={ROUTES.RECIPE_TO_SHOPPING_LIST}
      ctaLabel="Start with recipe-to-shopping-list"
    />
  );
}
