import { APP_NAME, ROUTES } from "@/app/constants";
import { Button } from "@/components/ui/button";
import { openGraphSiteAndUrl } from "@/lib/og-metadata";
import { getSiteBaseUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import Link from "next/link";

type StaticGuideMetadataOptions = {
  title: string;
  description: string;
  canonicalPath: string;
};

type GuideSection = {
  heading: string;
  body: string;
};

type StaticSeoGuideLayoutProps = {
  title: string;
  description: string;
  sections: readonly GuideSection[];
  ctaHref: string;
  ctaLabel: string;
};

export function buildStaticGuideMetadata({
  title,
  description,
  canonicalPath,
}: StaticGuideMetadataOptions): Metadata {
  const canonicalUrl = new URL(canonicalPath, getSiteBaseUrl()).toString();

  return {
    title: `${title} | ${APP_NAME}`,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      ...openGraphSiteAndUrl(canonicalUrl),
      title: `${title} | ${APP_NAME}`,
      description,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${APP_NAME}`,
      description,
    },
  };
}

export function StaticSeoGuideLayout({
  title,
  description,
  sections,
  ctaHref,
  ctaLabel,
}: StaticSeoGuideLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href={ROUTES.BLOG}>
            <span className="mr-2">←</span>
            Back to Blog
          </Link>
        </Button>

        <article className="space-y-8">
          <header className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
            <p className="text-lg text-muted-foreground">{description}</p>
          </header>

          <div className="space-y-7">
            {sections.map((section) => (
              <section key={section.heading} className="space-y-2">
                <h2 className="text-2xl font-semibold">{section.heading}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {section.body}
                </p>
              </section>
            ))}
          </div>

          <footer className="border-t pt-7 space-y-3">
            <p className="text-sm text-muted-foreground">
              Ready to put this into practice?
            </p>
            <Button asChild>
              <Link href={ctaHref}>{ctaLabel}</Link>
            </Button>
          </footer>
        </article>
      </div>
    </div>
  );
}
