"use client";

import { Check } from "lucide-react";

const BULLETS = [
  "No repeated meals across the week",
  "A mix of quick dinners and proper cooking",
  "Variety without you juggling the rules",
];

export function BalanceVarietySection() {
  return (
    <section
      className="py-16 bg-muted/30"
      aria-labelledby="balance-variety-heading"
    >
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <h2
            id="balance-variety-heading"
            className="text-3xl font-bold mb-4"
          >
            Automatically balances your week
          </h2>
          <p className="text-lg text-muted-foreground">
            So you get an intentional plan — without the spreadsheet brain.
          </p>
        </div>

        <ul className="space-y-3 text-left">
          {BULLETS.map((line) => (
            <li
              key={line}
              className="flex gap-3 rounded-lg border border-border bg-card px-4 py-3 text-foreground"
            >
              <span className="mt-0.5 shrink-0 flex size-6 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Check className="size-3.5" aria-hidden />
              </span>
              <span className="text-sm leading-relaxed sm:text-base">{line}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
