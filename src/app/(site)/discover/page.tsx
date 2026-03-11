import { APP_NAME } from "@/app/constants";
import type { Metadata } from "next";
import { Suspense } from "react";
import DiscoverRecipesClient from "./_components/discover-recipes-client";

export const metadata: Metadata = {
  title: "Discover Recipes",
  description:
    "Browse our curated recipes. Discover dinner ideas for your family.",
};

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <div className="h-10 w-48 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-5 w-72 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-64 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      }
    >
      <div className="container mx-auto px-4 pt-8 pb-2">
        <h1 className="text-4xl font-bold text-foreground mb-2">Discover</h1>
        <p className="text-muted-foreground text-lg">
          Browse our curated recipes.
        </p>
      </div>
      <DiscoverRecipesClient />
    </Suspense>
  );
}
