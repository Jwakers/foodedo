"use client";

import { useUser } from "@clerk/nextjs";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import posthog from "posthog-js";
import { useEffect } from "react";

const SIGNUP_CAPTURE_KEY_PREFIX = "foodedo_signup_completed_";
const SIGNIN_CAPTURE_KEY_PREFIX = "foodedo_signin_completed_session_";

export function PostHogIdentify() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !user) return;
    if (!posthog.__loaded) return;

    posthog.identify(user.id, {
      email:
        user.primaryEmailAddress?.emailAddress ??
        user.emailAddresses[0]?.emailAddress,
      name:
        user.fullName ??
        [user.firstName, user.lastName].filter(Boolean).join(" ") ??
        undefined,
      createdAt: user.createdAt
        ? new Date(user.createdAt).toISOString()
        : undefined,
    });

    // First authenticated app load for a user acts as signup completion proxy.
    const signupKey = `${SIGNUP_CAPTURE_KEY_PREFIX}${user.id}`;
    if (!window.localStorage.getItem(signupKey)) {
      posthog.capture(ANALYTICS_EVENTS.SIGNUP_COMPLETED, {
        source_surface: "authenticated_app_load",
      });
      window.localStorage.setItem(signupKey, "1");
    }

    // Capture sign-in completion once per browser session.
    const signinKey = `${SIGNIN_CAPTURE_KEY_PREFIX}${user.id}`;
    if (!window.sessionStorage.getItem(signinKey)) {
      posthog.capture(ANALYTICS_EVENTS.SIGNIN_COMPLETED, {
        source_surface: "authenticated_app_load",
      });
      window.sessionStorage.setItem(signinKey, "1");
    }
  }, [isLoaded, user]);

  return null;
}
