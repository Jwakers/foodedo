"use client";

import { useUser } from "@clerk/nextjs";
import posthog from "posthog-js";
import { useEffect } from "react";

export function PostHogIdentify() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !user) return;

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
  }, [isLoaded, user]);

  return null;
}
