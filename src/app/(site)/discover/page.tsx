import { APP_NAME, ROUTES } from "@/app/constants";
import { getSiteBaseUrl } from "@/lib/site-url";
import { openGraphSiteAndUrl } from "@/lib/og-metadata";
import type { Metadata } from "next";
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
      <div className="container mx-auto px-4 pt-8 pb-2">
        <h1 className="text-4xl font-bold text-foreground mb-2">Discover</h1>
        <p className="text-muted-foreground text-lg">
          Browse our curated recipes.
        </p>
      </div>
      <DiscoverRecipesClient />
    </>
  );
}
