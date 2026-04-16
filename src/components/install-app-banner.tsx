"use client";

import { APP_NAME } from "@/app/constants";
import { PwaInstallIosSteps } from "@/components/pwa-install-ios-steps";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { usePwaInstall } from "@/lib/hooks/use-pwa-install";
import { cn } from "@/lib/utils";
import { Download, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

export const INSTALL_BANNER_DISMISS_KEY = "foodedo_install_banner_dismissed_v1";

type InstallAppBannerProps = {
  placement: "site" | "app";
};

export function InstallAppBanner({ placement }: InstallAppBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const { isIOS, isStandalone, hasDeferredPrompt, requestInstall } =
    usePwaInstall({ surface: "global_banner" });

  useEffect(() => {
    try {
      if (window.localStorage.getItem(INSTALL_BANNER_DISMISS_KEY) === "1") {
        setDismissed(true);
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(INSTALL_BANNER_DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  };

  if (!hydrated || isStandalone || dismissed) {
    return null;
  }

  return (
    <aside
      aria-label={`Install ${APP_NAME}`}
      className={cn(
        "w-full border-b border-primary/15 bg-muted/30 backdrop-blur-md supports-backdrop-filter:bg-muted/20",
        placement === "site" && "sticky top-16 z-40",
        placement === "app" && "z-30",
      )}
    >
      <div className="container flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-2.5">
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Smartphone className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Install {APP_NAME}
            </p>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {isIOS
                ? "Add to your Home Screen for quick access and a focused app experience."
                : hasDeferredPrompt
                  ? "Install for quick access from your home screen or app launcher."
                  : "Use your browser’s install option to add this site as an app."}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={handleDismiss}
          >
            Not now
          </Button>
          {isIOS ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button type="button" size="sm" className="gap-1.5">
                  <Download className="size-4" />
                  Install
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[85dvh] gap-0">
                <SheetHeader className="text-left">
                  <SheetTitle>Add {APP_NAME} on iPhone or iPad</SheetTitle>
                  <SheetDescription>
                    Safari does not offer a single-tap install for web apps. Open
                    your browser menu, then use Share and Add to Home Screen.
                  </SheetDescription>
                </SheetHeader>
                <div className="overflow-y-auto px-4 pb-6">
                  <PwaInstallIosSteps className="pt-2" />
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={() => void requestInstall()}
            >
              <Download className="size-4" />
              {hasDeferredPrompt ? `Install ${APP_NAME}` : "Install help"}
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
