import { APP_NAME } from "@/app/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: `Create your free ${APP_NAME} account. Start planning meals, saving recipes, and generating shopping lists for your family.`,
  openGraph: {
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
