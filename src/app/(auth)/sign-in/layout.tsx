import { APP_NAME, ROUTES } from "@/app/constants";
import { getSiteBaseUrl } from "@/lib/site-url";
import { openGraphSiteAndUrl } from "@/lib/og-metadata";
import type { Metadata } from "next";

const signInCanonical = `${getSiteBaseUrl()}${ROUTES.SIGN_IN}`;

export const metadata: Metadata = {
  alternates: { canonical: signInCanonical },
  title: "Sign In",
  description: `Sign in to ${APP_NAME} to access your recipes, meal plans, and shopping lists.`,
  openGraph: {
    ...openGraphSiteAndUrl(signInCanonical),
    title: `Sign In | ${APP_NAME}`,
    description: `Sign in to ${APP_NAME} to access your recipes, meal plans, and shopping lists.`,
  },
  twitter: {
    card: "summary_large_image",
    title: `Sign In | ${APP_NAME}`,
    description: `Sign in to ${APP_NAME} to access your recipes, meal plans, and shopping lists.`,
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
