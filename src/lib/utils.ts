import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function titleCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Replaces underscores/hyphens with spaces and title-cases each word (e.g. "middle_eastern" -> "Middle Eastern"). */
export function formatLabel(str: string) {
  return str
    .replace(/[_-]/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/** Start of day in UTC for a given timestamp (ms). Safe to use in client and Convex. */
export function startOfDayMs(ms: number): number {
  const d = new Date(ms);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

/** Start of calendar day in the viewer's local timezone (ms since epoch). */
export function startOfLocalDayMs(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Local calendar date as YYYY-MM-DD (user timezone). For meal plan "today" preference on the server. */
export function localCalendarDateKey(ms: number = Date.now()): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
