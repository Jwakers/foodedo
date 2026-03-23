import { APP_NAME, ROUTES } from "@/app/constants";
import { getSiteBaseUrl } from "@/lib/site-url";
import { openGraphSiteAndUrl } from "@/lib/og-metadata";
import type { Metadata } from "next";

const pricingCanonical = `${getSiteBaseUrl()}${ROUTES.PRICING}`;

export const metadata: Metadata = {
  alternates: { canonical: pricingCanonical },
  title: "Pricing",
  description: `Plans and pricing for ${APP_NAME}. Start free, upgrade when you need more recipes and household features.`,
  openGraph: {
    ...openGraphSiteAndUrl(pricingCanonical),
    title: `Pricing | ${APP_NAME}`,
    description: `Plans and pricing for ${APP_NAME}. Start free, upgrade when you need more recipes and household features.`,
  },
  twitter: {
    card: "summary_large_image",
    title: `Pricing | ${APP_NAME}`,
    description: `Plans and pricing for ${APP_NAME}. Start free, upgrade when you need more recipes and household features.`,
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
