"use client";

import { getCannyBoardUrl } from "@/app/(app)/_components.tsx/canny-identify";
import { APP_NAME, ROUTES } from "@/app/constants";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  CalendarCheck,
  HelpCircle,
  LifeBuoy,
  Mail,
  MessageSquare,
  Users,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { faqSections } from "./faq/page";

const featuredFAQs = faqSections.flatMap((section) => section.questions[0]);
const baseCannyBoardUrl = process.env.NEXT_PUBLIC_CANNY_BOARD_URL;

export default function SupportPage() {
  const pathname = usePathname();
  const cannyBoardUrl = baseCannyBoardUrl ? getCannyBoardUrl(pathname) : null;
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Hero Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <LifeBuoy className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Help & Support</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Find answers to common questions, learn how to use {APP_NAME}, or get
          in touch with our support team.
        </p>
      </div>

      {/* Navigation Cards */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <HelpCircle className="size-5 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-lg">FAQ</CardTitle>
            </div>
            <CardDescription>
              Find answers to frequently asked questions about features,
              troubleshooting, and account management.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={ROUTES.SUPPORT_FAQ}>Browse FAQ</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <BookOpen className="size-5 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-lg">How to Use</CardTitle>
            </div>
            <CardDescription>
              Step-by-step guides to help you get started and master all the
              features of {APP_NAME}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={ROUTES.SUPPORT_HOW_TO}>Learn How</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Mail className="size-5 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-lg">Contact Us</CardTitle>
            </div>
            <CardDescription>
              Can&apos;t find what you&apos;re looking for? Send us a message
              and we&apos;ll get back to you as soon as possible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={ROUTES.CONTACT}>Get in Touch</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Featured FAQs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="size-5" />
            Quick Answers
          </CardTitle>
          <CardDescription>
            Here are some of the most common questions we receive. For more
            detailed answers, check out our full FAQ.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {featuredFAQs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="size-5" />
            Quick Links
          </CardTitle>
          <CardDescription>
            Jump directly to the features you need help with.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" asChild className="justify-start">
              <Link href={ROUTES.MEAL_PLAN}>
                <CalendarCheck className="size-4 mr-2" />
                Meal planning
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link href={ROUTES.SHOPPING_LIST}>
                <Utensils className="size-4 mr-2" />
                Shopping list
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link href={ROUTES.MY_RECIPES}>
                <Utensils className="size-4 mr-2" />
                My Recipes
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link href={ROUTES.HOUSEHOLDS}>
                <Users className="size-4 mr-2" />
                Households
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link href={ROUTES.CHALKBOARD}>
                <MessageSquare className="size-4 mr-2" />
                Kitchen Chalkboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="size-5" />
            Help Us Improve {APP_NAME}
          </CardTitle>
          <CardDescription>
            Your feedback helps us make {APP_NAME} better for everyone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Whether you have suggestions for new features, found a bug, or just
            want to share your experience, we&apos;d love to hear from you! Your
            input helps us prioritize improvements and build the features that
            matter most to our community.
          </p>
          {cannyBoardUrl ? (
            <Button asChild className="w-full">
              <a
                data-canny-link
                href={cannyBoardUrl}
                rel="noreferrer"
                target="_blank"
              >
                <MessageSquare className="mr-2 size-4" />
                Share Your Feedback
              </a>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
