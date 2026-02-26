"use client";

const EXAMPLE_DAYS = [
  "Roast chicken & greens",
  "Pasta puttanesca",
  "Lentil dhal",
  "Salmon traybake",
  "Bean chilli",
  "Stir-fried tofu",
  "Sheet-pan sausages",
];

export function ExampleWeekSection() {
  return (
    <section
      className="py-16 bg-background"
      aria-labelledby="example-week-heading"
    >
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-10">
          <h2
            id="example-week-heading"
            className="text-3xl font-bold mb-4"
          >
            One plan. Seven days.
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Generated from your recipes. Yours to tweak.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {EXAMPLE_DAYS.map((label, i) => (
            <div
              key={String(label)}
              className="p-4 rounded-lg border border-border bg-card text-center"
            >
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Day {i + 1}
              </span>
              <p className="mt-2 text-sm font-medium text-foreground line-clamp-2">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
