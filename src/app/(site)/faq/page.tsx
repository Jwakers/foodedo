import { APP_NAME, ROUTES } from "@/app/constants";
import { FaqSectionsPanel } from "@/components/faq/faq-sections-panel";
import { FAQ_SECTIONS_DATA } from "@/lib/faq-content";
import { buildFaqPageJsonLd } from "@/lib/faq-json-ld";
import { openGraphSiteAndUrl } from "@/lib/og-metadata";
import { getSiteBaseUrl } from "@/lib/site-url";
import type { Metadata } from "next";

const faqCanonical = `${getSiteBaseUrl()}${ROUTES.FAQ}`;

export const metadata: Metadata = {
  alternates: { canonical: faqCanonical },
  title: `FAQ | ${APP_NAME}`,
  description: `Answers to common questions about ${APP_NAME}: recipes, meal planning, shopping lists, households, and more.`,
  openGraph: {
    ...openGraphSiteAndUrl(faqCanonical),
    title: `FAQ | ${APP_NAME}`,
    description: `Answers to common questions about ${APP_NAME}: recipes, meal planning, shopping lists, households, and more.`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `FAQ | ${APP_NAME}`,
    description: `Answers to common questions about ${APP_NAME}: recipes, meal planning, shopping lists, households, and more.`,
  },
};

export default function PublicFaqPage() {
  const faqJsonLd = buildFaqPageJsonLd(FAQ_SECTIONS_DATA, faqCanonical);
  const safeJsonLd = JSON.stringify(faqJsonLd).replace(/</g, "\\u003c");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd }}
      />
      <FaqSectionsPanel backHref={ROUTES.HOME} backLabel="Back to Home" />
    </>
  );
}
