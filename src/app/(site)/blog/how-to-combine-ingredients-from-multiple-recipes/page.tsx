import { ROUTES } from "@/app/constants";
import {
  buildStaticGuideMetadata,
  StaticSeoGuideLayout,
} from "@/app/(site)/blog/_components/static-seo-guide-layout";

const GUIDE_PATH = "/blog/how-to-combine-ingredients-from-multiple-recipes";

export const metadata = buildStaticGuideMetadata({
  title: "How to Combine Ingredients From Multiple Recipes",
  description:
    "Learn how to combine recipe ingredients into one grocery list when planning several meals for the week.",
  canonicalPath: GUIDE_PATH,
});

export default function HowToCombineIngredientsFromMultipleRecipesGuide() {
  return (
    <StaticSeoGuideLayout
      title="How to Combine Ingredients From Multiple Recipes"
      description="A straightforward way to combine ingredients from several meals into one weekly shop."
      sections={[
        {
          heading: "Set your meal count first",
          body: "Decide how many dinners you need this week. A clear meal count keeps planning simple and makes shopping easier to estimate.",
        },
        {
          heading: "Add all meals to one weekly plan",
          body: "Bring all selected recipes into one plan first, then generate your list from that plan. This gives you one place to manage everything.",
        },
        {
          heading: "Generate one shopping list",
          body: "Create a single list from all meals rather than separate mini lists. It is easier to follow in-store and less likely to miss ingredients.",
        },
        {
          heading: "Do a quick pantry edit",
          body: "Check what you already have, then edit lines before shopping. This keeps the final list practical and helps avoid overbuying.",
        },
        {
          heading: "Add non-recipe essentials",
          body: "Include household basics from your chalkboard so one shopping trip covers meals and everyday items together.",
        },
      ]}
      ctaHref={ROUTES.COMBINE_RECIPES_INTO_ONE_GROCERY_LIST}
      ctaLabel="See the full multi-recipe list guide"
    />
  );
}
