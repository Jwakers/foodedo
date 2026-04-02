"use client";

import { memo, useEffect } from "react";
import { usePathname } from "next/navigation";
import type { AnalyticsEventName, AnalyticsProps } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/posthog-client";

type PublicPageTrackerProps = {
  event: AnalyticsEventName;
  props?: AnalyticsProps;
};

function PublicPageTrackerInner({ event, props }: PublicPageTrackerProps) {
  const pathname = usePathname();

  useEffect(() => {
    trackEvent(event, {
      page_path: pathname,
      ...props,
    });
  }, [event, pathname, props]);

  return null;
}

function propsEqual(
  a: AnalyticsProps | undefined,
  b: AnalyticsProps | undefined,
): boolean {
  return JSON.stringify(a ?? {}) === JSON.stringify(b ?? {});
}

export const PublicPageTracker = memo(
  PublicPageTrackerInner,
  (prev, next) =>
    prev.event === next.event && propsEqual(prev.props, next.props),
);
