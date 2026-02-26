"use client";

import { cn } from "@/lib/utils";
import {
  CalendarX2,
  ChefHat,
  Globe,
  UtensilsCrossed,
} from "lucide-react";

export function BalanceVarietySection() {
  const items = [
    {
      icon: UtensilsCrossed,
      title: "Protein spread",
      description: "No single protein dominates the week.",
    },
    {
      icon: Globe,
      title: "Cuisine variety",
      description: "Caps per cuisine so you get variety, not repetition.",
    },
    {
      icon: ChefHat,
      title: "Mix of effort",
      description: "Simple, moderate, and more involved meals in balance.",
    },
    {
      icon: CalendarX2,
      title: "Doesn't repeat last week",
      description: "Recently suggested meals are deprioritised.",
    },
  ];

  return (
    <section
      className="py-16 bg-muted/30"
      aria-labelledby="balance-variety-heading"
    >
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h2
            id="balance-variety-heading"
            className="text-3xl font-bold mb-4"
          >
            Balance without the work
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The system avoids overload and repetition so your week feels
            intentional.
          </p>
        </div>

        <ul className="grid sm:grid-cols-2 gap-6">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.title}
                className="flex gap-4 p-4 rounded-lg border border-border bg-card"
              >
                <div
                  className={cn(
                    "shrink-0 size-10 rounded-full bg-primary/10 flex items-center justify-center",
                  )}
                >
                  <Icon className="size-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {item.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
