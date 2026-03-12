import { APP_NAME, ROUTES } from "@/app/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Read the terms and conditions for using ${APP_NAME} meal planning application.`,
  openGraph: {
    title: `Terms of Service | ${APP_NAME}`,
    description: `Read the terms and conditions for using ${APP_NAME} meal planning application.`,
  },
  twitter: {
    card: "summary",
    title: `Terms of Service | ${APP_NAME}`,
    description: `Read the terms and conditions for using ${APP_NAME} meal planning application.`,
  },
};

const TERMS_OF_SERVICE_LAST_UPDATED = "3 December 2025"; // update manually when terms change

export default function TermsPage() {
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
            <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground">
              Last updated: {TERMS_OF_SERVICE_LAST_UPDATED}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                By accessing and using {APP_NAME} (&quot;the Service&quot;), you
                accept and agree to be bound by these Terms of Service. If you
                do not agree to these terms, please do not use the Service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description of Service</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>{APP_NAME} is a meal planning application that helps you:</p>
              <ul>
                <li>Create, import, and manage recipes</li>
                <li>Generate shopping lists from recipes</li>
                <li>Collaborate with household members</li>
                <li>Use a shared kitchen chalkboard for notes</li>
                <li>Import recipes using AI-powered tools</li>
              </ul>
              <p>
                The Service is currently provided free of charge during our beta
                period.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Accounts</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>To use {APP_NAME}, you must:</p>
              <ul>
                <li>Be at least 13 years of age</li>
                <li>Create an account with accurate information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
              </ul>
              <p>
                You are responsible for all activities that occur under your
                account.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Content</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <h3 className="text-lg font-semibold mt-4 mb-2">Your Content</h3>
              <p>
                You retain ownership of all content you create or upload to
                {APP_NAME}, including recipes, images, notes, and lists. By
                using the Service, you grant us a license to store, display, and
                process your content solely to provide the Service.
              </p>

              <h3 className="text-lg font-semibold mt-4 mb-2">
                Content Standards
              </h3>
              <p>You agree not to upload or share content that:</p>
              <ul>
                <li>Violates any laws or regulations</li>
                <li>Infringes on intellectual property rights</li>
                <li>Contains malicious code or viruses</li>
                <li>Is offensive, harmful, or inappropriate</li>
              </ul>

              <h3 className="text-lg font-semibold mt-4 mb-2">
                Imported Content
              </h3>
              <p>
                When importing recipes from external sources, you are
                responsible for ensuring you have the right to save and use that
                content. We provide tools for attribution and source tracking.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Household Collaboration</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>When you create or join a household:</p>
              <ul>
                <li>
                  You agree to share specified content with household members
                </li>
                <li>Household owners can manage members and shared content</li>
                <li>You can leave a household at any time</li>
                <li>
                  Leaving a household does not delete your personal recipes
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acceptable Use</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>You agree not to:</p>
              <ul>
                <li>Use the Service for any illegal purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Use automated systems to access the Service excessively</li>
                <li>Impersonate others or provide false information</li>
                <li>Scrape or copy content from other users</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Availability</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>We strive to provide reliable service but cannot guarantee:</p>
              <ul>
                <li>Uninterrupted or error-free operation</li>
                <li>That defects will be corrected immediately</li>
                <li>That the Service will meet all your requirements</li>
              </ul>
              <p>
                We may modify, suspend, or discontinue the Service at any time
                with reasonable notice.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Features</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                Our AI recipe import feature uses artificial intelligence to
                extract recipe information. While we strive for accuracy:
              </p>
              <ul>
                <li>AI results may contain errors or inaccuracies</li>
                <li>You should review and verify all imported recipes</li>
                <li>
                  We are not responsible for errors in AI-generated content
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                {APP_NAME} and its original content, features, and functionality
                are owned by us and are protected by international copyright,
                trademark, and other intellectual property laws.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                To the fullest extent permitted by law, {APP_NAME} shall not be
                liable for any indirect, incidental, special, consequential, or
                punitive damages resulting from:
              </p>
              <ul>
                <li>Your use or inability to use the Service</li>
                <li>Any unauthorized access to your data</li>
                <li>Any errors or omissions in content</li>
                <li>Any other matter relating to the Service</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Termination</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                We reserve the right to terminate or suspend your account and
                access to the Service:
              </p>
              <ul>
                <li>For violation of these Terms</li>
                <li>For fraudulent or illegal activity</li>
                <li>At your request to delete your account</li>
              </ul>
              <p>
                Upon termination, your right to use the Service will immediately
                cease.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                We may update these Terms of Service from time to time. We will
                notify you of any significant changes by posting the new terms
                on this page and updating the &quot;Last updated&quot; date.
                Your continued use of the Service after changes constitutes
                acceptance of the new terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Governing Law</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                These Terms shall be governed by and construed in accordance
                with the laws of the United Kingdom, without regard to its
                conflict of law provisions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate dark:prose-invert max-w-none">
              <p>
                If you have questions about these Terms of Service, please
                contact us through our{" "}
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
