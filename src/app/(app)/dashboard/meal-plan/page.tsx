import { SITE_MISSION } from "@/lib/site-messaging";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import MealPlanClient from "./_components/meal-plan-client";

export const metadata: Metadata = {
  title: "Meal planning",
  description: `${SITE_MISSION} Then adjust, share, and generate a shopping list.`,
};

type MealPlanPageProps = {
  searchParams: Promise<{ plan?: string }>;
};

export default async function MealPlanPage({
  searchParams,
}: MealPlanPageProps) {
  const { plan } = await searchParams;
  if (plan) {
    redirect(`/dashboard/meal-plan/${encodeURIComponent(plan)}`);
  }

  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8 animate-pulse space-y-4">
          <div className="h-10 w-64 rounded-md bg-muted" />
          <div className="h-32 w-full rounded-md bg-muted" />
        </div>
      }
    >
      <MealPlanClient generationOnly />
    </Suspense>
  );
}
