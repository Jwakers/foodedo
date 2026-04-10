import { APP_NAME, ROUTES } from "@/app/constants";
import { openGraphSiteAndUrl } from "@/lib/og-metadata";
import { SITE_MISSION } from "@/lib/site-messaging";
import { getSiteBaseUrl } from "@/lib/site-url";
import type { Metadata } from "next";

const signInCanonical = `${getSiteBaseUrl()}${ROUTES.SIGN_IN}`;

const signInDescription = `Sign in to ${APP_NAME}. ${SITE_MISSION} Your recipes, plans, and shopping lists.`;

export const metadata: Metadata = {
  alternates: { canonical: signInCanonical },
  title: "Sign In",
  description: signInDescription,
  openGraph: {
    ...openGraphSiteAndUrl(signInCanonical),
    title: `Sign In | ${APP_NAME}`,
    description: signInDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: `Sign In | ${APP_NAME}`,
    description: signInDescription,
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
