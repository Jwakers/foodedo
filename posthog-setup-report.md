<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into foodedo, a Next.js 16 App Router application. Here is a summary of what was done:

**Infrastructure**
- Installed `posthog-js` and `posthog-node` packages
- Created `instrumentation-client.ts` at the project root to initialize PostHog client-side using the Next.js 15.3+ instrumentation approach (no provider needed)
- Added PostHog reverse-proxy rewrites to `next.config.ts` (`/ingest/*` → EU PostHog) with `skipTrailingSlashRedirect: true`
- Created `src/lib/posthog-server.ts` for server-side PostHog client (singleton pattern with `posthog-node`)
- Environment variables `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` written to `.env.local`

**User identification**
- Created `src/app/(app)/_components.tsx/posthog-identify.tsx` — a client component that reads the Clerk-authenticated user and calls `posthog.identify()` with their ID, email, name, and creation date
- Mounted `<PostHogIdentify />` in `src/app/(app)/layout.tsx` alongside the existing `<CannyIdentify />`

**Event tracking** (12 events across 7 files)

| Event | Description | File |
|---|---|---|
| `recipe_imported` | User successfully saves an imported recipe (URL, text, or photo) | `src/app/(app)/dashboard/import-recipe/_components/hooks/use-recipe-save.ts` |
| `recipe_created` | User successfully creates a recipe manually | `src/app/(app)/_components.tsx/recipe-form.tsx` |
| `recipe_deleted` | User confirms and deletes a recipe | `src/app/(app)/recipe/[id]/_components/recipe-client.tsx` |
| `recipe_shared_to_household` | User shares a recipe with a household | `src/app/(app)/recipe/[id]/_components/share-to-household-dialog.tsx` |
| `household_created` | User successfully creates a new household | `src/app/(app)/dashboard/households/_components/create-household-dialog.tsx` |
| `household_invitation_accepted` | User accepts a household invitation | `src/app/(app)/invite/[token]/page.tsx` |
| `meal_plan_generated` | User generates a new weekly meal plan | `src/app/(app)/dashboard/meal-plan/_components/meal-plan-client.tsx` |
| `meal_plan_regenerated` | User regenerates their meal plan (keeping locked meals) | `src/app/(app)/dashboard/meal-plan/_components/meal-plan-client.tsx` |
| `meal_plan_finalised` | User saves/finalises their meal plan | `src/app/(app)/dashboard/meal-plan/_components/meal-plan-client.tsx` |
| `meal_plan_shared_with_household` | User shares their meal plan with a household | `src/app/(app)/dashboard/meal-plan/_components/meal-plan-client.tsx` |
| `shopping_list_generated` | User generates a shopping list from a meal plan | `src/app/(app)/dashboard/meal-plan/_components/meal-plan-client.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://eu.posthog.com/project/152195/dashboard/601097
- **Meal plan conversion funnel** (generated → finalised → shopping list): https://eu.posthog.com/project/152195/insights/IqKtCnmc
- **Recipe additions over time** (imported vs manually created): https://eu.posthog.com/project/152195/insights/uupVpQ7E
- **Household adoption** (created, invites accepted, recipes shared): https://eu.posthog.com/project/152195/insights/z66bHjKv
- **Recipe import source breakdown** (URL vs text vs photo): https://eu.posthog.com/project/152195/insights/hZp8BIsC
- **Recipe deletion (churn signal)**: https://eu.posthog.com/project/152195/insights/r0z1RTfD

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
