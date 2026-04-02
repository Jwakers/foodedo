"use client";

import { APP_NAME } from "@/app/constants";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignUp } from "@clerk/nextjs";
import {
  ArrowLeft,
  Calendar,
  Heart,
  ShoppingCart,
  Sparkles,
  Users,
  Utensils,
} from "lucide-react";
import Link from "next/link";

/**
 * Optional catch-all enables Clerk path callbacks (e.g. /sign-up/sso-callback)
 * while still serving the same sign-up UI on /sign-up.
 */
export default function SignUpCatchAllPage() {
  return (
    <div className="lg:grid lg:grid-cols-2 min-h-screen">
      {/* Left Side - Image/Illustration */}
      <div className="hidden lg:flex lg:flex-1 bg-linear-to-br from-primary/90 to-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-primary/80 to-primary/60"></div>

        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 size-32 bg-primary-foreground/10 rounded-full"></div>
        <div className="absolute bottom-32 left-16 size-24 bg-primary-foreground/10 rounded-full"></div>
        <div className="absolute top-1/3 right-1/4 size-16 bg-primary-foreground/5 rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/3 size-20 bg-primary-foreground/5 rounded-full"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-16 text-primary-foreground">
          <div className="max-w-lg space-y-8">
            <div className="space-y-4">
              <Link
                href="/"
                className="inline-flex items-center space-x-2 mb-8"
              >
                <Utensils className="size-8" />
                <span className="font-bold text-2xl">{APP_NAME}</span>
              </Link>

              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                Join the family meal planning revolution
              </h1>
              <p className="text-xl text-primary-foreground/90">
                Start your journey to stress-free meal planning with thousands
                of families who have already transformed their kitchen routines.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Sparkles className="size-5 text-primary-foreground/80" />
                <span className="text-primary-foreground/90">
                  Create unlimited recipes
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="size-5 text-primary-foreground/80" />
                <span className="text-primary-foreground/90">
                  Plan weekly meals in minutes
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <ShoppingCart className="size-5 text-primary-foreground/80" />
                <span className="text-primary-foreground/90">
                  Generate smart shopping lists
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="size-5 text-primary-foreground/80" />
                <span className="text-primary-foreground/90">
                  Collaborate with your family
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Heart className="size-5 text-primary-foreground/80" />
                <span className="text-primary-foreground/90">
                  Import recipes from any website
                </span>
              </div>
            </div>

            {/* Social Proof */}
            <div className="pt-4 border-t border-primary-foreground/20">
              <p className="text-sm text-primary-foreground/80">
                Join over{" "}
                <span className="font-semibold">10,000+ families</span> who have
                made meal planning simple and enjoyable.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          {/* Back to Home - Mobile */}
          <div className="flex items-center lg:hidden">
            <Button variant="ghost" asChild className="p-0">
              <Link
                href="/"
                className="flex items-center text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>

          {/* Header */}
          <div className="text-center space-y-2">
            <Link href="/" className="inline-flex items-center space-x-2">
              <Utensils className="size-8 text-primary" />
              <span className="font-bold text-2xl">{APP_NAME}</span>
            </Link>
            <p className="text-muted-foreground">
              Join thousands of families making meal planning simple and
              enjoyable.
            </p>
          </div>

          {/* Sign Up Card */}
          <Card className="shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">
                Create Account
              </CardTitle>
              <CardDescription className="text-center">
                Start your free account and transform your family&apos;s meal
                planning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <SignUp
                  appearance={{
                    elements: {
                      formButtonPrimary:
                        "bg-primary hover:bg-primary/90 text-primary-foreground",
                      card: "shadow-none",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      socialButtonsBlockButton:
                        "border-gray-200 hover:bg-gray-50",
                      formFieldInput:
                        "border-input focus:border-primary focus:ring-primary",
                      footerActionLink: "text-primary hover:text-primary/80",
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="text-primary hover:text-primary/80 font-medium"
              >
                Sign in here
              </Link>
            </p>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>✓ Free forever plan</p>
              <p>✓ No credit card required</p>
              <p>✓ Start planning immediately</p>
              <p>✓ Import recipes from any website</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
