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

/** Visual accents per section — order must match `FAQ_SECTIONS_DATA` in `faq-content.ts`. */
export const FAQ_SECTION_ACCENTS: { Icon: LucideIcon; color: string }[] = [
  {
    Icon: Utensils,
    color: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
  },
  {
    Icon: Utensils,
    color: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400",
  },
  {
    Icon: CalendarCheck,
    color:
      "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400",
  },
  {
    Icon: Users,
    color:
      "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400",
  },
  {
    Icon: Users,
    color:
      "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400",
  },
  {
    Icon: HelpCircle,
    color: "bg-cyan-100 dark:bg-cyan-900 text-cyan-600 dark:text-cyan-400",
  },
  {
    Icon: Shield,
    color: "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400",
  },
  {
    Icon: Wrench,
    color:
      "bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400",
  },
  {
    Icon: Smartphone,
    color:
      "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400",
  },
];
