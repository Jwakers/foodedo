import { APP_NAME, ROUTES } from "@/app/constants";
import { getSiteBaseUrl } from "@/lib/site-url";
import { openGraphSiteAndUrl } from "@/lib/og-metadata";
import type { Metadata } from "next";
import HomeContent from "./_components/home-content";

const canonicalUrl = `${getSiteBaseUrl()}${ROUTES.HOME}`;

const homeTitle = `${APP_NAME} — Family Meal Planning App & Weekly Planner (Open Beta)`;
const homeDescription = `Open beta family meal planning: personalised weekly plans in one tap from your recipes — balanced, list & sharing. Free, no card. Feedback welcome.`;

const homeOgImage = "/hero-2.png";

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
    images: [
      {
        url: homeOgImage,
        width: 1376,
        height: 768,
        alt: `${APP_NAME} — personalised weekly meal planning`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: homeTitle,
    description: homeDescription,
    images: [homeOgImage],
  },
};

export default function HomePage() {
  return <HomeContent />;
}
