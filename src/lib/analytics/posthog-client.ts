"use client";

import type { AnalyticsEventName, AnalyticsProps } from "@/lib/analytics/events";
import { getAttributionProps } from "@/lib/analytics/attribution";
import posthog from "posthog-js";

export function trackEvent(
  event: AnalyticsEventName,
  props: AnalyticsProps = {},
): void {
  if (typeof window === "undefined") return;
  // posthog-js may not be initialized in environments without keys.
  if (!posthog.__loaded) return;

  const mergedProps: AnalyticsProps = {
    ...getAttributionProps(),
    ...props,
  };
  posthog.capture(event, mergedProps);
}
