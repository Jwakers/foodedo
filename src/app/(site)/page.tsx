import { APP_NAME, ROUTES } from "@/app/constants";
import HomeContent from "./_components/home-content";
import { api } from "convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { openGraphSiteAndUrl } from "@/lib/og-metadata";
import type { HomepageShowcaseRecipe } from "@/lib/homepage-showcase-recipes";
import { serializeJsonLd } from "@/lib/json-ld";
import { SITE_DEFAULT_OG_IMAGE_ALT } from "@/lib/site-messaging";
import { getSiteBaseUrl } from "@/lib/site-url";
import type { Metadata } from "next";

const canonicalUrl = `${getSiteBaseUrl()}${ROUTES.HOME}`;
const siteBase = getSiteBaseUrl();

const homeTitle = `${APP_NAME} - Weekly meal plan & shopping list in one click (open beta)`;
const homeDescription = `Open beta: weekly meal plan & shopping list in one click with ${APP_NAME}. Curated meals to start; add yours anytime. Household sharing. Free, no card.`;

const homeOgImage = "/hero-2.png";

const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteBase}#organization`,
      name: APP_NAME,
      url: siteBase,
    },
    {
      "@type": "WebSite",
      "@id": `${siteBase}#website`,
      url: siteBase,
      name: APP_NAME,
      description: homeDescription,
      inLanguage: "en-GB",
      publisher: { "@id": `${siteBase}#organization` },
    },
  ],
};

export const metadata: Metadata = {
  title: {
    /** Avoid root layout template duplicating the brand (e.g. "Foodedo | Foodedo"). */
    absolute: homeTitle,
  },
  description: homeDescription,
  keywords: [
    APP_NAME,
    "weekly meal plan",
    "meal planning",
    "shopping list",
    "family meals",
    "curated recipes",
    "household",
  ],
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

/** Refresh homepage showcase recipes weekly (Convex-backed). Must be a literal for Next.js static analysis. */
export const revalidate = 604800;

export default async function HomePage() {
  let showcaseRecipes: HomepageShowcaseRecipe[] = [];
  try {
    showcaseRecipes = await fetchQuery(
      api.recipes.getHomepageShowcaseRecipes,
      { limit: 7 },
    );
  } catch {
    showcaseRecipes = [];
  }

  const safeJsonLd = serializeJsonLd(homeJsonLd);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd }}
      />
      <HomeContent showcaseRecipes={showcaseRecipes} />
    </>
  );
}
