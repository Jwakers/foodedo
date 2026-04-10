import { Metadata } from "next";
import { Suspense } from "react";
import MealPlanClient from "./_components/meal-plan-client";

export const metadata: Metadata = {
  title: "Meal planning",
  description:
    "Weekly meal plans in one click. Then adjust, share, and generate a shopping list.",
};

export default function MealPlanPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8 animate-pulse space-y-4">
          <div className="h-10 w-64 rounded-md bg-muted" />
          <div className="h-32 w-full rounded-md bg-muted" />
        </div>
      }
    >
      <MealPlanClient />
    </Suspense>
  );
}
