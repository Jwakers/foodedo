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

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl opacity-30" />

        <div className="relative z-10 container mx-auto px-4 text-center max-w-4xl">
          <div className="space-y-8 py-4">
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
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                LESS PLANNING.
                <br />
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  MORE COOKING.
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Your recipes are scattered. The weekly shop is chaos. {APP_NAME}{" "}
                brings everything into one place so you can focus on the fun
                parts of cooking — not the admin.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Authenticated>
                <Button
                  asChild
                  size="lg"
                  className="text-lg px-8 py-4 h-auto shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Link href={ROUTES.DASHBOARD}>
                    Go to Dashboard
                    <ArrowRight className="ml-2 size-5" />
                  </Link>
                </Button>
              </Authenticated>
              <Unauthenticated>
                <SignUpButton mode="modal">
                  <Button
                    size="lg"
                    className="text-lg px-8 py-4 h-auto shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 size-5" />
                  </Button>
                </SignUpButton>
              </Unauthenticated>
              <a
                href="#features"
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                See how it works
              </a>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground pt-8">
              <div className="flex items-center gap-2">
                <CheckCircle className="size-4 text-primary" />
                <span>No credit card required</span>
              </div>
              <div className="hidden sm:block size-1 bg-muted-foreground/30 rounded-full" />
              <div className="flex items-center gap-2">
                <CheckCircle className="size-4 text-primary" />
                <span>Start planning today</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-20 left-10 size-16 bg-primary/20 rounded-2xl rotate-12 opacity-60" />
        <div className="absolute top-40 right-20 size-12 bg-accent/20 rounded-full opacity-60" />
        <div className="absolute bottom-32 left-20 size-20 bg-primary/15 rounded-3xl -rotate-12 opacity-60" />
        <div className="absolute bottom-20 right-10 size-14 bg-accent/15 rounded-2xl rotate-45 opacity-60" />
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

      {/* Features */}
      <section id="features" className="py-20 bg-muted/30 scroll-mt-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How we help</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              One place for your recipes, your week, and your household
            </p>
          </div>

          {/* 1. Import from websites — image right */}
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
            <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden border border-border">
              <Image
                src="/app-images/import-page.png"
                alt="Import a recipe from a URL in Foodedo"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* 2. Recipe books + create your own — image left */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 lg:order-1 relative aspect-[16/10] w-full rounded-lg overflow-hidden border border-border">
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

          {/* 3. Customise every recipe — image right */}
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
            <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden border border-border">
              <Image
                src="/app-images/recipe-page.png"
                alt="Edit a recipe to make it your own in Foodedo"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* 4. Household sharing — image left */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 lg:order-1 relative aspect-[16/10] w-full rounded-lg overflow-hidden border border-border">
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

          {/* 5 & 6. Meal planning + Chalkboard — two columns, no images */}
          <div className="grid lg:grid-cols-2 gap-6 md:gap-12 items-stretch">
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
                  Plan your week, then shop in one go
                </h3>
                <p className="text-muted-foreground">
                  Build a meal plan with an end date, add meals from your
                  recipes, then generate a shopping list from the plan. Or
                  create an ad-hoc list from any recipes. Check off as you go.
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
        </div>
      </section>

      {/* Why this helps */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-2xl font-bold mb-4">
            Less admin. Less stress. More time for the fun parts of cooking.
          </h2>
          <p className="text-muted-foreground">
            {APP_NAME} helps you get your recipes, your week, and your household
            in sync — so you can focus on what you actually enjoy.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Ready to make meal planning simple?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Get started free. No credit card required.
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
                    Get Started Free
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
