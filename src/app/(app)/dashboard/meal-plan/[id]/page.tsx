import { Metadata } from "next";
import { Suspense } from "react";
import MealPlanClient from "../_components/meal-plan-client";

export const metadata: Metadata = {
  title: "Meal plan",
  description: "View and manage a specific meal plan.",
};

type MealPlanDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MealPlanDetailPage({
  params,
}: MealPlanDetailPageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="container mx-auto animate-pulse space-y-4 px-4 py-8">
          <div className="h-10 w-64 rounded-md bg-muted" />
          <div className="h-32 w-full rounded-md bg-muted" />
        </div>
      }
    >
      <MealPlanClient planId={id} />
    </Suspense>
  );
}
