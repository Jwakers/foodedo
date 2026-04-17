"use client";

import { APP_NAME, ROUTES } from "@/app/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SignUpButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import { ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function BetaLandingPage() {
  return (
    <div className="flex flex-col gap-8 md:gap-16 pb-10">
      <section className="relative overflow-hidden py-10 md:py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5"></div>
        <div className="relative z-10 container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <Badge
              variant="secondary"
              className="w-fit bg-primary/10 text-primary border-primary/20 text-sm px-4 py-2 mx-auto"
            >
              This is a beta
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              {APP_NAME} Beta
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Build a repeatable meal planning rhythm for your household.
              We&apos;re looking for people who cook regularly and want to help
              shape the product through honest feedback.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
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
                    Join the Beta
                    <ArrowRight className="ml-2 size-5" />
                  </Button>
                </SignUpButton>
              </Unauthenticated>
            </div>

            <Unauthenticated>
              <p className="text-sm text-muted-foreground">
                Already have access?{" "}
                <Link
                  href={ROUTES.SIGN_IN}
                  className="text-primary hover:text-primary/80"
                >
                  Sign in here
                </Link>
                .
              </p>
            </Unauthenticated>
          </div>
        </div>
      </section>

      <section className="bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">What it does</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="size-5 text-primary mt-0.5" />
                  Create, edit, and organise recipes in one place.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="size-5 text-primary mt-0.5" />
                  Import recipes from websites and refine them to your taste.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="size-5 text-primary mt-0.5" />
                  Build shopping lists from recipes and check items as you shop.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="size-5 text-primary mt-0.5" />
                  Share recipes, lists, and chalkboard notes with a household.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="size-5 text-primary mt-0.5" />
                  Keep quick kitchen notes in the shared chalkboard.
                </li>
              </ul>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Who it’s for</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  Home cooks who want their recipes in one reliable place.
                </li>
                <li>
                  People who save recipes online and enjoy refining them over
                  time.
                </li>
                <li>Anyone who wants the recipe without the long scroll.</li>
                <li>
                  Households looking for a simpler weekly rhythm for shopping
                  and meals.
                </li>
              </ul>
            </Card>

            <Card className="p-6 border-primary/30">
              <h2 className="text-2xl font-semibold mb-3">This is a beta</h2>
              <p className="text-muted-foreground">
                Expect rapid iteration. Features will change based on feedback,
                and you can request new ones. Some features are still in
                progress, but the core app is ready for daily use.
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Getting started</h2>
              <ol className="space-y-3 text-muted-foreground list-decimal list-inside">
                <li>Sign up and add a few recipes you already love.</li>
                <li>Plan a week of meals and build your shopping list.</li>
                <li>Use {APP_NAME} as you normally would during the week.</li>
                <li>
                  Share feedback or feature requests whenever something stands
                  out.
                </li>
              </ol>
              <p className="mt-4 text-sm text-muted-foreground">
                We use feedback to shape what gets built next.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-2xl space-y-4">
            <h2 className="text-3xl font-bold">Ready to join the beta?</h2>
            <p className="text-muted-foreground">
              We&apos;re keeping the beta small so we can listen closely to
              feedback. Sign up to get started right away.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
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
                    Sign Up
                    <ArrowRight className="ml-2 size-5" />
                  </Button>
                </SignUpButton>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="text-lg px-8"
                >
                  <Link href={ROUTES.SIGN_IN}>Sign In</Link>
                </Button>
              </Unauthenticated>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
