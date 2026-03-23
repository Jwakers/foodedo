/**
 * schema.org FAQPage JSON-LD for public FAQ URLs.
 * @see https://schema.org/FAQPage
 */

import type { FaqSectionData } from "@/lib/faq-content";

export function buildFaqPageJsonLd(
  sections: ReadonlyArray<FaqSectionData>,
  pageUrl: string,
): Record<string, unknown> {
  const mainEntity = sections.flatMap((section) =>
    section.questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  );

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: pageUrl,
    mainEntity,
  };
}
