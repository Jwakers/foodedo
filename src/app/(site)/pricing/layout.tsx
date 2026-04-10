import { APP_NAME, ROUTES } from "@/app/constants";
import { openGraphSiteAndUrl } from "@/lib/og-metadata";
import { SITE_MISSION } from "@/lib/site-messaging";
import { getSiteBaseUrl } from "@/lib/site-url";
import type { Metadata } from "next";

const pricingCanonical = `${getSiteBaseUrl()}${ROUTES.PRICING}`;

const pricingDescription = `${SITE_MISSION} ${APP_NAME} pricing and plans. Start free; upgrade when you need more recipes and household features.`;

export const metadata: Metadata = {
  alternates: { canonical: pricingCanonical },
  title: "Pricing",
  description: pricingDescription,
  openGraph: {
    ...openGraphSiteAndUrl(pricingCanonical),
    title: `Pricing | ${APP_NAME}`,
    description: pricingDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: `Pricing | ${APP_NAME}`,
    description: pricingDescription,
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
