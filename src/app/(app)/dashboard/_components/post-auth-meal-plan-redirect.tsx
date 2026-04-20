"use client";

import { ROUTES } from "@/app/constants";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/posthog-client";
import { useCurrentMealPlan } from "@/app/(app)/_components.tsx/current-meal-plan-context";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

const SESSION_KEY_DASHBOARD_NO_PLAN = "foodedo_onboarding_dashboard_no_plan";

function trackDashboardNoPlanOnce(props: { had_planning_query: boolean }) {
  try {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY_DASHBOARD_NO_PLAN)) return;
    sessionStorage.setItem(SESSION_KEY_DASHBOARD_NO_PLAN, "1");
    trackEvent(ANALYTICS_EVENTS.ONBOARDING_DASHBOARD_NO_PLAN_VIEWED, props);
  } catch {
    trackEvent(ANALYTICS_EVENTS.ONBOARDING_DASHBOARD_NO_PLAN_VIEWED, props);
  }
}

/**
 * After sign-up, Clerk sends users to `ROUTES.DASHBOARD_AFTER_SIGNUP` (`?planning=1`).
 * If they already have a meal plan overlapping today, strip the query and stay on
 * the dashboard; otherwise send them to meal planning.
 */
export function PostAuthMealPlanRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const planning = searchParams.get("planning") === "1";
  const { currentPlan } = useCurrentMealPlan();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (pathname !== ROUTES.DASHBOARD) return;
    if (currentPlan === undefined) return;

    if (currentPlan === null) {
      trackDashboardNoPlanOnce({ had_planning_query: planning });
    }

    if (!planning) return;
    if (redirectedRef.current) return;

    if (currentPlan === null) {
      redirectedRef.current = true;
      router.replace(ROUTES.MEAL_PLAN);
      return;
    }

    redirectedRef.current = true;
    router.replace(ROUTES.DASHBOARD, { scroll: false });
  }, [pathname, planning, currentPlan, router]);

  return null;
}
