import { ROUTES } from "@/app/constants";
import {
  buildStaticGuideMetadata,
  StaticSeoGuideLayout,
} from "@/app/(site)/blog/_components/static-seo-guide-layout";

const GUIDE_PATH = "/blog/how-to-keep-meals-varied-without-overthinking-it";

export const metadata = buildStaticGuideMetadata({
  title: "How to Keep Meals Varied Without Overthinking It",
  description:
    "Use a simple pattern to keep weekly meals varied without adding planning stress.",
  canonicalPath: GUIDE_PATH,
});

export default function HowToKeepMealsVariedWithoutOverthinkingGuide() {
  return (
    <StaticSeoGuideLayout
      title="How to Keep Meals Varied Without Overthinking It"
      description="A realistic way to avoid repeats while keeping planning manageable."
      sections={[
        {
          heading: "Use a weekly mix, not seven brand-new meals",
          body: "Aim for a simple mix each week: one quick meal, one comfort meal, one high-veg meal, and one flexible leftovers night.",
        },
        {
          heading: "Keep favourites, rotate one slot",
          body: "Do not replace everything at once. Keep your reliable favourites and rotate just one meal each week to build variety over time.",
        },
        {
          heading: "Vary ingredients and prep style",
          body: "If meals feel repetitive, change one element like protein, side, or seasoning. Small swaps make a big difference.",
        },
        {
          heading: "Review before you generate your shopping list",
          body: "Check your week for repeats before finalising. Then generate your list from the final plan so the shop reflects that variety.",
        },
      ]}
      ctaHref={ROUTES.HOW_TO_PLAN_VARIED_MEALS_FOR_THE_WEEK}
      ctaLabel="See the full meal-variety page"
    />
  );
}
