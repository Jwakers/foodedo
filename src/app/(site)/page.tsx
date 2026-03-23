import { ROUTES } from "@/app/constants";
import { getSiteBaseUrl } from "@/lib/site-url";
import { openGraphSiteAndUrl } from "@/lib/og-metadata";
import type { Metadata } from "next";
import HomeContent from "./_components/home-content";

const canonicalUrl = `${getSiteBaseUrl()}${ROUTES.HOME}`;

export const metadata: Metadata = {
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    ...openGraphSiteAndUrl(canonicalUrl),
  },
};

export default function HomePage() {
  return <HomeContent />;
}
