import { ROUTES } from "@/app/constants";
import { getSiteBaseUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import HomeContent from "./_components/home-content";

export const metadata: Metadata = {
  alternates: {
    canonical: getSiteBaseUrl() + ROUTES.HOME,
  },
};

export default function HomePage() {
  return <HomeContent />;
}
