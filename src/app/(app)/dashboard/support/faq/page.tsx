"use client";

import { ROUTES } from "@/app/constants";
import { FaqSectionsPanel } from "@/components/faq/faq-sections-panel";

export default function FAQPage() {
  return (
    <FaqSectionsPanel
      backHref={ROUTES.SUPPORT}
      backLabel="Back to Support"
    />
  );
}
