import { PublicPageTracker } from "@/components/analytics/public-page-tracker";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { buildFaqJsonLdFromPairs } from "@/lib/faq-json-ld";
import { serializeJsonLd } from "@/lib/json-ld";
import { getSiteBaseUrl } from "@/lib/site-url";
import type { IntentPageDefinition } from "@/lib/seo-intent-data";
import { IntentLandingBody } from "./intent-landing-body";

type IntentLandingPageWrapperProps = {
  intent: IntentPageDefinition;
  secondaryHref: string;
  secondaryLabel: string;
  analyticsEvent?: string;
};

function intentPathToTopic(path: string): string {
  return path.replace(/^\//, "").replaceAll("/", "_").replaceAll("-", "_");
}

export function IntentLandingPageWrapper({
  intent,
  secondaryHref,
  secondaryLabel,
  analyticsEvent = ANALYTICS_EVENTS.LANDING_VIEWED,
}: IntentLandingPageWrapperProps) {
  const pageUrl = `${getSiteBaseUrl()}${intent.path}`;
  const faqJsonLd = buildFaqJsonLdFromPairs(intent.faq, pageUrl);
  const safeJsonLd = serializeJsonLd(faqJsonLd);

  return (
    <>
      <PublicPageTracker
        event={analyticsEvent}
        props={{ intent_topic: intentPathToTopic(intent.path) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd }}
      />
      <IntentLandingBody
        intent={intent}
        secondaryHref={secondaryHref}
        secondaryLabel={secondaryLabel}
      />
    </>
  );
}
