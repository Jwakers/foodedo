import { APP_NAME } from "@/app/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: `Sign in to ${APP_NAME} to access your recipes, meal plans, and shopping lists.`,
  openGraph: {
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
