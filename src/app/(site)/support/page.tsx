import { APP_NAME, ROUTES } from "@/app/constants";
import { PublicPageTracker } from "@/components/analytics/public-page-tracker";
import { Button } from "@/components/ui/button";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { openGraphSiteAndUrl } from "@/lib/og-metadata";
import { getSiteBaseUrl } from "@/lib/site-url";
import { BookOpen, HelpCircle, Mail } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

const path = ROUTES.PUBLIC_SUPPORT;
const canonicalUrl = `${getSiteBaseUrl()}${path}`;

export const metadata: Metadata = {
  title: `Help & Support | ${APP_NAME}`,
  description: `Get help with ${APP_NAME}: FAQ, how to use, and contact options. Public documentation for family meal planning, shopping lists, and households.`,
  alternates: { canonical: canonicalUrl },
  robots: { index: true, follow: true },
  openGraph: {
    ...openGraphSiteAndUrl(canonicalUrl),
    title: `Help & Support | ${APP_NAME}`,
    description: `Help and documentation for ${APP_NAME}.`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Help & Support | ${APP_NAME}`,
    description: `Help and documentation for ${APP_NAME}.`,
  },
};

export default function PublicSupportHubPage() {
  return (
    <div className="container mx-auto px-4 py-10 md:py-14 max-w-4xl">
      <PublicPageTracker event={ANALYTICS_EVENTS.SUPPORT_PAGE_VIEWED} />
      <h1 className="text-4xl font-bold tracking-tight mb-3">Help & Support</h1>
      <p className="text-lg text-muted-foreground mb-10 max-w-2xl">
        Everything here is public and search-friendly. Logged-in users can also
        open the same topics from the dashboard for a richer in-app experience.
      </p>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <HelpCircle className="size-5 text-primary" />
              </div>
              <CardTitle className="text-lg">FAQ</CardTitle>
            </div>
            <CardDescription>
              Answers about meal planning, lists, households, and troubleshooting.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={ROUTES.FAQ}>Browse FAQ</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookOpen className="size-5 text-primary" />
              </div>
              <CardTitle className="text-lg">How to use</CardTitle>
            </div>
            <CardDescription>
              Quick-start overview plus a link to the full guide in the app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={ROUTES.PUBLIC_SUPPORT_HOW_TO}>How to use</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Mail className="size-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Contact</CardTitle>
            </div>
            <CardDescription>
              Send feedback or questions—sign in to use the in-app form.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={ROUTES.PUBLIC_SUPPORT_CONTACT}>Contact</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Related topics</h2>
        <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
          <li>
            <Link
              href={ROUTES.FAMILY_MEAL_PLANNING}
              className="text-primary underline-offset-4 hover:underline"
            >
              Family meal planning
            </Link>
          </li>
          <li>
            <Link
              href={ROUTES.RECIPE_TO_SHOPPING_LIST}
              className="text-primary underline-offset-4 hover:underline"
            >
              Recipe to shopping list
            </Link>
          </li>
          <li>
            <Link
              href={ROUTES.HOUSEHOLD_MEAL_PLANNING}
              className="text-primary underline-offset-4 hover:underline"
            >
              Household meal planning
            </Link>
          </li>
        </ul>
      </div>

      <p className="text-sm text-muted-foreground mt-10">
        Looking for recipes?{" "}
        <Link href={ROUTES.DISCOVER} className="text-primary underline-offset-4 hover:underline">
          Discover
        </Link>{" "}
        or return{" "}
        <Link href={ROUTES.HOME} className="text-primary underline-offset-4 hover:underline">
          home
        </Link>
        .
      </p>
    </div>
  );
}
