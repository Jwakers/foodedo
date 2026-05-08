import { APP_NAME, ROUTES } from "@/app/constants";
import { PublicPageTracker } from "@/components/analytics/public-page-tracker";
import { getSiteBaseUrl } from "@/lib/site-url";
import { openGraphSiteAndUrl } from "@/lib/og-metadata";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import type { Metadata } from "next";
import { Suspense } from "react";
import DiscoverRecipesClient from "./_components/discover-recipes-client";

const discoverCanonical = `${getSiteBaseUrl()}${ROUTES.DISCOVER}`;

export const metadata: Metadata = {
  alternates: { canonical: discoverCanonical },
  title: "Discover Recipes",
  description:
    "Browse our curated recipes. Discover dinner ideas for your family.",
  openGraph: {
    ...openGraphSiteAndUrl(discoverCanonical),
    title: `Discover Recipes | ${APP_NAME}`,
    description:
      "Browse our curated recipes. Discover dinner ideas for your family.",
  },
  twitter: {
    card: "summary_large_image",
    title: `Discover Recipes | ${APP_NAME}`,
    description:
      "Browse our curated recipes. Discover dinner ideas for your family.",
  },
};

export default function DiscoverPage() {
  return (
    <>
      <PublicPageTracker event={ANALYTICS_EVENTS.DISCOVER_VIEWED} />
      <div className="container mx-auto px-4 pt-8 pb-2">
        <h1 className="text-4xl font-bold text-foreground mb-2">Discover</h1>
        <p className="text-muted-foreground text-lg">
          Browse our curated recipes.
        </p>
      </div>
      <Suspense fallback={<DiscoverPageLoadingFallback />}>
        <DiscoverRecipesClient />
      </Suspense>
    </>
  );
}

function DiscoverPageLoadingFallback() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-5 w-72 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-64 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
