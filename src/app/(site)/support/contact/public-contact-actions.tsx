"use client";

import { ROUTES } from "@/app/constants";
import { ProtectedAppCta } from "@/components/marketing/protected-app-cta";
import { Button } from "@/components/ui/button";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/posthog-client";
import { SignInButton, SignUpButton } from "@clerk/nextjs";

export function PublicContactActions() {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <SignInButton mode="modal">
        <Button
          className="w-full sm:w-auto"
          onClick={() => {
            trackEvent(ANALYTICS_EVENTS.CTA_CLICKED, {
              cta_type: "support_contact_signin",
            });
          }}
        >
          Sign in
        </Button>
      </SignInButton>
      <SignUpButton
        mode="modal"
        forceRedirectUrl={ROUTES.DASHBOARD_AFTER_SIGNUP}
      >
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => {
            trackEvent(ANALYTICS_EVENTS.CTA_CLICKED, {
              cta_type: "support_contact_signup",
            });
            trackEvent(ANALYTICS_EVENTS.SIGNUP_STARTED, {
              source_surface: "support_contact",
            });
          }}
        >
          Create account
        </Button>
      </SignUpButton>
      <ProtectedAppCta
        href={ROUTES.CONTACT}
        variant="ghost"
        className="w-full sm:w-auto"
      >
        Open in-app contact (requires sign-in)
      </ProtectedAppCta>
    </div>
  );
}
