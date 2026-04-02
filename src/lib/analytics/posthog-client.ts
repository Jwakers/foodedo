"use client";

import type { AnalyticsEventName, AnalyticsProps } from "@/lib/analytics/events";
import { getAttributionProps } from "@/lib/analytics/attribution";
import posthog from "posthog-js";

/**
 * posthog-js queues captures before init completes; no internal __loaded checks.
 */
export function trackEvent(
  event: AnalyticsEventName,
  props: AnalyticsProps = {},
): void {
  if (typeof window === "undefined") return;

  const mergedProps: AnalyticsProps = {
    ...getAttributionProps(),
    ...props,
  };
  posthog.capture(event, mergedProps);
}
