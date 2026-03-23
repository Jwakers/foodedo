import { APP_NAME } from "@/app/constants";

export type FaqQuestion = Readonly<{
  readonly question: string;
  readonly answer: string;
}>;

export type FaqSectionData = Readonly<{
  readonly title: string;
  readonly questions: ReadonlyArray<FaqQuestion>;
}>;

/** Single source of truth for FAQ copy (public `/faq` + in-app support FAQ). */
export const FAQ_SECTIONS_DATA: ReadonlyArray<FaqSectionData> = [
  {
    title: "Getting Started",
    questions: [
      {
        question: "How do I create my first recipe?",
        answer:
          "Click the '+' icon from the bottom menu or from the 'My Recipes' page. Fill in the recipe details including ingredients, instructions, and cooking time. You can also add photos and nutritional information.",
      },
      {
        question: "What information do I need to include in a recipe?",
        answer:
          "At minimum, you'll need a recipe name, ingredients list, and cooking instructions. You can also add prep time, cook time, serving size, difficulty level, category, photos, and nutritional information.",
      },
      {
        question: "Can I organise my recipes?",
        answer:
          "Yes! You can categorise recipes (main, dessert, snack, etc.), add tags, and use the search function to quickly find specific recipes.",
      },
    ],
  },
  {
    title: "Recipe Features",
    questions: [
      {
        question: "How do I import recipes from websites?",
        answer:
          "Use the 'Import Recipe' feature from the main menu. Paste the URL of any recipe from most cooking websites, and our system will automatically extract the recipe information for you to review and save.",
      },
      {
        question: "Can I edit imported recipes?",
        answer:
          "Absolutely! After importing a recipe, you can edit any part of it - ingredients, instructions, photos, or add your own notes and modifications.",
      },
      {
        question: "How do I add photos to my recipes?",
        answer:
          "When creating or editing a recipe, you can upload photos by clicking the edit recipe button and then the change image button. You can add multiple photos to show different steps or the final result.",
      },
    ],
  },
  {
    title: "Meal planning",
    questions: [
      {
        question: "How do I generate a weekly meal plan?",
        answer:
          "Go to 'Meal plan' in the bottom navigation or dashboard. Tap 'Generate My Week' to create a full week of meals in one go. The app picks recipes from your collection (and your household's) and fills each day. You can then lock meals you want to keep, swap or remove others, and tap 'Regenerate' to get a new mix while keeping locked meals.",
      },
      {
        question: "What is meal planning?",
        answer:
          "Meal planning lets you plan meals for a week (or any date range) and save them as your plan. You can generate a full week in one tap, or create a plan manually and add meals by day. Generate a shopping list from the plan, and optionally share the plan with your household so others can view it and generate their own list.",
      },
      {
        question: "How do I create a meal plan manually?",
        answer:
          "Go to 'Meal plan' and tap 'Create this week's plan' if you don't have one. Set the end date (default is one week from today) and create. Then add meals by day: tap 'Add meal' for a day, choose a recipe, and optionally add a meal label (Breakfast, Lunch, Dinner).",
      },
      {
        question: "How do I lock or swap a meal?",
        answer:
          "On each meal card, use the lock icon to lock meals you want to keep—they won't change when you tap 'Regenerate'. Use the menu on the card (three dots) to 'Pick recipe' or 'Swap' and choose a different recipe from your collection. You can also remove a meal entirely from the menu.",
      },
      {
        question: "What does 'Regenerate' do?",
        answer:
          "'Regenerate' creates a new suggested week while keeping any meals you've locked. Use it when you want a different mix of recipes but don't want to change certain days. Lock the meals you want to keep, then tap 'Regenerate'.",
      },
      {
        question: "What does 'Finalise' mean on a meal plan?",
        answer:
          "Finalising saves your plan so you can't add, remove, or swap meals anymore—you can still move meals between days. Use it when you're happy with the week and want to avoid accidental changes. You can generate a shopping list before or after finalising.",
      },
      {
        question: "How do I generate a shopping list from my meal plan?",
        answer:
          "On your meal plan page, tap 'Generate shopping list'. Ingredients from all planned recipes are combined into one list. You can optionally include chalkboard items. You'll be taken to the shopping list to check off items as you shop.",
      },
      {
        question: "Can I plan the next week early?",
        answer:
          "Yes. When you have a current plan, a 'Generate next week' button appears so you can create the following week's plan in advance. Your current plan stays in place until you're ready to focus on the next one.",
      },
      {
        question: "Can I share my meal plan with my household?",
        answer:
          "Yes. As the plan owner, tap 'Share with household' on the meal plan page and select a household. Members can view the plan and generate their own shopping list from it. Tap 'Stop sharing' to remove the link.",
      },
    ],
  },
  {
    title: "Shopping lists",
    questions: [
      {
        question: "How do I create a shopping list from recipes?",
        answer:
          "You can create a shopping list in two ways: (1) From your meal plan — tap 'Generate shopping list' on the meal plan page to create a list from your planned meals. (2) Ad-hoc — go to 'Shopping list' from the dashboard or support links. Select recipes manually and create a list. Both lists work the same: you can finalise, check off items, and share or print.",
      },
      {
        question: "How do I share my shopping list with others?",
        answer:
          "Once you have finalised a shopping list there are sharing options such as message, print or save to notes. You can use the app to see your list and check off items as you shop.",
      },
    ],
  },
  {
    title: "Households & Sharing",
    questions: [
      {
        question: "What is a household?",
        answer:
          "A household is a shared space where family members or room-mates can collaborate on meal planning, share recipes, and coordinate shopping lists.",
      },
      {
        question: "How do I create or join a household?",
        answer:
          "Go to 'Households' in the main menu. You can either create a new household or join an existing one using an invitation code shared by another member.",
      },
      {
        question: "Can I be part of multiple households?",
        answer:
          "You can be part of multiple households. This is useful if you live with multiple people or have family members that you want to share recipes and shopping lists with.",
      },
      {
        question: "How do I invite others to my household?",
        answer:
          "In your household page, you can generate an invitation code to share with family or friends. They can use this code to join your household.",
      },
    ],
  },
  {
    title: "Kitchen Chalkboard",
    questions: [
      {
        question: "What is the Kitchen Chalkboard?",
        answer:
          "The Kitchen Chalkboard is a quick note-taking feature perfect for jotting down cooking reminders, ingredient substitutions, or any kitchen-related notes. It's like having a digital sticky note in your kitchen.",
      },
      {
        question: "How do I use the Kitchen Chalkboard?",
        answer:
          "Simply go to 'Kitchen Chalkboard' from the main menu and start typing your notes. Your notes are automatically saved and will be visible to other household members if you're part of a household.",
      },
    ],
  },
  {
    title: "Account & Privacy",
    questions: [
      {
        question: "How do I update my profile information?",
        answer:
          "Click on your profile picture in the navigation menu to access your account settings. From there, you can update your name, email, and other profile information.",
      },
      {
        question: "Is my data secure?",
        answer:
          "Yes, we take data security seriously. All your data is encrypted and stored securely. We never share your personal information or recipes with third parties.",
      },
      {
        question: "What happens if I delete my account?",
        answer:
          "If you delete your account, all your personal data, recipes, and household information will be permanently removed. This action cannot be undone.",
      },
    ],
  },
  {
    title: "Troubleshooting",
    questions: [
      {
        question: "The app is running slowly. What should I do?",
        answer:
          "Try closing the app and opening it again or clear your browser cache. If the problem persists, make sure you're using a supported browser and have a stable internet connection.",
      },
      {
        question: "I can't import a recipe from a website. Why?",
        answer:
          "Some websites may not be compatible with our import feature, or the recipe format might be unusual. You can always manually create the recipe instead by copying the text over and pasting it into the import recipe feature.",
      },
      {
        question: "I'm having trouble with the mobile app.",
        answer:
          "Make sure you're using the latest version of your browser and that JavaScript is enabled. The app works best on modern browsers like Chrome, Safari, or Firefox.",
      },
    ],
  },
  {
    title: "Technical Questions",
    questions: [
      {
        question: "Does the app work offline?",
        answer:
          "Some features work offline, but for the best experience, we recommend using the app with an internet connection. This ensures your data syncs properly across devices.",
      },
      {
        question: `Can I use ${APP_NAME} on my phone?`,
        answer: `Yes! ${APP_NAME} is a web app that works great on mobile devices. You can add it to your home screen for easy access.`,
      },
    ],
  },
];
