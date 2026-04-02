# PostHog Dashboard Setup

Use this as the exact checklist to configure dashboards in PostHog for the current organic-growth phase.

## Dashboard 1: Organic acquisition

- Insight type: Trends
- Event: `landing_viewed`
- Breakdown: `page_path`
- Optional breakdown 2: `utm_source`
- Filter: `utm_medium` contains `organic` (when present)

## Dashboard 2: Landing -> signup funnel

- Insight type: Funnel
- Steps:
  1. `landing_viewed`
  2. `cta_clicked` with `cta_type` containing `signup`
  3. `signup_started`
  4. `signup_completed`
- Breakdown: `intent_topic` or `page_path`

## Dashboard 3: Install intent

- Insight type: Trends or formula
- Numerator: `install_prompt_outcome` where `outcome = accepted`
- Denominator: `install_prompt_shown`
- Optional segment: `install_context` (`ios` vs `non_ios`)

## Dashboard 4: Early drop-off proxy

- Insight type: Trends
- Event pair:
  - `landing_viewed`
  - `cta_clicked` OR `secondary_action_taken`
- Focus on visitors with `landing_viewed` and no follow-up action in same session.

## Dashboard 5: Intent satisfaction

- Insight type: Funnel
- Steps:
  1. `landing_viewed`
  2. `secondary_action_taken` OR `faq_viewed` OR `support_page_viewed` OR `support_how_to_viewed` OR `signup_started`
- Breakdown by `intent_topic`.
