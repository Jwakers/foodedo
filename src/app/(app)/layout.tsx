import { APP_NAME } from "@/app/constants";
import { Metadata } from "next";
import {
  CannyFeedbackButton,
  CannyIdentify,
} from "./_components.tsx/canny-identify";
import { Header } from "./_components.tsx/header";
import { Navbar } from "./_components.tsx/navbar";

export const metadata: Metadata = {
  title: {
    template: `%s | ${APP_NAME}`,
    default: APP_NAME,
  },
  description: `${APP_NAME} - Family Meal Planning`,
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
      <div className="grid grid-rows-[auto_1fr_auto] min-h-dvh">
        <Header />
        <main className="w-full min-w-0">{children}</main>
        <div className="sticky pointer-events-none bottom-0 z-10 flex flex-col gap-2 items-start">
          <CannyFeedbackButton />
          <div className="pointer-events-auto">
            <Navbar />
          </div>
        </div>
      </div>
    </div>
  );
}
