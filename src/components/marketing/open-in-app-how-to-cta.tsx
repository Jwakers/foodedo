"use client";

import { ROUTES } from "@/app/constants";
import { ProtectedAppCta } from "@/components/marketing/protected-app-cta";

/** Logged-out users sign up first; logged-in users go to the in-app how-to. */
export function OpenInAppHowToCta() {
  return (
    <ProtectedAppCta
      href={ROUTES.SUPPORT_HOW_TO}
      postSignupTarget={ROUTES.DASHBOARD_AFTER_SIGNUP}
      variant="outline"
      size="lg"
    >
      Open full guide in app
    </ProtectedAppCta>
  );
}
