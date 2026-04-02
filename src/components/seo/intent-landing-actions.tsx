"use client";

import { APP_NAME, ROUTES } from "@/app/constants";
import InstallPrompt from "@/components/installation-prompt";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SignUpButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const CTA_CLASSES =
  "text-base px-6 py-3 h-auto shadow-md hover:shadow-lg transition-all duration-300 w-full sm:w-auto";

type IntentLandingActionsProps = {
  secondaryHref: string;
  secondaryLabel: string;
  /** Show PWA install block (default true). Set false on repeated CTAs lower on the page. */
  showInstall?: boolean;
};

/**
 * Primary: sign up (unauthenticated) or dashboard (authenticated).
 * Secondary: usually Discover or FAQ.
 * Install: PWA install prompt for organic landing pages.
 */
export function IntentLandingActions({
  secondaryHref,
  secondaryLabel,
  showInstall = true,
}: IntentLandingActionsProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <Authenticated>
          <Button asChild size="lg" className={cn(CTA_CLASSES)}>
            <Link href={ROUTES.DASHBOARD}>
              Open {APP_NAME}
              <ArrowRight className="ml-2 size-5" />
            </Link>
          </Button>
        </Authenticated>
        <Unauthenticated>
          <SignUpButton mode="modal">
            <Button size="lg" className={CTA_CLASSES}>
              Try for free
              <ArrowRight className="ml-2 size-5" />
            </Button>
          </SignUpButton>
        </Unauthenticated>
        <Button variant="outline" size="lg" className={CTA_CLASSES} asChild>
          <Link href={secondaryHref}>{secondaryLabel}</Link>
        </Button>
      </div>
      {showInstall ? (
        <div className="rounded-xl border bg-muted/30 p-4">
          <p className="text-sm font-medium text-foreground mb-2">
            Install on your phone
          </p>
          <p className="text-sm text-muted-foreground mb-3">
            Add {APP_NAME} to your home screen for a focused cooking and planning
            experience.
          </p>
          <InstallPrompt />
        </div>
      ) : null}
    </div>
  );
}
