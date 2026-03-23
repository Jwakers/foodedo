import type { LucideIcon } from "lucide-react";
import {
  CalendarCheck,
  HelpCircle,
  Shield,
  Smartphone,
  Users,
  Utensils,
  Wrench,
} from "lucide-react";

import { FAQ_SECTIONS_DATA } from "./faq-content";

/** Visual accents per section — order must match `FAQ_SECTIONS_DATA` in `faq-content.ts`. */
type FaqSectionAccent = Readonly<{ Icon: LucideIcon; color: string }>;

const FAQ_SECTION_ACCENTS_BY_TITLE: Readonly<Record<string, FaqSectionAccent>> =
  {
    "Getting Started": {
      Icon: Utensils,
      color: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
    },
    "Recipe Features": {
      Icon: Utensils,
      color:
        "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400",
    },
    "Meal planning": {
      Icon: CalendarCheck,
      color:
        "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400",
    },
    "Shopping lists": {
      Icon: Users,
      color:
        "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400",
    },
    "Households & Sharing": {
      Icon: Users,
      color:
        "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400",
    },
    "Kitchen Chalkboard": {
      Icon: HelpCircle,
      color: "bg-cyan-100 dark:bg-cyan-900 text-cyan-600 dark:text-cyan-400",
    },
    "Account & Privacy": {
      Icon: Shield,
      color: "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400",
    },
    Troubleshooting: {
      Icon: Wrench,
      color:
        "bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400",
    },
    "Technical Questions": {
      Icon: Smartphone,
      color:
        "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400",
    },
  };

export const FAQ_SECTION_ACCENTS: ReadonlyArray<FaqSectionAccent> =
  FAQ_SECTIONS_DATA.map((section) => {
    const accent = FAQ_SECTION_ACCENTS_BY_TITLE[section.title];
    if (!accent)
      throw new Error(`Missing accent for FAQ section: ${section.title}`);
    return accent;
  });

if (FAQ_SECTION_ACCENTS.length !== FAQ_SECTIONS_DATA.length) {
  throw new Error(
    `FAQ_SECTION_ACCENTS length (${FAQ_SECTION_ACCENTS.length}) must match FAQ_SECTIONS_DATA length (${FAQ_SECTIONS_DATA.length}). Update both files so section order and count stay in sync.`,
  );
}
