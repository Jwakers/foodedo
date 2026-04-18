"use client";

import { ROUTES } from "@/app/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SignUpButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import Link from "next/link";
import type { ComponentProps } from "react";

type ButtonProps = ComponentProps<typeof Button>;

type ProtectedAppCtaProps = {
  /** In-app route (e.g. meal plan). Logged-out users sign up and land on `DASHBOARD_AFTER_SIGNUP`. */
  href: string;
  children: React.ReactNode;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
};

/**
 * Logged-in: link into the app. Logged-out: open Clerk sign-up and continue with
 * post-sign-up onboarding routing (meal plan nudge when no current plan).
 */
export function ProtectedAppCta({
  href,
  children,
  variant = "outline",
  size = "sm",
  className,
}: ProtectedAppCtaProps) {
  return (
    <>
      <Authenticated>
        <Button asChild variant={variant} size={size} className={cn(className)}>
          <Link href={href}>{children}</Link>
        </Button>
      </Authenticated>
      <Unauthenticated>
        <SignUpButton
          mode="modal"
          forceRedirectUrl={ROUTES.DASHBOARD_AFTER_SIGNUP}
        >
          <Button variant={variant} size={size} className={cn(className)}>
            {children}
          </Button>
        </SignUpButton>
      </Unauthenticated>
    </>
  );
}
