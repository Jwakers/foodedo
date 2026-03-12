import { APP_NAME } from "@/app/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Beta",
  description: `Join the ${APP_NAME} beta. Help shape family meal planning with your feedback. Build a repeatable meal planning rhythm for your household.`,
  openGraph: {
    title: `${APP_NAME} Beta`,
    description: `Join the ${APP_NAME} beta. Help shape family meal planning with your feedback. Build a repeatable meal planning rhythm for your household.`,
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} Beta`,
    description: `Join the ${APP_NAME} beta. Help shape family meal planning with your feedback. Build a repeatable meal planning rhythm for your household.`,
  },
};

export default function BetaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
