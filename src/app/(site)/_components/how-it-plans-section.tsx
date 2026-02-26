"use client";

import { cn } from "@/lib/utils";
import { CalendarPlus, Lock, Scale } from "lucide-react";

export function HowItPlansSection() {
  const blocks = [
    {
      title: "Generate",
      description:
        "One tap fills your week from your recipes. Set the end date, then let the planner do the rest.",
      icon: CalendarPlus,
    },
    {
      title: "Balance",
      description:
        "Protein spread, cuisine variety, and a mix of easy and involved meals. The system applies the rules so the week doesn't feel samey or overwhelming.",
      icon: Scale,
    },
    {
      title: "You're in control",
      description:
        "Swap or lock any meal. Regenerate the rest. The plan is yours to tweak.",
      icon: Lock,
    },
  ];

  return (
    <section
      id="how-it-plans"
      className="py-20 bg-background scroll-mt-20"
      aria-labelledby="how-it-plans-heading"
    >
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-16">
          <h2
            id="how-it-plans-heading"
            className="text-3xl font-bold mb-4"
          >
            How it plans your week
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            One action fills the week. Balance and variety are built in.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-10">
          {blocks.map((block) => {
            const Icon = block.icon;
            return (
              <div
                key={block.title}
                className="relative p-6 rounded-lg border border-border bg-card"
              >
                <div
                  className={cn(
                    "mb-4 size-12 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center",
                  )}
                >
                  <Icon className="size-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{block.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {block.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
