import { cn } from "@/lib/utils";
import type { IntentPageDefinition } from "@/lib/seo-intent-data";
import { IntentLandingActions } from "./intent-landing-actions";
import Link from "next/link";

type IntentLandingBodyProps = {
  intent: IntentPageDefinition;
  secondaryHref: string;
  secondaryLabel: string;
};

export function IntentLandingBody({
  intent,
  secondaryHref,
  secondaryLabel,
}: IntentLandingBodyProps) {
  return (
    <article className="container mx-auto px-4 py-10 md:py-14 max-w-3xl">
      <header className="mb-10 space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          {intent.h1}
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          {intent.intro}
        </p>
        <IntentLandingActions
          intentTopic={intent.path}
          secondaryHref={secondaryHref}
          secondaryLabel={secondaryLabel}
        />
      </header>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10">
        {intent.sections.map((section, index) => (
          <section key={`section-${index}`}>
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              {section.heading}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {section.body}
            </p>
          </section>
        ))}
      </div>

      <section
        className="mt-14 pt-10 border-t"
        aria-labelledby="intent-faq-heading"
      >
        <h2
          id="intent-faq-heading"
          className="text-2xl font-semibold text-foreground mb-6"
        >
          Questions & answers
        </h2>
        <dl className="space-y-6">
          {intent.faq.map((item, index) => (
            <div key={`faq-${index}`}>
              <dt className={cn("font-semibold text-foreground text-base")}>
                {item.question}
              </dt>
              <dd className="mt-2 text-muted-foreground leading-relaxed pl-0">
                {item.answer}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {intent.relatedGuides?.length ? (
        <section className="mt-12 pt-8 border-t" aria-labelledby="related-guides">
          <h2 id="related-guides" className="text-2xl font-semibold text-foreground">
            More to explore
          </h2>
          <ul className="mt-4 space-y-2">
            {intent.relatedGuides.map((guide, index) => (
              <li key={`${guide.href}-${index}`}>
                <Link
                  href={guide.href}
                  className="text-primary underline underline-offset-4 hover:text-primary/85"
                >
                  {guide.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className="mt-12 pt-8 border-t">
        <p className="text-sm text-muted-foreground mb-4">
          Ready to try it? Create a free account or browse recipes first.
        </p>
        <IntentLandingActions
          intentTopic={intent.path}
          secondaryHref={secondaryHref}
          secondaryLabel={secondaryLabel}
        />
      </footer>
    </article>
  );
}