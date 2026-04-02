"use client";

import { useUser } from "@clerk/nextjs";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/posthog-client";
import posthog from "posthog-js";
import { useEffect } from "react";

const SIGNUP_CAPTURE_KEY_PREFIX = "foodedo_signup_completed_";
const SIGNIN_CAPTURE_KEY_PREFIX = "foodedo_signin_completed_session_";

function buildDisplayName(user: NonNullable<ReturnType<typeof useUser>["user"]>) {
  const fromFull = user.fullName?.trim();
  if (fromFull) return fromFull;
  const joined = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return joined || undefined;
}

export function PostHogIdentify() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !user) return;

    let cancelled = false;
    let frames = 0;
    const maxFrames = 600;

    const identifyWhenReady = () => {
      if (cancelled) return;
      const ready = posthog.__loaded || frames++ >= maxFrames;
      if (!ready) {
        requestAnimationFrame(identifyWhenReady);
        return;
      }

      posthog.identify(user.id, {
        email:
          user.primaryEmailAddress?.emailAddress ??
          user.emailAddresses[0]?.emailAddress,
        name: buildDisplayName(user),
        createdAt: user.createdAt
          ? new Date(user.createdAt).toISOString()
          : undefined,
      });

      const signupKey = `${SIGNUP_CAPTURE_KEY_PREFIX}${user.id}`;
      if (!window.localStorage.getItem(signupKey)) {
        trackEvent(ANALYTICS_EVENTS.SIGNUP_COMPLETED, {
          source_surface: "authenticated_app_load",
        });
        window.localStorage.setItem(signupKey, "1");
      }

      const signinKey = `${SIGNIN_CAPTURE_KEY_PREFIX}${user.id}`;
      if (!window.sessionStorage.getItem(signinKey)) {
        trackEvent(ANALYTICS_EVENTS.SIGNIN_COMPLETED, {
          source_surface: "authenticated_app_load",
        });
        window.sessionStorage.setItem(signinKey, "1");
      }
    };

    identifyWhenReady();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, user]);

  return null;
}
