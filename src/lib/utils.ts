import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Root domain for marketing site (e.g. kitchen-sync-app.com). localhost in dev. */
export const rootDomain =
  process.env.NEXT_PUBLIC_SITE_DOMAIN || "localhost:3000";

/** Protocol for building absolute URLs */
export const protocol =
  process.env.NODE_ENV === "production" ? "https" : "http";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function titleCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
