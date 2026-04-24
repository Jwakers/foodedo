"use client";

import { APP_NAME, ROUTES } from "@/app/constants";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FAQ_SECTIONS_DATA } from "@/lib/faq-content";
import { FAQ_SECTION_ACCENTS } from "@/lib/faq-section-accents";
import { cn } from "@/lib/utils";
import { ArrowLeft, HelpCircle } from "lucide-react";
import Link from "next/link";

type FaqSectionsPanelProps = {
  backHref: string;
  backLabel: string;
};

const DEFAULT_SECTION_ACCENT = {
  Icon: HelpCircle,
  color: "bg-primary/10 text-primary",
};

export function FaqSectionsPanel({
  backHref,
  backLabel,
}: FaqSectionsPanelProps) {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={backHref} className="flex items-center gap-2">
            <ArrowLeft className="size-4" />
            {backLabel}
          </Link>
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <HelpCircle className="size-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Frequently Asked Questions</h1>
        </div>
        <p className="text-muted-foreground">
          Find answers to common questions about using {APP_NAME}.
        </p>
      </div>

      <div className="space-y-6">
        {FAQ_SECTIONS_DATA.map((section, sectionIndex) => {
          const fromAccents = FAQ_SECTION_ACCENTS[sectionIndex];
          if (!fromAccents) {
            console.warn(
              `[FAQ] Missing FAQ_SECTION_ACCENTS entry for index ${sectionIndex} ("${section.title}"). Using default accent.`,
            );
          }
          const { Icon, color } = fromAccents ?? DEFAULT_SECTION_ACCENT;
          return (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", color)}>
                    <Icon className="size-5" />
                  </div>
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {section.questions.map((faq, faqIndex) => (
                    <AccordionItem
                      key={`${sectionIndex}-${faqIndex}`}
                      value={`${sectionIndex}-${faqIndex}`}
                    >
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
          );
        })}
      </div>

      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">
              Still have questions?
            </h3>
            <p className="text-muted-foreground mb-4">
              Can&apos;t find the answer you&apos;re looking for? We&apos;re
              here to help!
            </p>
            <Button asChild>
              <Link href={ROUTES.PUBLIC_SUPPORT_CONTACT}>Contact Support</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
