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

## PostHog event dictionary (v1)

Core events currently used for this phase:

- `landing_viewed` — public landing page viewed (`intent_topic` included on intent pages).
- `cta_clicked` — major call-to-action clicked.
- `support_page_viewed` — public support surfaces visited.
- `faq_viewed` — FAQ page viewed.
- `discover_viewed` — Discover page viewed.
- `secondary_action_taken` — non-primary intent actions (e.g., learn-more style actions).
- `signup_started` — user initiated sign-up from tracked CTAs.
- `signup_completed` — first authenticated app load for a user (proxy for completion).
- `signin_completed` — first authenticated app load per session.
- `install_prompt_shown` — install prompt rendered.
- `install_prompt_clicked` — install CTA clicked.
- `install_prompt_outcome` — install result (`accepted`, `dismissed`, `manual_fallback`).

Shared properties attached where available:

- `page_path`
- `intent_topic`
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`
- `referrer_domain`

## PostHog dashboard setup (minimum set)

Create these insights/dashboard cards:

1. **Organic acquisition by landing page**
   - Metric: count of `landing_viewed`
   - Breakdown: `page_path`, `utm_source`
   - Filter: `utm_medium` includes `organic` when present
2. **Landing -> signup funnel**
   - Steps: `landing_viewed` -> `cta_clicked` (where `cta_type` contains `signup`) -> `signup_started` -> `signup_completed`
3. **Install intent**
   - Ratio: `install_prompt_outcome(outcome=accepted)` / `install_prompt_shown`
4. **Early drop-off proxy**
   - Count sessions with only one tracked event (or users with `landing_viewed` and no `cta_clicked`/`secondary_action_taken`)
5. **Intent satisfaction**
   - Follow-on actions after `landing_viewed`: `secondary_action_taken`, `faq_viewed`, `support_page_viewed`, `signup_started`

Detailed click-by-click setup: `docs/POSTHOG_DASHBOARDS.md`.

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
