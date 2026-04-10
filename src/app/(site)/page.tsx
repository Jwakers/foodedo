import { APP_NAME, ROUTES } from "@/app/constants";
import { openGraphSiteAndUrl } from "@/lib/og-metadata";
import { SITE_DEFAULT_OG_IMAGE_ALT, SITE_MISSION } from "@/lib/site-messaging";
import { getSiteBaseUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import HomeContent from "./_components/home-content";

const canonicalUrl = `${getSiteBaseUrl()}${ROUTES.HOME}`;

const homeTitle = `${APP_NAME} - Weekly meal plans in one click (open beta)`;
const homeDescription = `Open beta: ${SITE_MISSION} Personalised weeks from your recipes: balanced, lists, and household sharing. Free, no card. Feedback welcome.`;

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
        alt: SITE_DEFAULT_OG_IMAGE_ALT,
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
