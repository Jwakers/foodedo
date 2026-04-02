"use client";

import { ROUTES } from "@/app/constants";
import { Button } from "@/components/ui/button";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/posthog-client";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";

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
      <SignUpButton mode="modal">
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
      <Button variant="ghost" asChild className="w-full sm:w-auto">
        <Link href={ROUTES.CONTACT}>
          Open in-app contact (requires sign-in)
        </Link>
      </Button>
    </div>
  );
}
