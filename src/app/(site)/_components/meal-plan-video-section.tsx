"use client";

import { APP_NAME, ROUTES } from "@/app/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/posthog-client";
import { SignUpButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import { ArrowRight, CirclePlay, PlayCircle } from "lucide-react";
import { useRef } from "react";

export function MealPlanVideoSection() {
  const hasTrackedPlayRef = useRef(false);

  return (
    <section className="bg-muted/30">
      <div className="container mx-auto px-4 py-10 sm:py-12 max-w-6xl">
        <div className="grid gap-8 lg:gap-12 lg:grid-cols-12 items-center">
          <div className="lg:col-span-5 space-y-5">
            <Badge
              variant="secondary"
              className="w-fit bg-primary/10 text-primary border-primary/20"
            >
              <CirclePlay className="size-4 mr-2" />
              Watch the 60-second walkthrough
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
              See how easy it is to build your week.
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              This quick walkthrough shows how {APP_NAME} generates a balanced
              weekly meal plan and turns it into a practical shopping list in a
              few taps.
            </p>
            <div className="pt-1">
              <Authenticated>
                <Button asChild size="lg" className="text-base sm:text-lg px-7">
                  <a
                    href={ROUTES.MEAL_PLAN}
                    onClick={() => {
                      trackEvent(ANALYTICS_EVENTS.CTA_CLICKED, {
                        cta_type: "home_video_go_to_meal_plan",
                        intent_topic: "home",
                      });
                    }}
                  >
                    Try it in your dashboard
                    <ArrowRight className="ml-2 size-5" />
                  </a>
                </Button>
              </Authenticated>
              <Unauthenticated>
                <SignUpButton
                  mode="modal"
                  forceRedirectUrl={ROUTES.DASHBOARD_AFTER_SIGNUP}
                >
                  <Button
                    size="lg"
                    className="text-base sm:text-lg px-7"
                    onClick={() => {
                      trackEvent(ANALYTICS_EVENTS.CTA_CLICKED, {
                        cta_type: "home_video_join_beta",
                        intent_topic: "home",
                      });
                      trackEvent(ANALYTICS_EVENTS.SIGNUP_STARTED, {
                        source_surface: "home_video_section",
                      });
                    }}
                  >
                    Join free beta
                    <ArrowRight className="ml-2 size-5" />
                  </Button>
                </SignUpButton>
              </Unauthenticated>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="relative rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-background/70">
                <PlayCircle className="size-4 text-primary shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Click play to watch the narrated product walkthrough.
                </p>
              </div>
              <video
                className="w-full h-auto aspect-video bg-black"
                controls
                preload="metadata"
                playsInline
                aria-label="Narrated walkthrough showing how to generate a meal plan in Foodedo"
                onPlay={() => {
                  if (hasTrackedPlayRef.current) return;
                  hasTrackedPlayRef.current = true;
                  trackEvent(ANALYTICS_EVENTS.SECONDARY_ACTION_TAKEN, {
                    action_name: "home_video_play_started",
                    source_surface: "home_video_section",
                  });
                }}
              >
                <source src="/meal-plan-guide.mp4" type="video/mp4" />
                Sorry, your browser does not support embedded videos.
              </video>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
