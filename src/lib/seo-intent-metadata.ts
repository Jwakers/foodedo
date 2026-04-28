import { APP_NAME } from "@/app/constants";
import { getSiteBaseUrl } from "@/lib/site-url";
import { openGraphSiteAndUrl } from "@/lib/og-metadata";
import type { IntentPageDefinition } from "@/lib/seo-intent-data";
import type { Metadata } from "next";

export function buildIntentPageMetadata(
  intent: IntentPageDefinition,
): Metadata {
  const canonicalUrl = `${getSiteBaseUrl()}${intent.path}`;
  const defaultKeywords = [
    APP_NAME,
    "meal planning",
    "family meals",
    "shopping list",
    "recipes",
  ];

  return {
    /** Root layout applies `%s | ${APP_NAME}` — keep titles concise here. */
    title: intent.metaTitle,
    description: intent.metaDescription,
    alternates: { canonical: canonicalUrl },
    robots: { index: true, follow: true },
    openGraph: {
      ...openGraphSiteAndUrl(canonicalUrl),
      title: intent.metaTitle,
      description: intent.metaDescription,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: intent.metaTitle,
      description: intent.metaDescription,
    },
    keywords: intent.keywords ? [...intent.keywords] : defaultKeywords,
  };
}
