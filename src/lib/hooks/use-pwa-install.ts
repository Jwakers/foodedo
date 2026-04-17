"use client";

import { APP_NAME } from "@/app/constants";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/posthog-client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export type PwaInstallSurface =
  | "global_banner"
  | "homepage_card"
  | "intent_landing"
  | "beta_page";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type DeferredPrompt = {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

type UsePwaInstallOptions = {
  surface: PwaInstallSurface;
};

export function usePwaInstall({ surface }: UsePwaInstallOptions) {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredPrompt | null>(
    null,
  );
  const installShownSentRef = useRef(false);
  const deferredPromptRef = useRef(deferredPrompt);
  deferredPromptRef.current = deferredPrompt;

  useEffect(() => {
    const ua = navigator.userAgent;
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(ua) ||
      (ua.includes("Mac") && "ontouchend" in window);
    const standaloneMedia = window.matchMedia(
      "(display-mode: standalone)",
    ).matches;
    const iosStandalone =
      typeof (navigator as unknown as { standalone?: boolean }).standalone ===
        "boolean" &&
      (navigator as unknown as { standalone?: boolean }).standalone;
    const isStandaloneMode = Boolean(standaloneMedia || iosStandalone);

    setIsIOS(isIOSDevice);
    setIsStandalone(isStandaloneMode);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const bip = e as unknown as BeforeInstallPromptEvent;
      setDeferredPrompt(bip);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const installContext = isIOS ? "ios" : "non_ios";
  const hasDeferredPrompt = Boolean(deferredPrompt);

  useEffect(() => {
    if (isStandalone || installShownSentRef.current) return;

    if (isIOS) {
      trackEvent(ANALYTICS_EVENTS.INSTALL_PROMPT_SHOWN, {
        install_context: installContext,
        has_deferred_prompt: false,
        surface,
      });
      installShownSentRef.current = true;
      return;
    }

    if (deferredPrompt) {
      trackEvent(ANALYTICS_EVENTS.INSTALL_PROMPT_SHOWN, {
        install_context: installContext,
        has_deferred_prompt: true,
        surface,
      });
      installShownSentRef.current = true;
      return;
    }

    const id = window.setTimeout(() => {
      if (installShownSentRef.current) return;
      if (deferredPromptRef.current) return;
      trackEvent(ANALYTICS_EVENTS.INSTALL_PROMPT_SHOWN, {
        install_context: installContext,
        has_deferred_prompt: false,
        surface,
      });
      installShownSentRef.current = true;
    }, 1000);
    return () => clearTimeout(id);
  }, [deferredPrompt, installContext, isIOS, isStandalone, surface]);

  const requestInstall = useCallback(async () => {
    trackEvent(ANALYTICS_EVENTS.INSTALL_PROMPT_CLICKED, {
      install_context: installContext,
      has_deferred_prompt: hasDeferredPrompt,
      surface,
    });

    const prompt = deferredPromptRef.current;
    if (prompt) {
      try {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;

        if (outcome === "accepted") {
          trackEvent(ANALYTICS_EVENTS.INSTALL_PROMPT_OUTCOME, {
            outcome: "accepted",
            install_context: installContext,
            has_deferred_prompt: hasDeferredPrompt,
            surface,
          });
          toast.success("App installed successfully", {
            description: `${APP_NAME} has been added to your home screen. Enjoy the app experience!`,
          });
        } else {
          trackEvent(ANALYTICS_EVENTS.INSTALL_PROMPT_OUTCOME, {
            outcome: "dismissed",
            install_context: installContext,
            has_deferred_prompt: hasDeferredPrompt,
            surface,
          });
          toast.info("Installation cancelled", {
            description:
              "You can install the app anytime using the browser menu.",
          });
        }
      } catch (error) {
        console.error("Install prompt error:", error);
        toast.error("Installation failed", {
          description: "There was an error with the installation prompt.",
        });
      } finally {
        setDeferredPrompt(null);
      }
      return;
    }

    trackEvent(ANALYTICS_EVENTS.INSTALL_PROMPT_OUTCOME, {
      outcome: "manual_fallback",
      install_context: installContext,
      has_deferred_prompt: false,
      surface,
    });
    toast.info("Manual installation required", {
      description:
        "Click the install icon in your browser's address bar or use the browser menu to install this app.",
      action: {
        label: "Learn More",
        onClick: () => {
          window.open(
            "https://support.google.com/chrome/answer/9658361",
            "_blank",
            "noopener,noreferrer",
          );
        },
      },
    });
  }, [hasDeferredPrompt, installContext, surface]);

  return {
    isIOS,
    isStandalone,
    deferredPrompt,
    hasDeferredPrompt,
    installContext,
    requestInstall,
  };
}
