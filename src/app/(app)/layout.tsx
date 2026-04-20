import { APP_NAME } from "@/app/constants";
import { InstallAppBanner } from "@/components/install-app-banner";
import { SITE_DEFAULT_DESCRIPTION } from "@/lib/site-messaging";
import { Metadata } from "next";
import { AppFeedbackVisibilityProvider } from "./_components.tsx/app-feedback-visibility";
import {
  CannyFeedbackButton,
  CannyIdentify,
} from "./_components.tsx/canny-identify";
import { CurrentMealPlanProvider } from "./_components.tsx/current-meal-plan-context";
import { Header } from "./_components.tsx/header";
import { Navbar } from "./_components.tsx/navbar";
import { PostHogIdentify } from "./_components.tsx/posthog-identify";

export const metadata: Metadata = {
  title: {
    template: `%s | ${APP_NAME}`,
    default: APP_NAME,
  },
  description: SITE_DEFAULT_DESCRIPTION,
  robots: {
    index: false,
    follow: true,
  },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="bg-background safe-area-inset relative"
      data-vaul-drawer-wrapper="true"
    >
      <CannyIdentify />
      <PostHogIdentify />
      <AppFeedbackVisibilityProvider>
        <CurrentMealPlanProvider>
          <div className="grid grid-rows-[auto_auto_1fr_auto] min-h-dvh">
            <Header />
            <InstallAppBanner placement="app" />
            <main className="w-full min-w-0">{children}</main>
            <div className="sticky pointer-events-none bottom-0 z-10 flex flex-col gap-2 items-start">
              <CannyFeedbackButton />
              <div className="pointer-events-auto w-full">
                <Navbar />
              </div>
            </div>
          </div>
        </CurrentMealPlanProvider>
      </AppFeedbackVisibilityProvider>
    </div>
  );
}
