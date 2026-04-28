"use client";

import { BalanceVarietySection } from "@/app/(site)/_components/balance-variety-section";
import { ExampleWeekSection } from "@/app/(site)/_components/example-week-section";
import { HowItPlansSection } from "@/app/(site)/_components/how-it-plans-section";
import { MealPlanVideoSection } from "@/app/(site)/_components/meal-plan-video-section";
import { APP_NAME, ROUTES } from "@/app/constants";
import { PublicPageTracker } from "@/components/analytics/public-page-tracker";
import { ProtectedAppCta } from "@/components/marketing/protected-app-cta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/posthog-client";
import type { HomepageShowcaseRecipe } from "@/lib/homepage-showcase-recipes";
import { cn } from "@/lib/utils";
import { SignUpButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle,
  ClipboardList,
  Sparkles,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const HERO_IMAGE = "/hero-2.png";

const CTA_BUTTON_CLASSES =
  "text-lg px-8 py-4 h-auto shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto";

type HomeContentProps = {
  showcaseRecipes?: HomepageShowcaseRecipe[];
};

export default function HomeContent({
  showcaseRecipes = [],
}: HomeContentProps) {
  return (
    <div className="flex flex-col space-y-8 sm:space-y-12 lg:space-y-16">
      <PublicPageTracker
        event={ANALYTICS_EVENTS.LANDING_VIEWED}
        props={{ intent_topic: "home" }}
      />
      {/* Hero: split layout, copy left and image right */}
      <section className="relative min-h-[85vh] flex flex-col lg:flex-row lg:min-h-[90vh]">
        {/* Left: copy on readable background */}
        <div className="flex-1 flex items-center justify-center bg-background px-4 py-16 lg:py-24 lg:pl-[max(1rem,calc((100vw-1200px)/2))] lg:pr-8">
          <div className="w-full max-w-xl lg:max-w-none space-y-8 text-center lg:text-left">
            <Badge
              variant="secondary"
              className={cn(
                "w-fit bg-primary/10 text-primary border-primary/20 text-sm px-4 py-2",
              )}
            >
              <Sparkles className="size-4 mr-2" />
              Open beta, free. We want your feedback.
            </Badge>

            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-[1.1]">
                <span className="text-foreground">
                  Stop wondering what to cook every day.
                </span>
                <br />
                <span className="text-primary">
                  Your week of meals, decided in one click.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-foreground/90 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                Build a balanced week in one click from our curated catalog (and
                anything you save), then turn it into a shopping list you can
                shop from and share with your household.
              </p>

              <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Add your own recipes whenever you like. Free while we&apos;re in
                beta. Your feedback shapes what we build.{" "}
                <Link
                  href={ROUTES.BETA}
                  className="text-primary hover:text-primary/80 underline underline-offset-2"
                >
                  Learn more about the beta
                </Link>
                .
              </p>

              <div
                className="flex justify-center lg:justify-start gap-1.5 pt-1"
                aria-hidden
              >
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className="size-2 rounded-full bg-primary/30" />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 justify-center lg:justify-start items-stretch sm:max-w-xl lg:max-w-none">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center sm:flex-wrap justify-center lg:justify-start">
                <Authenticated>
                  <Button asChild size="lg" className={CTA_BUTTON_CLASSES}>
                    <Link href={ROUTES.DASHBOARD}>
                      Go to dashboard
                      <ArrowRight className="ml-2 size-5" />
                    </Link>
                  </Button>
                </Authenticated>
                <Unauthenticated>
                  <SignUpButton
                    mode="modal"
                    forceRedirectUrl={ROUTES.DASHBOARD_AFTER_SIGNUP}
                  >
                    <Button
                      size="lg"
                      className={CTA_BUTTON_CLASSES}
                      onClick={() => {
                        trackEvent(ANALYTICS_EVENTS.CTA_CLICKED, {
                          cta_type: "home_hero_join_beta",
                          intent_topic: "home",
                        });
                        trackEvent(ANALYTICS_EVENTS.SIGNUP_STARTED, {
                          source_surface: "home_hero",
                        });
                      }}
                    >
                      Join free beta
                      <ArrowRight className="ml-2 size-5" />
                    </Button>
                  </SignUpButton>
                </Unauthenticated>
                <a
                  href="#how-it-plans"
                  className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 sm:py-3 text-center sm:text-left sm:order-0 order-last"
                  onClick={() => {
                    trackEvent(ANALYTICS_EVENTS.SECONDARY_ACTION_TAKEN, {
                      action_name: "scroll_how_it_works",
                      source_surface: "home_hero",
                    });
                  }}
                >
                  See how it works
                </a>
              </div>

              <Unauthenticated>
                <p className="text-sm text-muted-foreground text-center lg:text-left">
                  Then generate your week in one click.
                </p>
              </Unauthenticated>

              <div className="flex flex-col gap-2 text-sm text-muted-foreground pt-1">
                <div className="flex items-center gap-2 justify-center lg:justify-start">
                  <CheckCircle className="size-4 text-primary shrink-0" />
                  <span>Free while in beta</span>
                </div>
                <div className="flex items-center gap-2 justify-center lg:justify-start">
                  <CheckCircle className="size-4 text-primary shrink-0" />
                  <span>No credit card required</span>
                </div>
                <Unauthenticated>
                  <div className="flex items-center gap-2 justify-center lg:justify-start">
                    <CheckCircle className="size-4 text-primary shrink-0" />
                    <span>Takes seconds to get started</span>
                  </div>
                </Unauthenticated>
                <Authenticated>
                  <div className="flex items-center gap-2 justify-center lg:justify-start">
                    <CheckCircle className="size-4 text-primary shrink-0" />
                    <span>Open to everyone. Tell us what to improve.</span>
                  </div>
                </Authenticated>
              </div>
            </div>
          </div>
        </div>

        {/* Right: hero image, no text overlay */}
        <div className="flex-1 relative flex items-center justify-center bg-muted/40 lg:min-h-0 lg:pr-[max(1rem,calc((100vw-1200px)/2))] lg:pl-4">
          <div className="relative w-full max-w-2xl aspect-4/3 lg:aspect-6/5 mx-4 lg:mx-0">
            <div className="absolute inset-0 rounded-2xl lg:rounded-3xl overflow-hidden shadow-xl ring-1 ring-black/5 lg:shadow-2xl lg:-rotate-1">
              <Image
                src={HERO_IMAGE}
                alt="Kitchen counter with fresh produce and a tablet showing a weekly meal plan and shopping list in Foodedo"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            {/* Decorative corner accent */}
            <div
              className="absolute -bottom-3 -right-3 lg:-bottom-4 lg:-right-4 size-24 lg:size-32 rounded-2xl bg-primary/20 -z-10"
              aria-hidden
            />
          </div>
        </div>
      </section>

      <MealPlanVideoSection />

      <ExampleWeekSection recipes={showcaseRecipes} />

      <HowItPlansSection />
      <BalanceVarietySection />

      {/* What feeds your plan */}
      <section id="features" className="bg-muted/30 scroll-mt-20">
        <div className="container mx-auto px-4 py-12 sm:py-16 max-w-5xl">
          <div className="text-center mb-6 sm:mb-10">
            <h2 className="text-3xl font-bold mb-4">
              Everything that feeds your plan
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Recipes, household, and shopping, all in service of your week.
            </p>
          </div>

          {/* 1. Meal planning + shopping (lead, two columns) */}
          <div className="grid lg:grid-cols-2 gap-6 md:gap-12 items-stretch mb-20">
            <div className="relative p-6 pt-14 rounded-lg border border-border bg-card overflow-visible">
              <div
                className={cn(
                  "absolute top-4 right-4 size-12 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center",
                )}
              >
                <CalendarCheck className="size-6 text-primary" />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold pr-10">
                  Your week, then your shop
                </h3>
                <p className="text-muted-foreground">
                  Generate a full week in one click, or build it yourself. Mix
                  curated ideas with your own recipes and keep growing your
                  library over time, then generate a shopping list from the plan
                  and check items off as you go.
                </p>
                <p className="text-sm text-muted-foreground">
                  New here? Read{" "}
                  <Link
                    href={ROUTES.RECIPE_TO_SHOPPING_LIST}
                    className="text-primary underline underline-offset-4 hover:text-primary/85"
                  >
                    how to turn recipes into one shopping list
                  </Link>
                  {" or "}
                  <Link
                    href={ROUTES.COMBINE_RECIPES_INTO_ONE_GROCERY_LIST}
                    className="text-primary underline underline-offset-4 hover:text-primary/85"
                  >
                    combine multiple recipes into one grocery list
                  </Link>
                  {", "}
                  <Link
                    href={ROUTES.HOW_TO_CREATE_A_WEEKLY_MEAL_PLAN_FAST}
                    className="text-primary underline underline-offset-4 hover:text-primary/85"
                  >
                    plan your week quickly
                  </Link>
                  {", or "}
                  <Link
                    href={ROUTES.HOW_TO_PLAN_VARIED_MEALS_FOR_THE_WEEK}
                    className="text-primary underline underline-offset-4 hover:text-primary/85"
                  >
                    keep meals varied
                  </Link>
                  {"."}
                </p>
                <div className="flex flex-wrap gap-2">
                  <ProtectedAppCta
                    href={ROUTES.MEAL_PLAN}
                    postSignupTarget={ROUTES.DASHBOARD_AFTER_SIGNUP}
                    variant="outline"
                    size="sm"
                  >
                    Meal planning
                  </ProtectedAppCta>
                  <ProtectedAppCta
                    href={ROUTES.SHOPPING_LIST}
                    postSignupTarget={ROUTES.DASHBOARD_AFTER_SIGNUP}
                    variant="ghost"
                    size="sm"
                  >
                    Shopping list
                  </ProtectedAppCta>
                </div>
              </div>
            </div>
            <div className="relative p-6 pt-14 rounded-lg border border-border bg-card overflow-visible">
              <div
                className={cn(
                  "absolute top-4 right-4 size-12 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center",
                )}
              >
                <ClipboardList className="size-6 text-primary" />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold pr-10">
                  Always forgetting pantry staples by Friday?
                </h3>
                <p className="text-muted-foreground">
                  A shared chalkboard for &quot;need by end of week&quot;: milk,
                  olive oil, tin foil. So the basics don&apos;t get missed.
                </p>
                <ProtectedAppCta
                  href={ROUTES.CHALKBOARD}
                  postSignupTarget={ROUTES.DASHBOARD_AFTER_SIGNUP}
                  variant="outline"
                  size="sm"
                >
                  Chalkboard
                </ProtectedAppCta>
              </div>
            </div>
          </div>

          {/* 2. Import from websites, image right */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold">
                Sick of scrolling past a novel to get to the recipe?
              </h3>
              <p className="text-muted-foreground">
                Paste a URL and we pull the recipe into {APP_NAME}. Straight to
                the point every time: no life stories, no endless scroll. Then
                save it and tweak it to make it yours.
              </p>
              <p className="text-sm text-muted-foreground">
                Want the full guide? See our{" "}
                <Link
                  href={ROUTES.HOW_TO_MAKE_A_SHOPPING_LIST_FROM_RECIPES}
                  className="text-primary underline underline-offset-4 hover:text-primary/85"
                >
                  step-by-step guide from recipes to list
                </Link>
                , plus{" "}
                <Link
                  href={ROUTES.MEAL_PLANNING_FOR_BUSY_WEEKNIGHTS}
                  className="text-primary underline underline-offset-4 hover:text-primary/85"
                >
                  meal planning for busy weeknights
                </Link>
                .
              </p>
              <ProtectedAppCta
                href={ROUTES.IMPORT_RECIPE}
                postSignupTarget={ROUTES.DASHBOARD_AFTER_SIGNUP}
                variant="outline"
                size="sm"
              >
                Import a recipe
              </ProtectedAppCta>
            </div>
            <div className="relative aspect-16/10 w-full rounded-lg overflow-hidden border border-border">
              <Image
                src="/app-images/import-page.png"
                alt="Import a recipe from a URL in Foodedo"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* 3. Recipe books + create your own, image left */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 lg:order-1 relative aspect-16/10 w-full rounded-lg overflow-hidden border border-border">
              <Image
                src="/app-images/my-recipes.png"
                alt="My recipes and add recipe in Foodedo"
                fill
                className="object-cover"
              />
            </div>
            <div className="space-y-4 order-1 lg:order-2">
              <h3 className="text-2xl font-bold">
                Favourite recipes in books or in your head?
              </h3>
              <p className="text-muted-foreground">
                Snap a photo from a recipe book or type from scratch. One place
                for everything you love to cook.
              </p>
              <ProtectedAppCta
                href={ROUTES.IMPORT_RECIPE}
                postSignupTarget={ROUTES.DASHBOARD_AFTER_SIGNUP}
                variant="outline"
                size="sm"
              >
                Add a recipe
              </ProtectedAppCta>
            </div>
          </div>

          {/* 4. Customise every recipe, image right */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold">
                One-size-fits-all recipes that don&apos;t fit your kitchen?
              </h3>
              <p className="text-muted-foreground">
                Edit ingredients, steps, and notes so every recipe is yours.
                Half the sugar, double the garlic, your way.
              </p>
            </div>
            <div className="relative aspect-16/10 w-full rounded-lg overflow-hidden border border-border">
              <Image
                src="/app-images/recipe-page.png"
                alt="Edit a recipe to make it your own in Foodedo"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* 5. Household sharing, image left */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 relative aspect-16/10 w-full rounded-lg overflow-hidden border border-border">
              <Image
                src="/app-images/household-recipes.png"
                alt="Share recipes with your household in Foodedo"
                fill
                className="object-cover"
              />
            </div>
            <div className="space-y-4 order-1 lg:order-2">
              <div className="flex items-center gap-2">
                <Users className="size-6 text-primary" />
                <h3 className="text-2xl font-bold">
                  Nobody&apos;s on the same page about meals?
                </h3>
              </div>
              <p className="text-muted-foreground">
                Share recipes and meal ideas with your household. Plan and cook
                together so everyone knows what&apos;s for dinner.
              </p>
              <ProtectedAppCta
                href={ROUTES.HOUSEHOLDS}
                postSignupTarget={ROUTES.DASHBOARD_AFTER_SIGNUP}
                variant="outline"
                size="sm"
              >
                Households
              </ProtectedAppCta>
            </div>
          </div>
        </div>
      </section>

      {/* Why this helps */}
      <section className="bg-background">
        <div className="container mx-auto px-4 py-10 sm:py-12 text-center max-w-2xl">
          <h2 className="text-2xl font-bold mb-4">
            No more end-of-week decision fatigue.
          </h2>
          <p className="text-muted-foreground">
            Your week is already decided. Less stress, more time for the parts
            you enjoy. {APP_NAME} builds your week so you can focus on cooking.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-muted/30">
        <div className="container mx-auto px-4 py-12 sm:py-16 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Get early access
            </h2>
            <p className="text-lg text-muted-foreground mb-2">
              Your weekly meal plan and shopping list in one flow. Start with
              curated meals and add your own anytime.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Free while we&apos;re in beta. We read every bit of feedback.
            </p>
            <div className="flex flex-col items-center gap-3">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Authenticated>
                  <Button asChild size="lg" className="text-lg px-8">
                    <Link href={ROUTES.DASHBOARD}>
                      Go to dashboard
                      <ArrowRight className="ml-2 size-5" />
                    </Link>
                  </Button>
                </Authenticated>
                <Unauthenticated>
                  <SignUpButton
                    mode="modal"
                    forceRedirectUrl={ROUTES.DASHBOARD_AFTER_SIGNUP}
                  >
                    <Button
                      size="lg"
                      className="text-lg px-8"
                      onClick={() => {
                        trackEvent(ANALYTICS_EVENTS.CTA_CLICKED, {
                          cta_type: "home_footer_join_beta",
                          intent_topic: "home",
                        });
                        trackEvent(ANALYTICS_EVENTS.SIGNUP_STARTED, {
                          source_surface: "home_footer",
                        });
                      }}
                    >
                      Join free beta
                      <ArrowRight className="ml-2 size-5" />
                    </Button>
                  </SignUpButton>
                </Unauthenticated>
              </div>
              <Unauthenticated>
                <p className="text-sm text-muted-foreground">
                  Then generate your week in one click.
                </p>
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-6 gap-y-2 justify-center text-sm text-muted-foreground">
                  <span>Free while in beta</span>
                  <span>No credit card required</span>
                  <span>Takes seconds to get started</span>
                </div>
              </Unauthenticated>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
