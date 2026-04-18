"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SignUpButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import Link from "next/link";
import type { ComponentProps } from "react";

type ButtonProps = ComponentProps<typeof Button>;

type ProtectedAppCtaProps = {
  /** In-app route for signed-in users (e.g. meal plan). */
  href: string;
  /** Clerk `forceRedirectUrl` after sign-up from this CTA (e.g. onboarding dashboard). */
  postSignupTarget: string;
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
  postSignupTarget,
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
        <SignUpButton mode="modal" forceRedirectUrl={postSignupTarget}>
          <Button variant={variant} size={size} className={cn(className)}>
            {children}
          </Button>
        </SignUpButton>
      </Unauthenticated>
    </>
  );
}
