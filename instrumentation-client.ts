import posthog from "posthog-js";

const posthogToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

if (posthogToken) {
  posthog.init(posthogToken, {
    api_host: "/ingest",
    ui_host: "https://eu.posthog.com",
    defaults: "2026-01-30",
    capture_exceptions: true,
    // Automatic $pageview on route changes; set false if this feels too noisy.
    capture_pageview: true,
    debug: process.env.NODE_ENV === "development",
  });
}
