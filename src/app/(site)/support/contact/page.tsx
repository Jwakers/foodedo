import { APP_NAME, ROUTES } from "@/app/constants";
import { PublicPageTracker } from "@/components/analytics/public-page-tracker";
import { PublicContactActions } from "@/app/(site)/support/contact/public-contact-actions";
import { auth } from "@clerk/nextjs/server";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { openGraphSiteAndUrl } from "@/lib/og-metadata";
import { getSiteBaseUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";

const path = ROUTES.PUBLIC_SUPPORT_CONTACT;
const canonicalUrl = `${getSiteBaseUrl()}${path}`;

export const metadata: Metadata = {
  title: `Contact | ${APP_NAME}`,
  description: `Contact ${APP_NAME}: sign in to send a message through the app, or use the links below for account help and support documentation.`,
  alternates: { canonical: canonicalUrl },
  robots: { index: true, follow: true },
  openGraph: {
    ...openGraphSiteAndUrl(canonicalUrl),
    title: `Contact | ${APP_NAME}`,
    description: `Contact options for ${APP_NAME}.`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Contact | ${APP_NAME}`,
    description: `Contact options for ${APP_NAME}.`,
  },
};

export default async function PublicContactPage() {
  const { userId } = await auth();
  if (userId) {
    redirect(ROUTES.CONTACT);
  }

  return (
    <div className="container mx-auto px-4 py-10 md:py-14 max-w-2xl">
      <PublicPageTracker event={ANALYTICS_EVENTS.SUPPORT_PAGE_VIEWED} />
      <h1 className="text-4xl font-bold tracking-tight mb-4">Contact us</h1>
      <p className="text-muted-foreground mb-8">
        We read every message. For account-specific issues, the in-app contact
        form is the fastest path—it attaches context so we can help quickly.
      </p>

      <div className="rounded-xl border bg-card p-6 space-y-4 mb-8">
        <h2 className="text-lg font-semibold">Send a message (signed in)</h2>
        <p className="text-sm text-muted-foreground">
          The contact form lives in the app so we can route your message
          securely. Sign in or create an account, then open Contact from Help.
        </p>
        <PublicContactActions />
      </div>

      <div className="space-y-3 text-sm text-muted-foreground">
        <p>
          <Link
            href={ROUTES.FAQ}
            className="text-primary underline-offset-4 hover:underline"
          >
            FAQ
          </Link>{" "}
          — common questions about meal plans, lists, and households.
        </p>
        <p>
          <Link
            href={ROUTES.PUBLIC_SUPPORT}
            className="text-primary underline-offset-4 hover:underline"
          >
            Help & Support hub
          </Link>{" "}
          — overview of public help pages.
        </p>
      </div>
    </div>
  );
}
