import { APP_NAME, ROUTES } from "@/app/constants";
import { getSiteBaseUrl } from "@/lib/site-url";
import { openGraphSiteAndUrl } from "@/lib/og-metadata";
import type { Metadata } from "next";

const signUpCanonical = `${getSiteBaseUrl()}${ROUTES.SIGN_UP}`;

export const metadata: Metadata = {
  alternates: { canonical: signUpCanonical },
  title: "Sign Up",
  description: `Create your free ${APP_NAME} account. Start planning meals, saving recipes, and generating shopping lists for your family.`,
  openGraph: {
    ...openGraphSiteAndUrl(signUpCanonical),
    title: `Sign Up | ${APP_NAME}`,
    description: `Create your free ${APP_NAME} account. Start planning meals, saving recipes, and generating shopping lists for your family.`,
  },
  twitter: {
    card: "summary_large_image",
    title: `Sign Up | ${APP_NAME}`,
    description: `Create your free ${APP_NAME} account. Start planning meals, saving recipes, and generating shopping lists for your family.`,
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
