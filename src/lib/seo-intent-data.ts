/**
 * Editorial + SEO data for public intent landing pages.
 * @see docs/GROWTH.md — intent map
 */

import { ROUTES } from "@/app/constants";

export type IntentFaqItem = { question: string; answer: string };
export type RelatedGuide = { href: string; label: string };

export type IntentPageDefinition = {
  /** URL path without domain, e.g. /family-meal-planning */
  path: string;
  metaTitle: string;
  metaDescription: string;
  keywords?: ReadonlyArray<string>;
  h1: string;
  intro: string;
  sections: ReadonlyArray<{ heading: string; body: string }>;
  faq: ReadonlyArray<IntentFaqItem>;
  relatedGuides?: ReadonlyArray<RelatedGuide>;
};

export const INTENT_FAMILY_MEAL_PLANNING: IntentPageDefinition = {
  path: ROUTES.FAMILY_MEAL_PLANNING,
  metaTitle: "Family Meal Planning App | Weekly Plans & Smart Shopping Lists",
  metaDescription:
    "Plan family meals for the week without the Sunday-night scramble. Build your plan, stay flexible, and turn it into one shopping list.",
  h1: "Family meal planning that fits real weeks",
  intro:
    "If family dinners feel rushed, use one weekly routine: pick meals, share the plan, and shop from one list. Foodedo keeps everyone on the same page.",
  sections: [
    {
      heading: "A simple weekly routine that works",
      body: "Start by choosing your meals for the week. You can generate a full week quickly, then swap meals you are not in the mood for. Once it looks right, use that plan to guide your shop.",
    },
    {
      heading: "How families use Foodedo day to day",
      body: "Save recipes you already cook, import new ones from links or photos, and add them to the week. If multiple people cook or shop, share the same plan and list so there is less back-and-forth.",
    },
    {
      heading: "What to do first if you are new",
      body: "Add 8 to 12 reliable dinners first, then build your first 5 to 7 day plan. After that, generate your shopping list and add household extras like milk or cleaning basics before you leave.",
    },
  ],
  faq: [
    {
      question: "What is the best app for family meal planning?",
      answer: "Look for an app that combines weekly meal planning, recipe storage, and shopping lists in one place. Foodedo is designed for families: plan the week, adjust quickly, and generate a list from your plan.",
    },
    {
      question: "How do I plan meals for a whole week?",
      answer: "Start with meals you know your household will eat. Add those first, then fill gaps with new ideas from Discover or imports. In Foodedo, you can generate a week quickly, then swap or lock meals before finalising.",
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
  relatedGuides: [
    {
      href: ROUTES.MEAL_PLANNER_WITH_GROCERY_LIST,
      label: "Meal planner with grocery list",
    },
    {
      href: ROUTES.HOW_TO_CREATE_A_WEEKLY_MEAL_PLAN_FAST,
      label: "How to create a weekly meal plan quickly",
    },
    {
      href: ROUTES.HOW_TO_PLAN_VARIED_MEALS_FOR_THE_WEEK,
      label: "How to keep meals varied each week",
    },
    {
      href: ROUTES.RECIPE_TO_SHOPPING_LIST,
      label: "Turn recipes into one shopping list",
    },
  ],
};

export const INTENT_RECIPE_TO_SHOPPING_LIST: IntentPageDefinition = {
  path: ROUTES.RECIPE_TO_SHOPPING_LIST,
  metaTitle: "Recipe to Shopping List | Turn Meal Plans Into One Grocery List",
  metaDescription:
    "Turn recipes into one shopping list in minutes. Foodedo helps you combine ingredients from multiple meals and generate one grocery list for the week.",
  keywords: [
    "recipe to grocery list",
    "recipe to shopping list",
    "shopping list from recipes",
    "grocery list from recipes",
    "recipe shopping list",
  ],
  h1: "Turn recipes into one grocery list",
  intro:
    "Stop retyping ingredients from recipe tabs and screenshots. Add recipes to your week, then generate one shopping list so your grocery run matches what you plan to cook.",
  sections: [
    {
      heading: "Step 1: Build your meal plan first",
      body: "Start by choosing what you will actually cook this week. You can use saved recipes, imported recipes, or Discover ideas. A realistic plan gives you a realistic shopping list.",
    },
    {
      heading: "Step 2: Generate one list from all meals",
      body: "Once your meals are in place, generate your shopping list from the plan. Foodedo combines ingredients from all selected meals, so you are not jumping between separate notes.",
    },
    {
      heading: "Step 3: Add household extras before you go",
      body: "Add staples from your household chalkboard, like milk or foil, to the same shop. This keeps meal ingredients and everyday items together in one checklist.",
    },
    {
      heading: "Before you shop checklist",
      body: "Do a quick pantry check, edit any quantities you already have, and then check items off as you go. This last two-minute review is what stops duplicates and missed basics.",
    },
  ],
  faq: [
    {
      question: "How do I make a shopping list from recipes?",
      answer: "Add recipes to your meal plan for the week, then generate a shopping list from that plan. Foodedo pulls ingredient lines together so you can shop once for everything you need.",
    },
    {
      question: "Can I combine multiple recipes into one grocery list?",
      answer: "Yes. Meal planning combines ingredients across the meals you select, so you get one simple list instead of separate lists for each recipe.",
    },
    {
      question: "How do I turn recipes into a grocery list quickly?",
      answer: "Select the recipes you want for the week, generate a shopping list, and then adjust any lines if you already have pantry items. This gives you a usable grocery list in minutes.",
    },
    {
      question: "How do I avoid duplicate ingredients on the list?",
      answer: "Generate your list from the meal plan, then do a quick pantry review before shopping. If you already have something, edit or remove it so the final list is practical.",
    },
    {
      question: "Does the list work offline?",
      answer: "Use Foodedo installed to your home screen for the best mobile experience. Full offline support is on the roadmap; online access is required for sync today.",
    },
  ],
  relatedGuides: [
    {
      href: ROUTES.HOW_TO_MAKE_A_SHOPPING_LIST_FROM_RECIPES,
      label: "How to make a shopping list from recipes",
    },
    {
      href: ROUTES.COMBINE_RECIPES_INTO_ONE_GROCERY_LIST,
      label: "Combine multiple recipes into one grocery list",
    },
    {
      href: ROUTES.MEAL_PLANNER_WITH_GROCERY_LIST,
      label: "Meal planner with grocery list for the week",
    },
    {
      href: ROUTES.HOW_TO_CREATE_A_WEEKLY_MEAL_PLAN_FAST,
      label: "How to create your weekly meal plan quickly",
    },
    {
      href: ROUTES.MEAL_PLAN_VS_SHOPPING_LIST_WHAT_YOU_NEED,
      label: "Meal plan vs shopping list: what each one does",
    },
  ],
};

export const INTENT_HOW_TO_MAKE_A_SHOPPING_LIST_FROM_RECIPES: IntentPageDefinition =
  {
    path: ROUTES.HOW_TO_MAKE_A_SHOPPING_LIST_FROM_RECIPES,
    metaTitle:
      "How to Make a Shopping List From Recipes | Step-by-Step Guide",
    metaDescription:
      "Learn how to make a shopping list from recipes with a simple repeatable routine: pick meals, combine ingredients, and shop once for the week.",
    keywords: [
      "how to make a shopping list from recipes",
      "how to make a grocery list from recipes",
      "recipe ingredients to shopping list",
      "shopping list recipe method",
    ],
    h1: "How to make a shopping list from recipes",
    intro:
      "If your current process is recipe tabs, screenshots, and handwritten notes, this gives you a faster way: plan first, then generate one list from the recipes you actually want to cook.",
    sections: [
      {
        heading: "Step 1: Add meals you will actually cook",
        body: "Choose 5 to 7 meals for the week from saved recipes, imported recipes, or Discover. Be realistic about busy evenings so your plan matches real life.",
      },
      {
        heading: "Step 2: Generate one shopping list",
        body: "Generate your list from the whole meal plan, not one recipe at a time. This gives you one place to shop from and helps avoid forgetting ingredients.",
      },
      {
        heading: "Step 3: Add household basics and check pantry",
        body: "Add your essentials and quickly check what you already have at home. Edit the list so you only buy what you need this week.",
      },
      {
        heading: "Step 4: Shop and tick items off as you go",
        body: "Use the list in-store and tick off items while shopping. If plans change later in the week, update the plan and regenerate if needed.",
      },
    ],
    faq: [
      {
        question: "What is the easiest way to make a grocery list from recipes?",
        answer: "Pick your meals first, then generate one list from those recipes. This avoids duplicate effort and keeps your list tied to what you actually plan to cook.",
      },
      {
        question: "Do I need to create separate lists for each recipe?",
        answer: "No. You can add multiple recipes to your plan and generate one combined shopping list for the week.",
      },
      {
        question: "Should I plan meals before writing a shopping list?",
        answer: "Yes. Meal planning first makes the shopping list more accurate and helps reduce impulse buys and missed ingredients.",
      },
      {
        question: "Can I still add non-recipe items to the list?",
        answer: "Yes. Add your household staples so your final list includes both recipe ingredients and everyday items.",
      },
    ],
    relatedGuides: [
      {
        href: ROUTES.RECIPE_TO_SHOPPING_LIST,
        label: "Turn recipes into one shopping list",
      },
      {
        href: ROUTES.COMBINE_RECIPES_INTO_ONE_GROCERY_LIST,
        label: "Combine multiple recipes into one grocery list",
      },
      {
        href: ROUTES.HOW_TO_CREATE_A_WEEKLY_MEAL_PLAN_FAST,
        label: "How to build a weekly meal plan quickly",
      },
      {
        href: ROUTES.MEAL_PLANNING_FOR_BUSY_WEEKNIGHTS,
        label: "Meal planning for busy weeknights",
      },
    ],
  };

export const INTENT_COMBINE_RECIPES_INTO_ONE_GROCERY_LIST: IntentPageDefinition =
  {
    path: ROUTES.COMBINE_RECIPES_INTO_ONE_GROCERY_LIST,
    metaTitle:
      "Combine Multiple Recipes Into One Grocery List | Weekly Shopping List",
    metaDescription:
      "Combine ingredients from multiple recipes into one grocery list and shop once for the week. A simple approach for meal planning and grocery prep.",
    keywords: [
      "combine multiple recipes into one grocery list",
      "merge ingredients from recipes",
      "one grocery list for multiple recipes",
      "combine recipe ingredients into one list",
    ],
    h1: "Combine multiple recipes into one grocery list",
    intro:
      "Planning several meals should not mean writing several lists. Build your week of recipes first, then roll the ingredients into one grocery list you can use in-store.",
    sections: [
      {
        heading: "Pick your week first",
        body: "Decide how many meals you are cooking and choose those recipes first. This keeps your list tied to what your week actually looks like.",
      },
      {
        heading: "Generate one list across all selected meals",
        body: "After your meals are chosen, generate one shopping list from the plan. You avoid switching between recipe tabs and reduce the chance of missing an item.",
      },
      {
        heading: "Do a quick pre-shop tidy",
        body: "Check pantry stock and edit quantities before heading out. This helps you avoid overbuying and keeps your list practical.",
      },
      {
        heading: "Add extras from chalkboard",
        body: "If you track staples on your chalkboard, pull those into the same shop so you finish the week without running out of basics.",
      },
    ],
    faq: [
      {
        question: "How do I combine ingredients from different recipes?",
        answer: "Put the recipes into one weekly meal plan, then generate a single shopping list from that plan so all ingredients are captured together.",
      },
      {
        question: "Can I make one grocery list for 5 to 7 meals?",
        answer: "Yes. Add as many meals as you need for the week, then generate one combined list before shopping.",
      },
      {
        question: "Will this help avoid missing ingredients?",
        answer: "It helps because all required ingredients are collected in one place instead of spread across several recipe tabs or notes.",
      },
      {
        question: "Is this useful for families and households?",
        answer: "Yes. Shared meal planning and shopping lists are especially useful when multiple people cook or shop during the week.",
      },
    ],
    relatedGuides: [
      {
        href: ROUTES.HOW_TO_MAKE_A_SHOPPING_LIST_FROM_RECIPES,
        label: "How to make a shopping list from recipes",
      },
      {
        href: ROUTES.MEAL_PLANNER_WITH_GROCERY_LIST,
        label: "Plan weekly meals and grocery list together",
      },
      {
        href: ROUTES.HOW_TO_PLAN_VARIED_MEALS_FOR_THE_WEEK,
        label: "How to keep meals varied through the week",
      },
      {
        href: ROUTES.MEAL_PLAN_VS_SHOPPING_LIST_WHAT_YOU_NEED,
        label: "Meal plan vs shopping list: when to use each",
      },
    ],
  };

export const INTENT_MEAL_PLANNER_WITH_GROCERY_LIST: IntentPageDefinition = {
  path: ROUTES.MEAL_PLANNER_WITH_GROCERY_LIST,
  metaTitle: "Meal Planner With Grocery List | Plan Week + Shop Once",
  metaDescription:
    "Use a meal planner with grocery list support: plan your week, generate one shopping list, and keep household meals and shopping aligned.",
  keywords: [
    "meal planner with grocery list",
    "weekly meal plan and shopping list",
    "family meal planner with shopping list",
    "weekly grocery list from meal plan",
  ],
  h1: "Meal planner with grocery list in one place",
  intro:
    "The fastest way to stay consistent is to connect planning and shopping. Build your weekly meal plan, then generate a grocery list from that plan so your shop supports your week.",
  sections: [
    {
      heading: "Set up your week in minutes",
      body: "Start with a quick plan: pick your meals, place them across the week, and adjust any nights that look unrealistic. You can generate and tweak faster than starting from scratch each day.",
    },
    {
      heading: "Turn your plan into one list",
      body: "When the week looks right, generate one shopping list directly from the plan. This keeps shopping focused on what you will actually cook.",
    },
    {
      heading: "Keep everyone aligned at home",
      body: "If multiple people cook or shop, share the same plan and list. Everyone can see what is planned and what still needs buying.",
    },
    {
      heading: "Repeat the same rhythm each week",
      body: "Use the same simple loop: choose meals, generate list, shop once, then review what worked. It gets quicker every week.",
    },
  ],
  faq: [
    {
      question: "What is a meal planner with grocery list?",
      answer: "It is a setup where your shopping list is generated from your planned meals, so planning and shopping stay connected.",
    },
    {
      question: "Can I use this for weekly family meal planning?",
      answer: "Yes. Weekly planning plus one grocery list is useful for families because everyone can follow one shared plan.",
    },
    {
      question: "Does this reduce food waste?",
      answer: "It can help by encouraging planned purchases tied to meals you intend to cook rather than ad hoc shopping.",
    },
    {
      question: "Can I include my own saved recipes?",
      answer: "Yes. You can combine your own saved recipes with discovered meal ideas, then generate your weekly grocery list from that mix.",
    },
  ],
  relatedGuides: [
    {
      href: ROUTES.FAMILY_MEAL_PLANNING,
      label: "Family meal planning for real weeks",
    },
    {
      href: ROUTES.RECIPE_TO_SHOPPING_LIST,
      label: "Convert recipes to one shopping list",
    },
    {
      href: ROUTES.HOW_TO_CREATE_A_WEEKLY_MEAL_PLAN_FAST,
      label: "How to create a weekly meal plan quickly",
    },
    {
      href: ROUTES.MEAL_PLANNING_FOR_BUSY_WEEKNIGHTS,
      label: "Meal planning for busy weeknights",
    },
    {
      href: ROUTES.HOW_TO_PLAN_VARIED_MEALS_FOR_THE_WEEK,
      label: "How to keep meals varied week to week",
    },
  ],
};

export const INTENT_HOW_TO_CREATE_A_WEEKLY_MEAL_PLAN_FAST: IntentPageDefinition =
  {
    path: ROUTES.HOW_TO_CREATE_A_WEEKLY_MEAL_PLAN_FAST,
    metaTitle: "How to Create a Weekly Meal Plan Fast | 15-Minute Method",
    metaDescription:
      "Create a weekly meal plan quickly with a practical 15-minute method: choose meals, place them across the week, and generate your shopping list.",
    keywords: [
      "how to create a weekly meal plan fast",
      "quick meal planning",
      "how to meal plan quickly",
      "weekly meal plan in 15 minutes",
    ],
    h1: "How to create a weekly meal plan fast",
    intro:
      "If meal planning keeps getting pushed to Sunday night, use this quick method. You can build a practical weekly plan in around 15 minutes and shop from one list.",
    sections: [
      {
        heading: "Step 1: Pick your meal count",
        body: "Decide how many dinners you need this week first. Most households start with 5 to 7 meals depending on takeaways, leftovers, and social plans.",
      },
      {
        heading: "Step 2: Add reliable favourites first",
        body: "Place 2 to 3 easy favourites into your week before adding anything new. This gives your plan a stable base and reduces decision fatigue.",
      },
      {
        heading: "Step 3: Fill gaps with saved or discovered recipes",
        body: "Use your saved recipes, imports, or Discover ideas to fill remaining days. In Foodedo, you can generate options quickly and swap anything that does not fit.",
      },
      {
        heading: "Step 4: Generate list and go",
        body: "Once the week is set, generate your shopping list from the plan. Add extras from your chalkboard and do a quick pantry check before shopping.",
      },
    ],
    faq: [
      {
        question: "How long should weekly meal planning take?",
        answer: "If you keep a base set of reliable meals, planning can take around 10 to 20 minutes. The key is reusing your saved meals and only adding a few new ideas each week.",
      },
      {
        question: "What if I do not have enough recipes saved yet?",
        answer: "Start with what you already cook, then add one or two recipes each week from imports or Discover. You do not need a huge library to get started.",
      },
      {
        question: "Can I change the plan after creating it?",
        answer: "Yes. You can adjust meals as your week changes, then regenerate your shopping list if needed.",
      },
      {
        question: "Should I plan before writing my shopping list?",
        answer: "Yes. Planning first gives you a list based on what you will actually cook, which makes shopping faster and more focused.",
      },
    ],
    relatedGuides: [
      {
        href: ROUTES.MEAL_PLANNER_WITH_GROCERY_LIST,
        label: "Meal planner with grocery list",
      },
      {
        href: ROUTES.MEAL_PLANNING_FOR_BUSY_WEEKNIGHTS,
        label: "Meal planning for busy weeknights",
      },
      {
        href: ROUTES.HOW_TO_PLAN_VARIED_MEALS_FOR_THE_WEEK,
        label: "How to keep meals varied each week",
      },
      {
        href: ROUTES.RECIPE_TO_SHOPPING_LIST,
        label: "Turn planned recipes into one shopping list",
      },
    ],
  };

export const INTENT_HOW_TO_PLAN_VARIED_MEALS_FOR_THE_WEEK: IntentPageDefinition =
  {
    path: ROUTES.HOW_TO_PLAN_VARIED_MEALS_FOR_THE_WEEK,
    metaTitle: "How to Plan Varied Meals for the Week | Avoid Repeats",
    metaDescription:
      "Plan varied meals for the week without overthinking it. Use a simple structure so dinner stays interesting and practical.",
    keywords: [
      "how to plan varied meals for the week",
      "avoid repeating meals every week",
      "meal variety planning",
      "balanced weekly meal plan",
    ],
    h1: "How to plan varied meals for the week",
    intro:
      "If your week feels repetitive, use a simple variety pattern. You do not need seven brand-new meals, just a better mix across the week.",
    sections: [
      {
        heading: "Use a simple variety pattern",
        body: "Start with a light structure: for example one fast meal, one comfort meal, one high-veg meal, one leftovers-friendly meal, and one flexible slot.",
      },
      {
        heading: "Mix known wins with one new idea",
        body: "Keep most meals familiar and add only one new recipe each week. This keeps variety growing without making planning stressful.",
      },
      {
        heading: "Avoid repeating the same ingredients every night",
        body: "Check your plan quickly for repeats in proteins, carbs, or prep style. Small swaps make the week feel fresher without extra effort.",
      },
      {
        heading: "Review and adjust after shopping",
        body: "After you build your shopping list, spot any overlap you do not want and swap a meal before finalising the week.",
      },
    ],
    faq: [
      {
        question: "How do I stop cooking the same meals every week?",
        answer: "Use a weekly pattern and rotate categories, not just recipe names. Keep favourites, but deliberately swap one or two meal types each week.",
      },
      {
        question: "Do varied meals mean more expensive shopping?",
        answer: "Not always. Variety can come from changing seasoning, sides, and prep style while reusing many base ingredients.",
      },
      {
        question: "How many new meals should I add each week?",
        answer: "For most people, one new meal per week is enough. It keeps your plan fresh without creating extra pressure.",
      },
      {
        question: "Can this still work for busy households?",
        answer: "Yes. Keep the week anchored by quick reliable meals, then add variety around them.",
      },
    ],
    relatedGuides: [
      {
        href: ROUTES.HOW_TO_CREATE_A_WEEKLY_MEAL_PLAN_FAST,
        label: "Create your weekly plan quickly",
      },
      {
        href: ROUTES.MEAL_PLANNING_FOR_BUSY_WEEKNIGHTS,
        label: "Meal planning for busy weeknights",
      },
      {
        href: ROUTES.FAMILY_MEAL_PLANNING,
        label: "Family meal planning that fits real weeks",
      },
      {
        href: ROUTES.MEAL_PLAN_VS_SHOPPING_LIST_WHAT_YOU_NEED,
        label: "Meal plan vs shopping list: what you need first",
      },
    ],
  };

export const INTENT_MEAL_PLANNING_FOR_BUSY_WEEKNIGHTS: IntentPageDefinition = {
  path: ROUTES.MEAL_PLANNING_FOR_BUSY_WEEKNIGHTS,
  metaTitle: "Meal Planning for Busy Weeknights | Keep Dinner Simple",
  metaDescription:
    "Plan weeknight meals when time is tight. Use a practical structure to keep dinner simple and your shopping list accurate.",
  keywords: [
    "meal planning for busy weeknights",
    "quick weeknight meal planning",
    "meal plan for busy families",
    "easy weekly dinner planning",
  ],
  h1: "Meal planning for busy weeknights",
  intro:
    "When evenings are rushed, your meal plan should be realistic, not perfect. This approach keeps dinner simple and avoids last-minute takeaways.",
  sections: [
    {
      heading: "Start with your busiest nights",
      body: "Mark the nights with the least time first. Put your quickest, most reliable meals on those days before planning anything else.",
    },
    {
      heading: "Use prep-friendly meals where possible",
      body: "Add at least one meal that can be prepped ahead or repurposed as leftovers. This gives you breathing room later in the week.",
    },
    {
      heading: "Keep your shopping list tied to the plan",
      body: "Generate your list from your planned week so shopping matches your actual schedule and energy levels.",
    },
    {
      heading: "Use household sharing to reduce friction",
      body: "If someone else cooks or shops, keep the plan and list shared so everyone sees the same week.",
    },
  ],
  faq: [
    {
      question: "What is the best way to meal plan when short on time?",
      answer: "Plan around your busiest nights first, use quick meals on those days, and generate one shopping list from the plan so execution is easier.",
    },
    {
      question: "How many meals should I plan for busy weeks?",
      answer: "Most people plan 4 to 6 core dinners, leaving one flexible or leftovers night.",
    },
    {
      question: "Can I still keep variety on busy weeks?",
      answer: "Yes. Keep a quick base, then vary one or two meals with different flavours or sides.",
    },
    {
      question: "What if plans change mid-week?",
      answer: "Swap meals in your plan and update your list. Keeping both in one place makes changes easier.",
    },
  ],
  relatedGuides: [
    {
      href: ROUTES.HOW_TO_CREATE_A_WEEKLY_MEAL_PLAN_FAST,
      label: "Build your weekly meal plan in 15 minutes",
    },
    {
      href: ROUTES.HOW_TO_PLAN_VARIED_MEALS_FOR_THE_WEEK,
      label: "Keep meals varied through the week",
    },
    {
      href: ROUTES.MEAL_PLANNER_WITH_GROCERY_LIST,
      label: "Meal planner and shopping list together",
    },
    {
      href: ROUTES.HOUSEHOLD_MEAL_PLANNING,
      label: "Share meal planning with your household",
    },
  ],
};

export const INTENT_MEAL_PLAN_VS_SHOPPING_LIST_WHAT_YOU_NEED: IntentPageDefinition =
  {
    path: ROUTES.MEAL_PLAN_VS_SHOPPING_LIST_WHAT_YOU_NEED,
    metaTitle: "Meal Plan vs Shopping List | What You Need First",
    metaDescription:
      "Not sure whether to start with a meal plan or shopping list? Learn the difference and how to use both together for easier weeks.",
    keywords: [
      "meal plan vs shopping list",
      "do i need a meal plan before shopping list",
      "meal planning and grocery list difference",
      "weekly meal planning shopping list",
    ],
    h1: "Meal plan vs shopping list: what you need first",
    intro:
      "Many people treat these as the same thing. They are connected, but each one solves a different problem. Use both in the right order to make the week easier.",
    sections: [
      {
        heading: "What a meal plan does",
        body: "A meal plan answers one question: what are we cooking this week? It helps you decide before the week gets busy.",
      },
      {
        heading: "What a shopping list does",
        body: "A shopping list answers a different question: what do we need to buy? It turns your plan into practical action at the store.",
      },
      {
        heading: "Best order to use them",
        body: "Plan meals first, then generate your shopping list from that plan. This reduces random purchases and helps you avoid missing key ingredients.",
      },
      {
        heading: "Where people get stuck",
        body: "If you shop before planning, you usually overbuy or miss items. If you plan but never convert it to one list, shopping stays messy.",
      },
    ],
    faq: [
      {
        question: "Should I meal plan before writing a grocery list?",
        answer: "Yes. Meal planning first gives your list a clear purpose and makes shopping more accurate.",
      },
      {
        question: "Can I use only a shopping list and skip planning?",
        answer: "You can, but most people end up with less consistent dinners. Planning first helps your list match your week.",
      },
      {
        question: "Do families need both meal plans and shopping lists?",
        answer: "Usually yes. A shared plan keeps everyone aligned, and a shared list makes shopping easier for whoever is at the store.",
      },
      {
        question: "How does Foodedo connect both?",
        answer: "You plan meals first, then generate one shopping list from those meals. That keeps planning and shopping in one place.",
      },
    ],
    relatedGuides: [
      {
        href: ROUTES.MEAL_PLANNER_WITH_GROCERY_LIST,
        label: "Meal planner with grocery list in one place",
      },
      {
        href: ROUTES.RECIPE_TO_SHOPPING_LIST,
        label: "Turn recipes into one shopping list",
      },
      {
        href: ROUTES.HOW_TO_CREATE_A_WEEKLY_MEAL_PLAN_FAST,
        label: "Create your weekly meal plan quickly",
      },
      {
        href: ROUTES.HOW_TO_MAKE_A_SHOPPING_LIST_FROM_RECIPES,
        label: "How to make a shopping list from recipes",
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
      answer: "Foodedo keeps recipes, meal planning, and shopping lists in one place. Notes apps do not automatically build one shopping list from your recipes.",
    },
  ],
  relatedGuides: [
    {
      href: ROUTES.MEAL_PLANNER_WITH_GROCERY_LIST,
      label: "Weekly meal planner with grocery list",
    },
    {
      href: ROUTES.RECIPE_TO_SHOPPING_LIST,
      label: "Build one list from planned recipes",
    },
    {
      href: ROUTES.MEAL_PLANNING_FOR_BUSY_WEEKNIGHTS,
      label: "Meal planning for busy weeknights",
    },
    {
      href: ROUTES.HOW_TO_PLAN_VARIED_MEALS_FOR_THE_WEEK,
      label: "How to keep meals varied each week",
    },
  ],
};
