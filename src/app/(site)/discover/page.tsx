import { APP_NAME } from "@/app/constants";
import type { Metadata } from "next";
import DiscoverRecipesClient from "./_components/discover-recipes-client";

export const metadata: Metadata = {
  title: "Discover Recipes",
  description:
    "Browse our curated recipes. Discover dinner ideas for your family.",
};

export default function DiscoverPage() {
  return <DiscoverRecipesClient />;
}
