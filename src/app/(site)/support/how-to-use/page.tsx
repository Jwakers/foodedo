import { APP_NAME, ROUTES } from "@/app/constants";
import { PublicPageTracker } from "@/components/analytics/public-page-tracker";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import {
  PUBLIC_HOW_TO_FAQ,
  PUBLIC_HOW_TO_SECTIONS,
} from "@/lib/public-how-to-content";
import { buildFaqJsonLdFromPairs } from "@/lib/faq-json-ld";
import { serializeJsonLd } from "@/lib/json-ld";
import { openGraphSiteAndUrl } from "@/lib/og-metadata";
import { getSiteBaseUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import Link from "next/link";

const path = ROUTES.PUBLIC_SUPPORT_HOW_TO;
const canonicalUrl = `${getSiteBaseUrl()}${path}`;

export const metadata: Metadata = {
  title: `How to use ${APP_NAME} | Quick start`,
  description: `Learn how ${APP_NAME} works: households, weekly meal planning, shopping lists, and recipe discovery—then open the full guide in the app when you are signed in.`,
  alternates: { canonical: canonicalUrl },
  robots: { index: true, follow: true },
  openGraph: {
    ...openGraphSiteAndUrl(canonicalUrl),
    title: `How to use ${APP_NAME}`,
    description: `Quick start for ${APP_NAME}: recipes, meal plans, shopping lists, and households.`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `How to use ${APP_NAME}`,
    description: `Quick start for ${APP_NAME}: recipes, meal plans, shopping lists, and households.`,
  },
};

export default function PublicHowToUsePage() {
  const faqJsonLd = buildFaqJsonLdFromPairs(PUBLIC_HOW_TO_FAQ, canonicalUrl);
  const safeJsonLd = serializeJsonLd(faqJsonLd);

  return (
    <div className="container mx-auto px-4 py-10 md:py-14 max-w-3xl">
      <PublicPageTracker event={ANALYTICS_EVENTS.SUPPORT_HOW_TO_VIEWED} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd }}
      />
      <h1 className="text-4xl font-bold tracking-tight mb-4">
        How to use {APP_NAME}
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        This is a public overview you can read without signing in. For the full
        step-by-step guide with every screen, open Help from the app after you
        log in.
      </p>

      <Accordion type="single" collapsible className="w-full mb-10">
        {PUBLIC_HOW_TO_SECTIONS.map((section) => (
          <AccordionItem key={section.id} value={section.id}>
            <AccordionTrigger className="text-left text-base font-semibold">
              {section.title}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              {section.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild size="lg">
          <Link href={ROUTES.SIGN_UP}>Create free account</Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link href={ROUTES.SUPPORT_HOW_TO}>Open full guide in app</Link>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mt-4">
        The in-app guide includes the same topics with more detail. Sign in
        first if you are not logged in.
      </p>
    </div>
  );
}
