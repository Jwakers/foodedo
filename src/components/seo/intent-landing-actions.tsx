"use client";

import { APP_NAME, ROUTES } from "@/app/constants";
import { Button } from "@/components/ui/button";
import { intentPathToTopic } from "@/components/seo/intent-topic";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/posthog-client";
import { SignUpButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const CTA_CLASSES =
  "text-base px-6 py-3 h-auto shadow-md hover:shadow-lg transition-all duration-300 w-full sm:w-auto";

type IntentLandingActionsProps = {
  intentTopic: string;
  secondaryHref: string;
  secondaryLabel: string;
};

/**
 * Primary: sign up (unauthenticated) or dashboard (authenticated).
 * Secondary: usually Discover or FAQ.
 */
export function IntentLandingActions({
  intentTopic,
  secondaryHref,
  secondaryLabel,
}: IntentLandingActionsProps) {
  const normalizedIntentTopic = intentPathToTopic(intentTopic);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <Authenticated>
          <Button asChild size="lg" className={CTA_CLASSES}>
            <Link
              href={ROUTES.DASHBOARD}
              onClick={() => {
                trackEvent(ANALYTICS_EVENTS.CTA_CLICKED, {
                  cta_type: "dashboard_primary",
                  intent_topic: normalizedIntentTopic,
                });
              }}
            >
              Open {APP_NAME}
              <ArrowRight className="ml-2 size-5" />
            </Link>
          </Button>
        </Authenticated>
        <Unauthenticated>
          <SignUpButton
            mode="modal"
            forceRedirectUrl={ROUTES.DASHBOARD_AFTER_SIGNUP}
          >
            <Button
              size="lg"
              className={CTA_CLASSES}
              onClick={() => {
                trackEvent(ANALYTICS_EVENTS.CTA_CLICKED, {
                  cta_type: "signup_primary",
                  intent_topic: normalizedIntentTopic,
                });
                trackEvent(ANALYTICS_EVENTS.SIGNUP_STARTED, {
                  source_surface: "intent_landing",
                  intent_topic: normalizedIntentTopic,
                });
              }}
            >
              Try for free
              <ArrowRight className="ml-2 size-5" />
            </Button>
          </SignUpButton>
        </Unauthenticated>
        <Button variant="outline" size="lg" className={CTA_CLASSES} asChild>
          <Link
            href={secondaryHref}
            onClick={() => {
              trackEvent(ANALYTICS_EVENTS.CTA_CLICKED, {
                cta_type: "secondary_link",
                intent_topic: normalizedIntentTopic,
                target_href: secondaryHref,
              });
              trackEvent(ANALYTICS_EVENTS.SECONDARY_ACTION_TAKEN, {
                action_name: "intent_secondary_click",
                intent_topic: normalizedIntentTopic,
                target_href: secondaryHref,
              });
            }}
          >
            {secondaryLabel}
          </Link>
        </Button>
      </div>
    </div>
  );
}
