import { APP_NAME } from "@/app/constants";

/**
 * Public, indexable summary of “how to use” (full interactive guide remains in-app).
 */

/** Short Q&A for AEO / FAQ JSON-LD on the public how-to page. */
export const PUBLIC_HOW_TO_FAQ = [
  {
    question: `How do I start using ${APP_NAME}?`,
    answer: `Create an account, add or import a recipe you cook often, then open the meal plan and assign it to a day. From there you can generate a shopping list from your plan.`,
  },
  {
    question: `How does household meal planning work in ${APP_NAME}?`,
    answer: `Create a household and invite members. Shared meal plans and lists keep everyone aligned on what is planned and what to buy.`,
  },
  {
    question: `Can I generate a shopping list from my meal plan?`,
    answer: `Yes. Build your weekly plan first, then generate a shopping list so ingredients match the meals you selected.`,
  },
  {
    question: `Where is the full step-by-step guide?`,
    answer: `The detailed in-app guide lives under Help after you sign in. This page is a public overview you can read without an account.`,
  },
] as const;

export const PUBLIC_HOW_TO_SECTIONS = [
  {
    id: "start",
    title: "Get started",
    content: `Create a free ${APP_NAME} account, then add a recipe you already cook often, either by creating it manually or importing from a link. That gives you something real to put on your first meal plan.`,
  },
  {
    id: "household",
    title: "Households",
    content: `Invite people you share meals with so everyone sees the same plan and lists. Households keep collaboration in one place instead of scattered messages.`,
  },
  {
    id: "meal-plan",
    title: "Weekly meal plan",
    content: `Use the meal plan to assign recipes to days. You can generate a balanced week in one go, then lock, swap, or regenerate meals until it fits your week.`,
  },
  {
    id: "shopping",
    title: "Shopping list",
    content: `Generate a shopping list from your meal plan so ingredients match what you intend to cook. You can also build lists from other flows when you need ad-hoc shops.`,
  },
  {
    id: "discover",
    title: "Discover & import",
    content: `Browse curated recipes in Discover, or import from URLs and photos when you find something new. Everything saves into your library for planning later.`,
  },
] as const;
