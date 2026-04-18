import { Suspense } from "react";
import DashboardClient from "./_components/dashboard-client";
import { PostAuthMealPlanRedirect } from "./_components/post-auth-meal-plan-redirect";

export const metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <>
      <Suspense fallback={null}>
        <PostAuthMealPlanRedirect />
      </Suspense>
      <DashboardClient />
    </>
  );
}
