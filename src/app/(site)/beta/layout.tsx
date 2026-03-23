import { APP_NAME, ROUTES } from "@/app/constants";
import { getSiteBaseUrl } from "@/lib/site-url";
import { openGraphSiteAndUrl } from "@/lib/og-metadata";
import type { Metadata } from "next";

const betaCanonical = `${getSiteBaseUrl()}${ROUTES.BETA}`;

export const metadata: Metadata = {
  alternates: { canonical: betaCanonical },
  title: "Beta",
  description: `Join the ${APP_NAME} beta. Help shape family meal planning with your feedback. Build a repeatable meal planning rhythm for your household.`,
  openGraph: {
    ...openGraphSiteAndUrl(betaCanonical),
    title: `${APP_NAME} Beta`,
    description: `Join the ${APP_NAME} beta. Help shape family meal planning with your feedback. Build a repeatable meal planning rhythm for your household.`,
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} Beta`,
    description: `Join the ${APP_NAME} beta. Help shape family meal planning with your feedback. Build a repeatable meal planning rhythm for your household.`,
  },
};

export default function BetaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
