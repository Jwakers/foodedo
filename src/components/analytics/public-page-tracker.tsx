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
    const { page_path: _ignored, ...rest } = props ?? {};
    trackEvent(event, {
      ...rest,
      page_path: pathname,
    });
  }, [event, pathname, props]);

  return null;
}

function propsEqual(
  a: AnalyticsProps | undefined,
  b: AnalyticsProps | undefined,
): boolean {
  try {
    return JSON.stringify(a ?? {}) === JSON.stringify(b ?? {});
  } catch {
    return false;
  }
}

export const PublicPageTracker = memo(
  PublicPageTrackerInner,
  (prev, next) =>
    prev.event === next.event && propsEqual(prev.props, next.props),
);
