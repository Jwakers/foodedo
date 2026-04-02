import { APP_NAME, ROUTES } from "@/app/constants";
import { getSiteBaseUrl } from "@/lib/site-url";
import { openGraphSiteAndUrl } from "@/lib/og-metadata";
import type { Metadata } from "next";
import HomeContent from "./_components/home-content";

const canonicalUrl = `${getSiteBaseUrl()}${ROUTES.HOME}`;

const homeTitle = `${APP_NAME} — Family Meal Planning App & Weekly Planner`;
const homeDescription = `Plan balanced weekly meals for your household, collaborate on one plan, and turn recipes into a smart shopping list. Less stress, less food waste — start free.`;

export const metadata: Metadata = {
  title: {
    /** Avoid root layout template duplicating the brand (e.g. "Foodedo | Foodedo"). */
    absolute: homeTitle,
  },
  description: homeDescription,
  alternates: {
    canonical: canonicalUrl,
  },
  robots: { index: true, follow: true },
  openGraph: {
    ...openGraphSiteAndUrl(canonicalUrl),
    title: homeTitle,
    description: homeDescription,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: homeTitle,
    description: homeDescription,
  },
};

export default function HomePage() {
  return <HomeContent />;
}
