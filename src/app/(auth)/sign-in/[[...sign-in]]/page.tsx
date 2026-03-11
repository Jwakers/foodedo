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
import { SignIn } from "@clerk/nextjs";
import {
  ArrowLeft,
  Calendar,
  ChefHat,
  ShoppingCart,
  Users,
  Utensils,
} from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="lg:grid lg:grid-cols-2 min-h-screen">
      {/* Left Side - Image/Illustration */}
      <div className="hidden lg:flex lg:flex-1 bg-linear-to-br from-primary/90 to-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-primary/80 to-primary/60"></div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary-foreground/10 rounded-full"></div>
        <div className="absolute bottom-32 right-16 w-24 h-24 bg-primary-foreground/10 rounded-full"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-primary-foreground/5 rounded-full"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-16 text-primary-foreground">
          <div className="max-w-lg space-y-8">
            <div className="space-y-4">
              <Link
                href="/"
                className="inline-flex items-center space-x-2 mb-8"
              >
                <Utensils className="h-8 w-8" />
                <span className="font-bold text-2xl">{APP_NAME}</span>
              </Link>

              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                Welcome back to your kitchen
              </h1>
              <p className="text-xl text-primary-foreground/90">
                Continue planning amazing meals for your family with all your
                saved recipes and meal plans.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <ChefHat className="size-5 text-primary-foreground/80" />
                <span className="text-primary-foreground/90">
                  Access your recipe collection
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="size-5 text-primary-foreground/80" />
                <span className="text-primary-foreground/90">
                  Continue your meal planning
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <ShoppingCart className="size-5 text-primary-foreground/80" />
                <span className="text-primary-foreground/90">
                  Generate shopping lists
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="size-5 text-primary-foreground/80" />
                <span className="text-primary-foreground/90">
                  Sync with your family
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Sign In Form */}
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
              <Utensils className="h-8 w-8 text-primary" />
              <span className="font-bold text-2xl">{APP_NAME}</span>
            </Link>
            <p className="text-muted-foreground">
              Welcome back! Sign in to continue planning your family&apos;s
              meals.
            </p>
          </div>

          {/* Sign In Card */}
          <Card className="shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Sign In</CardTitle>
              <CardDescription className="text-center">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <SignIn
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
              Don&apos;t have an account?{" "}
              <Link
                href="/sign-up"
                className="text-primary hover:text-primary/80 font-medium"
              >
                Sign up for free
              </Link>
            </p>

            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Free forever plan available</li>
              <li>• No credit card required</li>
              <li>• Join 10,000+ families already planning</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
