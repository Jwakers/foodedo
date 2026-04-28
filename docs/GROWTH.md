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
| 4 | How to make a shopping list from recipes | `/how-to-make-a-shopping-list-from-recipes` |
| 5 | Combine multiple recipes into one grocery list | `/combine-recipes-into-one-grocery-list` |
| 6 | Meal planner with grocery list | `/meal-planner-with-grocery-list` |
| 7 | How to create a weekly meal plan fast | `/how-to-create-a-weekly-meal-plan-fast` |
| 8 | How to plan varied meals for the week | `/how-to-plan-varied-meals-for-the-week` |
| 9 | Meal planning for busy weeknights | `/meal-planning-for-busy-weeknights` |
| 10 | Meal plan vs shopping list explainer | `/meal-plan-vs-shopping-list-what-you-need` |

Supporting indexable surfaces: `/` (home), `/faq`, `/support`, `/support/how-to-use`, `/support/contact`, `/discover`.

### Query-to-page mapping (current focus)

Use this as the first-pass attribution map when reviewing GSC:

| Query pattern | Primary URL |
|---|---|
| `recipe to grocery list`, `recipe to shopping list`, `shopping list from recipes`, `grocery list from recipes` | `/recipe-to-shopping-list` |
| `how to make a shopping list from recipes`, `how to make a grocery list from recipes` | `/how-to-make-a-shopping-list-from-recipes` |
| `combine multiple recipes into one grocery list`, `merge ingredients from recipes` | `/combine-recipes-into-one-grocery-list` |
| `meal planner with grocery list`, `weekly meal plan and shopping list` | `/meal-planner-with-grocery-list` |
| `how to create a weekly meal plan fast`, `quick meal planning` | `/how-to-create-a-weekly-meal-plan-fast` |
| `how to plan varied meals for the week`, `avoid repeating meals every week` | `/how-to-plan-varied-meals-for-the-week` |
| `meal planning for busy weeknights`, `quick weeknight meal planning` | `/meal-planning-for-busy-weeknights` |
| `meal plan vs shopping list`, `meal planning and grocery list difference` | `/meal-plan-vs-shopping-list-what-you-need` |

Supporting guides (blog):  
`/blog/how-to-turn-recipes-into-one-grocery-list`  
`/blog/how-to-combine-ingredients-from-multiple-recipes`  
`/blog/weekly-meal-plan-and-shopping-list-guide`  
`/blog/how-to-build-a-weekly-meal-plan-in-15-minutes`  
`/blog/how-to-keep-meals-varied-without-overthinking-it`  
`/blog/recipe-app-vs-meal-planner-vs-grocery-list-app`

## Weekly review loop (task 7)

Every week, same day if possible:

1. Update the metrics table (rolling 7 days or calendar week—pick one and stick to it).
2. Note what changed on-site (deploys, new copy, new internal links).
3. Decide **one** follow-up: double down, tweak metadata, or add one internal link from a page that already gets impressions.
4. Stop when you have 3+ weeks of comparable rows **and** a repeatable insight (e.g. “intent page 2 outperforms on long-tail grocery queries”).

### Iteration rules for low-volume periods

When volumes are low (early stage), use these thresholds so you still make decisions:

- If a page gains impressions but stays at 0 clicks for 2 consecutive reviews, rewrite title + meta description to better match the query wording.
- If a page gains first clicks but no `signup_started`, update above-the-fold CTA copy and add one new internal link from `/` or `/blog`.
- If query/page mapping looks mixed (same query spread across multiple pages), tighten one page around the main phrase and de-emphasize the phrase on the others.
- If a new intent page has no impressions after 3 weeks, add one supporting guide and two internal links to it before replacing the page.

## PostHog event dictionary (v1)

Core events currently used for this phase:

- `landing_viewed` — public landing page viewed (`intent_topic` included on intent pages).
- `cta_clicked` — major call-to-action clicked. **Recommended:** always set **`cta_type`** (string) so funnels and breakdowns stay consistent — e.g. `signup`, `learn_more`, `try_demo`, `contact`, `install`. Use the same vocabulary everywhere you emit this event.
- `support_page_viewed` — public support hub visited.
- `support_how_to_viewed` — public how-to page (`/support/how-to-use`).
- `faq_viewed` — FAQ page viewed.
- `discover_viewed` — Discover page viewed.
- `secondary_action_taken` — non-primary intent actions (e.g., learn-more style actions).
- `signup_started` — user initiated sign-up from tracked CTAs.
- `signup_completed` — first authenticated app load for a user (proxy for completion).
- `signin_completed` — first authenticated app load per session.
- `install_prompt_shown` — install prompt rendered (once per session); includes `install_context` and `has_deferred_prompt`.
- `install_prompt_clicked` — install CTA clicked.
- `install_prompt_outcome` — install result (`accepted`, `dismissed`, `manual_fallback`); includes `install_context` (`ios` / `non_ios`) and `has_deferred_prompt` for segmentation.

Shared properties attached where available:

- `page_path`
- `cta_type` (on `cta_clicked` and anywhere CTAs are tracked — string; see `cta_clicked` above)
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
   - Steps: `landing_viewed` → `cta_clicked` (filter: `cta_type` contains `signup` or `join_beta`) → `signup_started` → `signup_completed`
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
