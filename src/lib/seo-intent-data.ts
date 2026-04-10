/**
 * Editorial + SEO data for public intent landing pages.
 * @see docs/GROWTH.md — intent map
 */

import { ROUTES } from "@/app/constants";

export type IntentFaqItem = { question: string; answer: string };

export type IntentPageDefinition = {
  /** URL path without domain, e.g. /family-meal-planning */
  path: string;
  metaTitle: string;
  metaDescription: string;
  keywords?: string[];
  h1: string;
  intro: string;
  sections: ReadonlyArray<{ heading: string; body: string }>;
  faq: ReadonlyArray<IntentFaqItem>;
};

export const INTENT_FAMILY_MEAL_PLANNING: IntentPageDefinition = {
  path: ROUTES.FAMILY_MEAL_PLANNING,
  metaTitle: "Family Meal Planning App | Weekly Plans & Smart Shopping Lists",
  metaDescription:
    "Weekly meal plans in one click for your household. Foodedo helps families build a balanced week of dinners, swap meals, and generate one shopping list, without the Sunday-night scramble.",
  h1: "Family meal planning that fits real weeks",
  intro:
    "Weekly meal plans in one click, then a rhythm you can repeat: pick meals for the week, stay flexible, and turn the plan into one organised shopping list.",
  sections: [
    {
      heading: "Why weekly planning matters",
      body: "When the week is visible ahead of time, you shop once, cook with less stress, and waste less food. Foodedo focuses on speed: generate a full week in one click, then tweak instead of starting from a blank page.",
    },
    {
      heading: "How Foodedo supports families",
      body: "Save and import recipes, add them to your meal plan, and generate a shopping list from what you actually plan to cook. Households can collaborate so everyone sees the same plan.",
    },
  ],
  faq: [
    {
      question: "What is the best app for family meal planning?",
      answer: "Look for an app that combines weekly meal planning, recipe storage, and shopping lists in one place. Foodedo is designed for families: plan the week, adjust quickly, and generate a list from your plan.",
    },
    {
      question: "How do I plan meals for a whole week?",
      answer: "Start with recipes you already enjoy, assign them to days, then fill gaps with new ideas from Discover or imports. Foodedo can generate a balanced week in one click, then you can lock, swap, or regenerate meals.",
    },
    {
      question: "Can meal planning save money?",
      answer: "Yes. Planning reduces impulse buys and duplicate ingredients because your shopping list matches your meals. Foodedo ties the plan directly to the list so you buy what you need for what you will cook.",
    },
    {
      question: "Does Foodedo work on mobile?",
      answer: "Yes. You can use Foodedo in the browser and install it to your home screen for an app-like experience on phones and tablets.",
    },
  ],
};

export const INTENT_RECIPE_TO_SHOPPING_LIST: IntentPageDefinition = {
  path: ROUTES.RECIPE_TO_SHOPPING_LIST,
  metaTitle: "Recipe to Shopping List | Turn Meal Plans Into One Grocery List",
  metaDescription:
    "Weekly meal plans in one click, then one smart list: Foodedo combines planned meals into a single shopping list so you buy what you need for what you will actually cook.",
  h1: "From recipes to a single shopping list",
  intro:
    "Weekly meal plans in one click, then stop re-typing ingredients from screenshots. Plan what you will cook and let Foodedo roll ingredients into one list you can check off at the store.",
  sections: [
    {
      heading: "Ingredients that match your plan",
      body: "Your list reflects meals on your plan (not random one-off recipes), so quantities line up with what you intend to cook this week.",
    },
    {
      heading: "Chalkboard and household flows",
      body: "Add staples from your kitchen chalkboard to the same workflow so the shop covers both planned meals and everyday items your household needs.",
    },
  ],
  faq: [
    {
      question: "How do I make a shopping list from recipes?",
      answer: "Add recipes to your meal plan for the week, then generate a shopping list from that plan. Foodedo pulls ingredient lines together so you can shop once for everything you need.",
    },
    {
      question: "Can I combine multiple recipes into one grocery list?",
      answer: "Yes. Meal planning is designed to aggregate ingredients across the meals you select, so you get one consolidated list instead of separate lists per recipe.",
    },
    {
      question: "How do I avoid duplicate ingredients on the list?",
      answer: "Foodedo merges ingredients from your planned meals. You can still edit quantities before you shop if your pantry already has an item.",
    },
    {
      question: "Does the list work offline?",
      answer: "Use Foodedo installed to your home screen for the best mobile experience. Full offline support is on the roadmap; online access is required for sync today.",
    },
  ],
};

export const INTENT_HOUSEHOLD_MEAL_PLANNING: IntentPageDefinition = {
  path: ROUTES.HOUSEHOLD_MEAL_PLANNING,
  metaTitle: "Household Meal Planning | Share Plans, Lists & Recipes",
  metaDescription:
    "Weekly meal plans in one click, shared with your household: one plan, shared recipes, and shopping lists so everyone stays aligned on dinner.",
  h1: "Meal planning for households, not just individuals",
  intro:
    "Household-first weekly plans in one click: invite people you cook with, share recipes, and align on the week so “what is for dinner?” has one answer everyone can see.",
  sections: [
    {
      heading: "Shared visibility",
      body: "When the plan lives in one place, you spend less time coordinating in group chats. Your household sees the same meals and lists.",
    },
    {
      heading: "Recipes and lists together",
      body: "Share recipes you love and build shopping lists from the same plan. That keeps cooking and shopping aligned for whoever is at the store.",
    },
  ],
  faq: [
    {
      question: "How do households share meal plans?",
      answer: "Create a household in Foodedo and invite members. Shared meal plans and lists keep everyone on the same page so plans and shopping stay consistent.",
    },
    {
      question: "Can more than one person edit the meal plan?",
      answer: "Household members collaborate on household-scoped content so you can divide planning and shopping without losing track of what is planned.",
    },
    {
      question: "Is Foodedo good for roommates or co-parents?",
      answer: "Yes. If you share meals or a kitchen, a shared household reduces confusion and duplicate shopping. You can still keep personal recipes where you prefer.",
    },
    {
      question: "How is this different from a shared notes app?",
      answer: "Foodedo connects recipes, meal planning, and shopping lists in one workflow. Notes apps do not generate aggregated shopping lists from structured recipe data.",
    },
  ],
};
