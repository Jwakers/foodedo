"use client";

import { APP_NAME, ROUTES } from "@/app/constants";
import InstallPrompt from "@/components/installation-prompt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { BalanceVarietySection } from "@/app/(site)/_components/balance-variety-section";
import { ExampleWeekSection } from "@/app/(site)/_components/example-week-section";
import { HowItPlansSection } from "@/app/(site)/_components/how-it-plans-section";

const HERO_IMAGE = "/hero-2.png";

const CTA_BUTTON_CLASSES =
  "text-lg px-8 py-4 h-auto shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto";

export default function HomeContent() {
  return (
    <div className="flex flex-col">
      {/* Hero Section — split layout: copy on solid background, image as featured visual */}
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
              Now in Beta — Free to use
            </Badge>

            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-[1.1]">
                <span className="text-foreground">No more Sunday night</span>
                <br />
                <span className="text-primary">meal-planning scramble.</span>
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                We build your week so you don&apos;t have to. One tap, balanced
                variety — then tweak as you like.
              </p>

              <div className="flex justify-center lg:justify-start gap-1.5 pt-1" aria-hidden>
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div
                    key={i}
                    className="size-2 rounded-full bg-primary/30"
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
              <Authenticated>
                <Button
                  asChild
                  size="lg"
                  className={CTA_BUTTON_CLASSES}
                >
                  <Link href={ROUTES.DASHBOARD}>
                    Try for free
                    <ArrowRight className="ml-2 size-5" />
                  </Link>
                </Button>
              </Authenticated>
              <Unauthenticated>
                <SignUpButton mode="modal">
                  <Button
                    size="lg"
                    className={CTA_BUTTON_CLASSES}
                  >
                    Try for free
                    <ArrowRight className="ml-2 size-5" />
                  </Button>
                </SignUpButton>
              </Unauthenticated>
              <a
                href="#how-it-plans"
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 sm:py-2"
              >
                See how it works
              </a>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-6 text-sm text-muted-foreground pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="size-4 text-primary shrink-0" />
                <span>No credit card required</span>
              </div>
              <div className="hidden sm:block size-1 bg-muted-foreground/30 rounded-full" />
              <div className="flex items-center gap-2">
                <CheckCircle className="size-4 text-primary shrink-0" />
                <span>Start planning today</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Hero 2 image as featured visual — no text overlay */}
        <div className="flex-1 relative flex items-center justify-center bg-muted/40 min-h-[50vh] lg:min-h-0 lg:pr-[max(1rem,calc((100vw-1200px)/2))] lg:pl-4">
          <div className="relative w-full max-w-2xl aspect-4/3 lg:aspect-6/5 mx-4 lg:mx-0">
            <div className="absolute inset-0 rounded-2xl lg:rounded-3xl overflow-hidden shadow-xl ring-1 ring-black/5 lg:shadow-2xl lg:-rotate-1">
              <Image
                src={HERO_IMAGE}
                alt="Kitchen counter with fresh herbs, lemons, and a meal-planning app on a tablet"
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

      <div className="container mt-4">
        <InstallPrompt />
      </div>

      {/* Beta callout */}
      <section className="container mx-auto px-4 my-8">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 text-center max-w-2xl mx-auto">
          <h2 className="font-semibold text-foreground mb-2">
            We&apos;re in beta
          </h2>
          <p className="text-muted-foreground text-sm">
            Every feature is free while we build. Your feedback shapes what we
            do next.{" "}
            <Link
              href="/beta"
              className="text-primary hover:text-primary/80 underline underline-offset-2"
            >
              Learn more about the beta
            </Link>
          </p>
        </div>
      </section>

      <HowItPlansSection />
      <BalanceVarietySection />
      <ExampleWeekSection />

      {/* What feeds your plan */}
      <section id="features" className="py-20 bg-muted/30 scroll-mt-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Everything that feeds your plan
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Recipes, household, and shopping — all in service of your week.
            </p>
          </div>

          {/* 1. Meal planning + shopping — lead, two columns */}
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
                  Generate a meal plan in one tap, or build it yourself. Add
                  meals from your recipes, then generate a shopping list from the
                  plan. Check off as you go.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href={ROUTES.MEAL_PLAN}>Meal planning</Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="ml-2">
                  <Link href={ROUTES.SHOPPING_LIST}>Shopping list</Link>
                </Button>
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
                  A shared chalkboard for &quot;need by end of week&quot; —
                  milk, olive oil, tin foil. So the basics don&apos;t get
                  missed.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href={ROUTES.CHALKBOARD}>Chalkboard</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* 2. Import from websites — image right */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold">
                Sick of scrolling past a novel to get to the recipe?
              </h3>
              <p className="text-muted-foreground">
                Paste a URL and we pull the recipe into {APP_NAME}. Straight to
                the point every time — no life stories, no endless scroll. Then
                save it and tweak it to make it yours.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href={ROUTES.IMPORT_RECIPE}>Import a recipe</Link>
              </Button>
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

          {/* 3. Recipe books + create your own — image left */}
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
              <Button asChild variant="outline" size="sm">
                <Link href={ROUTES.IMPORT_RECIPE}>Add a recipe</Link>
              </Button>
            </div>
          </div>

          {/* 4. Customise every recipe — image right */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold">
                One-size-fits-all recipes that don&apos;t fit your kitchen?
              </h3>
              <p className="text-muted-foreground">
                Edit ingredients, steps, and notes so every recipe is yours.
                Half the sugar, double the garlic — your way.
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

          {/* 5. Household sharing — image left */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
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
              <Button asChild variant="outline" size="sm">
                <Link href={ROUTES.HOUSEHOLDS}>Households</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why this helps */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-2xl font-bold mb-4">
            No more end-of-week decision fatigue.
          </h2>
          <p className="text-muted-foreground">
            Your week is already decided. Less stress, more time for the parts you
            enjoy. {APP_NAME} builds your week so you can focus on cooking.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Try for free
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Authenticated>
                <Button asChild size="lg" className="text-lg px-8">
                  <Link href={ROUTES.DASHBOARD}>
                    Go to Dashboard
                    <ArrowRight className="ml-2 size-5" />
                  </Link>
                </Button>
              </Authenticated>
              <Unauthenticated>
                <SignUpButton mode="modal">
                  <Button size="lg" className="text-lg px-8">
                    Try for free
                    <ArrowRight className="ml-2 size-5" />
                  </Button>
                </SignUpButton>
              </Unauthenticated>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
