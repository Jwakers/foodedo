import { APP_NAME } from "@/app/constants";
import { Footer } from "@/app/(site)/_components/footer";
import { Header } from "@/app/(site)/_components/header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${APP_NAME} - Family Meal Planning`,
  description: `Create recipes, plan weekly meals, and generate smart shopping lists. Take the pain out of family meal planning with ${APP_NAME}.`,
  openGraph: {
    siteName: APP_NAME,
    title: `${APP_NAME} - Family Meal Planning`,
    description: `Create recipes, plan weekly meals, and generate smart shopping lists. Take the pain out of family meal planning with ${APP_NAME}.`,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${APP_NAME} - Family Meal Planning Made Simple`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} - Family Meal Planning`,
    description: `Create recipes, plan weekly meals, and generate smart shopping lists. Take the pain out of family meal planning with ${APP_NAME}.`,
    images: ["/og-image.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
