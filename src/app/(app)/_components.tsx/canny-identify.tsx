"use client";

import { CANNY_BOARD_SLUGS, ROUTES } from "@/app/constants";
import { useUser } from "@clerk/nextjs";
import { MessageSquare } from "lucide-react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";

const cannyAppId = process.env.NEXT_PUBLIC_CANNY_APP_ID;
const cannyBoardUrl = process.env.NEXT_PUBLIC_CANNY_BOARD_URL;

export function getCannyBoardSlug(pathname: string): string | null {
  if (pathname.startsWith(ROUTES.IMPORT_RECIPE)) {
    return CANNY_BOARD_SLUGS.RECIPE_IMPORT_PARSING;
  }
  if (
    pathname.startsWith(ROUTES.MY_RECIPES) ||
    pathname.startsWith(ROUTES.RECIPE)
  ) {
    return CANNY_BOARD_SLUGS.RECIPES_ORGANISATION;
  }
  if (pathname.startsWith(ROUTES.HOUSEHOLDS)) {
    return CANNY_BOARD_SLUGS.HOUSEHOLD_SHARING;
  }
  if (pathname.startsWith(ROUTES.SHOPPING_LIST)) {
    return CANNY_BOARD_SLUGS.SHOPPING_LISTS;
  }
  if (pathname.startsWith(ROUTES.SUPPORT)) {
    return CANNY_BOARD_SLUGS.IDEAS_FEATURE_REQUESTS;
  }
  return null;
}

export function getCannyBoardUrl(pathname: string): string {
  if (!cannyBoardUrl) return "";
  const slug = getCannyBoardSlug(pathname);
  return slug ? `${cannyBoardUrl}/${slug}` : cannyBoardUrl;
}

type CannyFn = ((...args: unknown[]) => void) & { q?: unknown[] };

declare global {
  interface Window {
    Canny?: CannyFn;
  }
}

export function CannyIdentify() {
  const { user, isLoaded } = useUser();
  const [cannyReady, setCannyReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const canny = (globalThis as { Canny?: CannyFn }).Canny;
    if (typeof canny === "function" || (canny && "q" in canny)) {
      setCannyReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || !user || !cannyAppId || !cannyReady) return;
    if (typeof window === "undefined") return;
    if (typeof window.Canny !== "function") return;

    window.Canny("identify", {
      appID: cannyAppId,
      user: {
        id: user.id,
        name:
          user.fullName ??
          [user.firstName, user.lastName].filter(Boolean).join(" "),
        email:
          user.primaryEmailAddress?.emailAddress ??
          user.emailAddresses[0]?.emailAddress,
        avatarURL: user.imageUrl,
        created: user.createdAt
          ? new Date(user.createdAt).toISOString()
          : undefined,
      },
    });
  }, [cannyReady, isLoaded, user]);

  if (!cannyAppId) return null;

  return (
    <Script
      id="canny-sdk"
      strategy="afterInteractive"
      onLoad={() => setCannyReady(true)}
      onReady={() => setCannyReady(true)}
    >
      {`!function(w,d,i,s){function l(){if(!d.getElementById(i)){var f=d.getElementsByTagName(s)[0],e=d.createElement(s);e.type="text/javascript",e.async=!0,e.src="https://sdk.canny.io/sdk.js",f.parentNode.insertBefore(e,f)}}if("function"!=typeof w.Canny){var c=function(){c.q.push(arguments)};c.q=[],w.Canny=c,"complete"===d.readyState?l():w.attachEvent?w.attachEvent("onload",l):w.addEventListener("load",l,!1)}}(window,document,"canny-jssdk","script");`}
    </Script>
  );
}

export function CannyFeedbackButton() {
  const pathname = usePathname();
  const boardUrl = getCannyBoardUrl(pathname);

  if (!cannyAppId || !cannyBoardUrl) return null;

  return (
    <a
      data-canny-link
      href={boardUrl}
      rel="noreferrer noopener"
      target="_blank"
      aria-label="Leave feedback"
      className="ml-4 pointer-events-auto inline-flex items-center gap-1 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
    >
      <MessageSquare className="size-4" />
      <p>
        <span className="hidden sm:inline">Share </span>Feedback
      </p>
    </a>
  );
}
