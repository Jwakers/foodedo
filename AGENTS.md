# Agent Rules

Project-specific guidance for AI agents. Apply these rules when working in this codebase.

## Skills & context

- For frontend design work—building web components, pages, or interfaces—read and apply the guidance in `ai/skills/frontend-design/SKILL.md`.

## Styling & Tailwind

- When writing dynamic class names, use the `cn` function from `src/lib/utils.ts` instead of string concatenation.
- Use the `size-*` utility when width and height are the same (e.g. `size-4` instead of `w-4 h-4`).

## Components & UI

- Prefer existing UI primitives (e.g. `src/components/ui/dialog.tsx`) before creating new ones.
- Avoid modifying the button component directly. If a variant is missing, leave a comment and a new variant can be added.

## Data & schemas

- Reuse existing schemas (e.g. recipes) where possible instead of defining new ones for each function.

## Convex ops (ingredients & recipes)

Internal mutations live in [`convex/migrations.ts`](convex/migrations.ts). Run against the intended deployment (e.g. with `npx convex dev` or your prod target).

- **`migrations:seedIngredients`** — Upserts the canonical ingredients catalog from [`convex/ingredients-seed.json`](convex/ingredients-seed.json) and [`convex/ingredients-seed-manual.json`](convex/ingredients-seed-manual.json). Use for new environments or after changing seed data.
- **`migrations:reconcileIngredientReferences`** — Re-resolves `ingredientId` on recipe ingredient lines and shopping list items from the current ingredients table. Scheduled automatically after admin ingredient edits; can be run manually after bulk alias or catalog changes.
- **`migrations:backfillMethodStepIngredientRefs`** — One-off batched migration: fills `method[].ingredientRefs` and `ingredientRefsSource`, maps legacy `method[].ingredientIds` where present, and strips old step-level canonical ids. Run once after deploying the method-step schema change; safe to re-run (skips recipes already aligned). The schema still allows optional deprecated `method[].ingredientIds` until this has run everywhere; after all documents are patched, remove that field from [`convex/schema.ts`](convex/schema.ts).
- **Reseed workflow (rare)** — If you replace the ingredients catalog such that Convex ingredient document ids change: `clearRecipeIngredientIds` (still in `migrations.ts`) clears line-level links; then re-seed, run `backfillRecipeIngredientIds` if present, then `reconcileIngredientReferences` and re-run **`backfillMethodStepIngredientRefs`** so method refs stay valid.
- **`migrations:patchSystemRecipesFromFile`** — Syncs system recipes from [`convex/lib/systemRecipes.ts`](convex/lib/systemRecipes.ts) (ingredients/method and related fields from the file). **New** system rows get a unique **`publicSlug`** on insert; existing rows are not updated here (use `assignSystemRecipePublicSlugs` to backfill or realign slugs).
- **`migrations:assignSystemRecipePublicSlugs`** — Assigns unique **`publicSlug`** on every system recipe from **current DB** titles (optional per-id override from `publicSlug` in the seed file when the `_id` matches). Patches only `publicSlug`. Run after deploy when adding discover slugs or changing slug rules; safe to re-run.
