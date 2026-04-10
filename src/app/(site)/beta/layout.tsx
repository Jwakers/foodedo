import { APP_NAME, ROUTES } from "@/app/constants";
import { openGraphSiteAndUrl } from "@/lib/og-metadata";
import { SITE_MISSION } from "@/lib/site-messaging";
import { getSiteBaseUrl } from "@/lib/site-url";
import type { Metadata } from "next";

const betaCanonical = `${getSiteBaseUrl()}${ROUTES.BETA}`;

const betaDescription = `Join the ${APP_NAME} open beta: ${SITE_MISSION} Your feedback shapes what we ship. Free, no card.`;

export const metadata: Metadata = {
  alternates: { canonical: betaCanonical },
  title: "Beta",
  description: betaDescription,
  openGraph: {
    ...openGraphSiteAndUrl(betaCanonical),
    title: `${APP_NAME} Beta`,
    description: betaDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} Beta`,
    description: betaDescription,
  },
};

export default function BetaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
