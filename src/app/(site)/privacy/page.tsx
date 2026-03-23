import { APP_NAME, ROUTES } from "@/app/constants";
import { getSiteBaseUrl } from "@/lib/site-url";
import { openGraphSiteAndUrl } from "@/lib/og-metadata";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

const privacyCanonical = `${getSiteBaseUrl()}${ROUTES.PRIVACY}`;

export const metadata: Metadata = {
  alternates: { canonical: privacyCanonical },
  title: "Privacy Policy",
  description: `Learn how ${APP_NAME} collects, uses, and protects your personal information.`,
  openGraph: {
    ...openGraphSiteAndUrl(privacyCanonical),
    title: `Privacy Policy | ${APP_NAME}`,
    description: `Learn how ${APP_NAME} collects, uses, and protects your personal information.`,
  },
  twitter: {
    card: "summary",
    title: `Privacy Policy | ${APP_NAME}`,
    description: `Learn how ${APP_NAME} collects, uses, and protects your personal information.`,
  },
};

const PRIVACY_POLICY_LAST_UPDATED = "3 December 2025"; // update manually when terms change

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href={ROUTES.HOME}>
            <ArrowLeft className="mr-2 size-4" />
            Back to Home
          </Link>
        </Button>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">
              Last updated: {PRIVACY_POLICY_LAST_UPDATED}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Introduction</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                {APP_NAME} (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;)
                is committed to protecting your privacy. This Privacy Policy
                explains how we collect, use, and safeguard your information
                when you use our meal planning application.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Information We Collect</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <h3 className="text-lg font-semibold mt-4 mb-2">
                Account Information
              </h3>
              <p>When you create an account, we collect:</p>
              <ul>
                <li>Name and email address (via Clerk authentication)</li>
                <li>Profile information you choose to provide</li>
                <li>Authentication data to secure your account</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4 mb-2">Usage Data</h3>
              <p>When you use {APP_NAME}, we collect:</p>
              <ul>
                <li>Recipes you create, import, or save</li>
                <li>Shopping lists and kitchen chalkboard items</li>
                <li>Household memberships and shared content</li>
                <li>Recipe images you upload</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4 mb-2">
                Communication Data
              </h3>
              <p>
                When you contact us through our support form, we collect your
                message content and contact information to respond to your
                inquiry.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>We use your information to:</p>
              <ul>
                <li>Provide and maintain {APP_NAME} services</li>
                <li>Enable recipe management and meal planning features</li>
                <li>Facilitate household collaboration</li>
                <li>Process and respond to your support requests</li>
                <li>Improve our application and user experience</li>
                <li>Send important service updates and notifications</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Storage and Security</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>Your data is stored securely using:</p>
              <ul>
                <li>
                  <strong>Convex:</strong> Database and file storage for
                  recipes, lists, and images
                </li>
                <li>
                  <strong>Clerk:</strong> Authentication and user management
                </li>
              </ul>
              <p>
                We implement appropriate technical and organizational measures
                to protect your personal information against unauthorized
                access, alteration, disclosure, or destruction.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Sharing</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                We do not sell your personal information. We only share data:
              </p>
              <ul>
                <li>
                  With household members you explicitly invite (shared recipes,
                  lists, and chalkboard items)
                </li>
                <li>
                  With service providers necessary to operate {APP_NAME}
                  (Clerk, Convex, email service)
                </li>
                <li>When required by law or to protect our rights</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Processing</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                When you use our AI-powered recipe import feature, recipe data
                from URLs or text you provide is processed using OpenAI&apos;s
                API to extract structured recipe information. This processing is
                necessary to provide the service and is subject to OpenAI&apos;s
                privacy practices.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Rights</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>You have the right to:</p>
              <ul>
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and associated data</li>
                <li>Export your recipes and data</li>
                <li>Opt out of non-essential communications</li>
              </ul>
              <p>
                To exercise these rights, please contact us through our support
                form.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cookies and Tracking</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                {APP_NAME} uses essential cookies and local storage to maintain
                your session and provide core functionality. We do not use
                advertising or third-party tracking cookies.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Children&apos;s Privacy</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                {APP_NAME} is not intended for children under 13. We do not
                knowingly collect personal information from children under 13.
                If you believe we have collected such information, please
                contact us immediately.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Changes to This Policy</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                We may update this Privacy Policy from time to time. We will
                notify you of any significant changes by posting the new policy
                on this page and updating the &quot;Last updated&quot; date.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                If you have questions about this Privacy Policy or our privacy
                practices, please contact us through our{" "}
                <Link
                  href={ROUTES.CONTACT}
                  className="text-primary hover:underline"
                >
                  support form
                </Link>
                .
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
