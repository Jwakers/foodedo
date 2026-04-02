# Organic growth scoreboard (SEO / AEO)

Use this single doc to track baselines, weekly reviews, and the **finish state** for the current organic-foundation phase. Update it in place—no separate tooling required.

## Metrics (weekly)

| Metric | How to measure | Baseline | W1 | W2 | W3 | Notes |
|--------|----------------|----------|----|----|-----|-------|
| Organic sessions / week | Analytics: sessions with channel = organic search | _fill after first week_ | | | | |
| Organic → sign-up CVR | Organic sessions → completed sign-ups (same period) | _fill_ | | | | |
| Install intent rate | PWA install prompt accepted / shown (or proxy: clicks “Add to Home” help) | _fill_ | | | | |

**Baseline instructions:** After your analytics tool has at least 7 days of data, record the first row. If traffic is very low, still record zeros—comparability matters more than magnitude.

## Intent map (three entry pages)

These URLs are the primary SEO/AEO targets for this phase. Content and metadata live in the app; this table is the editorial source of truth.

| # | Search intent (target query) | Canonical URL |
|---|------------------------------|---------------|
| 1 | Family / weekly meal planning app | `/family-meal-planning` |
| 2 | Recipe to shopping list / grocery list from meals | `/recipe-to-shopping-list` |
| 3 | Household collaborative meal planning | `/household-meal-planning` |

Supporting indexable surfaces: `/` (home), `/faq`, `/support`, `/support/how-to-use`, `/support/contact`, `/discover`.

## Weekly review loop (task 7)

Every week, same day if possible:

1. Update the metrics table (rolling 7 days or calendar week—pick one and stick to it).
2. Note what changed on-site (deploys, new copy, new internal links).
3. Decide **one** follow-up: double down, tweak metadata, or add one internal link from a page that already gets impressions.
4. Stop when you have 3+ weeks of comparable rows **and** a repeatable insight (e.g. “intent page 2 outperforms on long-tail grocery queries”).

## Known finish state (this phase is “done” when)

- [ ] Scoreboard has **3+ weeks** of comparable metrics.
- [ ] Three intent URLs are live, indexable, with metadata + FAQ JSON-LD + CTAs.
- [ ] Public support hub at `/support` (and how-to + contact) is live and linked from the marketing footer.
- [ ] You have completed at least **3 weekly reviews** with written notes in the table or Notes column.
- [ ] You can name **one repeatable acquisition play** (even small) backed by your numbers.

## Deprioritize until the above is true

- Large new product features unrelated to acquisition.
- Broad launches (Product Hunt, etc.) without a working organic funnel.
- Refactors that do not change traffic, signup, or install intent.
