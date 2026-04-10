import { APP_NAME, ROUTES } from "@/app/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, BookMarked, CalendarDays, ListChecks } from "lucide-react";
import Link from "next/link";

const benefits = [
  {
    icon: CalendarDays,
    title: "Plan your week",
    description:
      "Drag-and-drop meal planning so the whole family knows what’s for dinner.",
  },
  {
    icon: ListChecks,
    title: "Smart shopping lists",
    description:
      "Auto-generated lists from your plan — no more forgotten ingredients.",
  },
  {
    icon: BookMarked,
    title: "Your recipe hub",
    description:
      "Save, organise, and cook from one place. Import from anywhere.",
  },
] as const;

export function BlogCtaSection() {
  return (
    <section
      className={cn(
        "relative overflow-hidden",
        "mt-16 sm:mt-20",
        "rounded-2xl sm:rounded-3xl",
        "bg-linear-to-br from-primary/15 via-primary/10 to-primary/5",
        "dark:from-primary/20 dark:via-primary/12 dark:to-primary/6",
        "border border-primary/20 dark:border-primary/25",
        "shadow-lg shadow-primary/5 dark:shadow-primary/10",
      )}
    >
      {/* Subtle grid pattern for depth */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-size-[24px_24px] bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)]"
        aria-hidden
      />
      <div className="relative container mx-auto px-4 py-10 sm:py-14 max-w-4xl">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Ready to cook what you love?
          </h2>
          <p className="mt-3 text-muted-foreground text-base sm:text-lg">
            {APP_NAME} turns inspiration from the blog into organised meal
            plans, shopping lists, and a recipe collection that actually works
            for busy families.
          </p>
        </div>

        <ul className="grid sm:grid-cols-3 gap-6 sm:gap-8 mb-10">
          {benefits.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="flex flex-col items-center text-center sm:items-start sm:text-left"
            >
              <div
                className={cn(
                  "size-10 rounded-xl flex items-center justify-center mb-3",
                  "bg-primary/20 dark:bg-primary/25 text-primary",
                )}
              >
                <Icon className="size-5" aria-hidden />
              </div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            </li>
          ))}
        </ul>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Button size="lg" className="min-w-[160px] gap-2" asChild>
            <Link href={ROUTES.SIGN_UP}>
              Start free
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="min-w-[160px]" asChild>
            <Link href={ROUTES.SIGN_IN}>Sign in</Link>
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">
          No credit card required. Free to try.
        </p>
      </div>
    </section>
  );
}
