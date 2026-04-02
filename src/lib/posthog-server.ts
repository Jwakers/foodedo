import { PostHog } from "posthog-node";
import type { AnalyticsEventName, AnalyticsProps } from "@/lib/analytics/events";

let posthogClient: PostHog | null = null;

export function getPostHogClient() {
  const posthogKey =
    process.env.POSTHOG_PROJECT_API_KEY ??
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const posthogHost =
    process.env.POSTHOG_HOST ?? process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!posthogKey || !posthogHost) return null;

  if (!posthogClient) {
    posthogClient = new PostHog(posthogKey, {
      host: posthogHost,
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return posthogClient;
}

export async function shutdownPostHog() {
  if (posthogClient) {
    await posthogClient.shutdown();
  }
}

export async function captureServerEvent(
  distinctId: string,
  event: AnalyticsEventName,
  properties: AnalyticsProps = {},
) {
  const client = getPostHogClient();
  if (!client) return;

  client.capture({
    distinctId,
    event,
    properties,
  });
  await client.shutdown();
  posthogClient = null;
}
