"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { AnalyticsEventName, AnalyticsProps } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/posthog-client";

type PublicPageTrackerProps = {
  event: AnalyticsEventName;
  props?: AnalyticsProps;
};

export function PublicPageTracker({ event, props }: PublicPageTrackerProps) {
  const pathname = usePathname();

  useEffect(() => {
    trackEvent(event, {
      page_path: pathname,
      ...props,
    });
  }, [event, pathname, props]);

  return null;
}
