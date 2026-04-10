"use client";

import { APP_NAME, ROUTES } from "@/app/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PricingTable, SignUpButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Authenticated, Unauthenticated } from "convex/react";
import {
  ArrowLeft,
  ArrowRight,
  ChefHat,
  ClipboardList,
  ShoppingCart,
  Sparkles,
  Users,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";

export default function PricingPage() {
  const { resolvedTheme } = useTheme();
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href={ROUTES.HOME}>
            <ArrowLeft className="mr-2 size-4" />
            Back to Home
          </Link>
        </Button>

        <div className="space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <Badge
              variant="secondary"
              className="w-fit bg-primary/10 text-primary border-primary/20 text-sm px-4 py-2 mx-auto"
            >
              <Sparkles className="size-4 mr-2" />
              Beta
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We&apos;re currently in beta. Everyone gets access to all
              features, including premium, with no plan limits while we build.
            </p>
          </div>

          {/* Pricing Card */}
          <div className="max-w-md mx-auto">
            <PricingTable
              checkoutProps={{
                appearance: {
                  elements: {
                    drawerRoot: {
                      zIndex: 50,
                    },
                  },
                },
              }}
              appearance={{
                theme: resolvedTheme === "dark" ? dark : undefined,
              }}
            />
          </div>

          {/* Beta Information */}
          <div className="max-w-3xl mx-auto">
            <Card className="bg-muted/50">
              <CardContent className="p-8 space-y-4">
                <h3 className="text-xl font-semibold text-center">
                  About Our Beta
                </h3>
                <div className="space-y-3 text-muted-foreground">
                  <p>
                    {APP_NAME} is currently in beta. During this time, everyone
                    gets access to all features, including premium. There are
                    no plan limits. Your feedback is invaluable as we improve
                    and refine the platform.
                  </p>
                  <p className="font-medium text-foreground">
                    Join now and use everything we offer. We&apos;ll share
                    updates when plans change in the future.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Features Grid */}
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-center">
              Everything You Need
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-center p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <ChefHat className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">
                  Recipe Management
                </h3>
                <p className="text-sm text-muted-foreground">
                  Create, import, and organize all your favorite recipes in one
                  place
                </p>
              </Card>

              <Card className="text-center p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Shopping Lists</h3>
                <p className="text-sm text-muted-foreground">
                  Generate smart, organized shopping lists from your meal plans
                </p>
              </Card>

              <Card className="text-center p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">
                  Kitchen Chalkboard
                </h3>
                <p className="text-sm text-muted-foreground">
                  Quick notes and reminders shared with your household
                </p>
              </Card>

              <Card className="text-center p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Family Sync</h3>
                <p className="text-sm text-muted-foreground">
                  Collaborate with household members on recipes and shopping
                </p>
              </Card>
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center space-y-6 py-12">
            <h2 className="text-3xl font-bold">
              Ready for weekly meal plans in one click?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join {APP_NAME} in beta. Balanced weeks, smart shopping lists, and
              your household in one place.
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
      </div>
    </div>
  );
}
