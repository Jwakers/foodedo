# Foodedo - Family Meal Planning Made Simple

---

## Environment variables

### Sanity (blog and draft creation)

- **`NEXT_PUBLIC_SANITY_PROJECT_ID`** – Sanity project ID (required for blog reads and draft creation).
- **`NEXT_PUBLIC_SANITY_DATASET`** – Sanity dataset (default: `production`).
- **`SANITY_API_WRITE_TOKEN`** – (Server-only.) API token with write access to the dataset. Required for the “Create draft in Sanity” button in the admin blog generator. Do not expose this in client-side code.
- **`NEXT_PUBLIC_SANITY_STUDIO_URL`** – (Optional.) Base URL of your Sanity Studio (e.g. `https://your-project.sanity.studio`). When set, the blog generator shows an “Open in Studio” link after creating a draft.

### AI image generation (admin tools)

- **`AI_GATEWAY_API_KEY`** – (Server-only.) Required for AI SDK `generateImage()` calls (used by the “Blog images” admin tool to generate hero images). Get a key from Vercel AI Gateway.

---

## Next steps & backlog

### Strategic / growth

- [ ] Plan and prioritize an SEO/AEO strategy; improving organic reach is a high priority. **Execution checklist + scoreboard:** [`docs/GROWTH.md`](docs/GROWTH.md).
- [ ] Move all support documentation to public URLs.
- [ ] Try out [Indie App Circle](https://www.indieappcircle.com/) too.
- [ ] Launch on Product Hunt (market as HelloFresh without the food delivery).
- [ ] Set up notifications (what and when), add user-controllable settings, and note in `AGENTS.md` to consider notifications when new relevant features are added.
- [ ] Olive oil in the herbs and spices category??? (ingredient catalog / grouping)

### Urgent / high-priority bugs

- [ ] Fix the “frozen WebView” state when the app sits idle for a while.
- [ ] Meal picker on mobile for meal plan: add safe area inset for the close button.
- [ ] Overflow on sign-in page on iPhone.

### Meal plan, sharing, and shopping

- [ ] Meal plans should be shared to households automatically.

### Chalkboard and UI friction

- [ ] Users cannot delete other users’ items from shared chalkboards.

### PWA, install, and Safari

- [ ] Newer Safari: “Add to Home Screen” is harder to find — richer guidance; evaluate a package that adapts to environment/Safari version.
- [ ] Persistent banner when users sign in via browser to guide installation (PWA).

### Recipe import, processing, and editing

- [ ] Photographing recipes is slow — speed up processing, improve loading indicators, add copy that images take longer.
- [ ] Notify users when recipe processing has finished so they can leave the page without losing the recipe.
- [ ] A sticky save header when editing a recipe: add safe area inset (mobile).
- [ ] Import recipe: controls to switch between URL, text, and photo modes.
- [ ] Sources like The Wicked Cookbook: pro tips not carried into converted recipes — add recipe notes (or equivalent).
- [ ] Restore or add share for recipes (PWA/Web Share API or fallback).

### Features (later / Pro)

- [ ] AI assistant (Pro): alternatives, complementary recipes, drinks, etc.
- [ ] After weekly meal plan selection: summarize vegetables / healthy proteins / starches and surface a health score (very late-stage).
- [ ] Recipes that imply marination on the meal plan: notify the user the day before cook day.

### User feedback – Import experience (post-import UX)

Feedback: Import feels reliable, and the edit page is clear, but the biggest opportunity is what happens _after_ import. Users want to feel confident hitting Save without having to guess what to check. The moment after import should feel rewarding, not neutral.

- [ ] **Post-import guidance**: On the import confirmation/edit screen, highlight which fields usually matter most to review (e.g. servings, total time, category).
- [ ] **Post-import emotional payoff**: Reinforce that the user saved time and added something valuable (e.g. light celebration, “ready to cook later” messaging).
- [ ] **Reduce friction to Save**: So users can hit Save quickly through guidance and payoff, not endless re-checking.

### User feedback – Additional (Feb 2025)

Feedback: Users like the recent image-to-diagram and weekly plan features. Strong interest in food-sharing community and AI enhancements.

**Features / ideas**

- [ ] **Food-sharing community**: Community layer; consider for roadmap.
- [ ] **AI enhancements**: Nutrition analysis, cooking suggestions, personalized recipe recommendations.

**Bugs / improvements**

- [ ] **Web import accuracy**: Parser robustness for edge cases.
- [ ] **Recipe image quality**: Review handling/compression/resolution vs source sites.
- [ ] **404 on login**: Intermittent 404 when logging in; investigate and fix.

### Social, SEO and AEO

- Confirm branding identity, logo and name etc.
- Set up social channels: TikTok and X.

---

## Bug tracking

- [ ] **Recipe back button**: Often appears “missing” because it only renders when `document.referrer` is same-origin; direct links and external referrers hide it — improve UX beyond this heuristic.
- [ ] Ingredients duplicated across recipe sections (e.g. [salmon kilaw](https://www.greatbritishchefs.com/recipes/salmon-kilaw-recipe)): dedupe in parsing and/or section ingredients (sauce, garnish, etc.).
- [ ] Parser oddities (e.g. `0.5 Whole Lime`) on some imports — same recipe link above.
- [ ] Overflow on shopping list page (iOS).
- [ ] Recipe page loading skeleton overflows.
- [ ] Deleting a household surfaces a client error; redirect or 404 instead.
- [ ] “Back to dashboard” on the error page does not work reliably.
- [ ] Occasionally redirected to 404 after signing in.

---

## Tech debt

- [ ] Image upload: decouple from FE with hooks and reusable upload components.
- [ ] Shopping list: refactor — state at root, smaller components, optimistic updates (do carefully, not as a blind AI pass).

---

## Minor updates

- [ ] Recipe description: clamp or reflow on mobile.
- [ ] My recipes: pagination (e.g. 20 per page).
- [ ] Client-side image compression before upload (`browser-image-compression`).
- [ ] Utility to output image size strings.
- [ ] Recipe page: “Mise en place” from ingredients that have preparation set.
- [ ] Units/prep pickers: categories, shared across forms (table-style UI).
- [ ] Sign-in / sign-up: dark mode + feel native to the site (see also urgent sign-in overflow above).
- [ ] OpenGraph meta on all relevant pages.
- [ ] Separate 404 for marketing site vs app (redirects and copy).
- [ ] Pages that are server-only for metadata + client child: consider moving logic into layouts (see invitations page pattern).
- [ ] Add-recipe entry point from anywhere (dedicated page or app-level context).
- [ ] Theme menu: dropdown opens awkwardly downward; open upward or improve placement.
- [ ] Pricing: mention free trial on the Pro plan.
- [ ] Support pages nested under public marketing site.

---

## Major updates

- [ ] Sharp + Convex image transforms + Next.js `Image` loader for sized delivery.
- [ ] Convex endpoint for uploads with strict limits.
- [ ] Macros on recipe schema + AI “generate macros”; scraper nutrition when available.
- [ ] KV or cache for AI-parsed recipes to avoid duplicate work.
- [ ] AI image upscaler (Pro).
- [ ] Stream AI responses (human-readable pass + structured JSON pass).
- [ ] Share-to-app: deep link into import URL with confirm dialog.
- [ ] Recipe notes table (`by_recipe_id` index); private to user, clear in UI (overlaps backlog “Wicked” pro tips).
- [ ] Invites open the installed app (protocol handlers / PWA wrapper).
- [ ] Multi-tenant routing: e.g. app subdomain + main domain for marketing.
- [ ] AI helper: vectors over user data, meal plans, shopping lists, variety across weeks (see also backlog AI assistant).

---

## Development roadmap

High-level status: core app, households, shopping lists, chalkboard, meal planning, and AI import are in use. Below keeps **open** work explicit; much of the MVP track is already shipped.

### Foundation (shipped)

Next.js App Router, Tailwind, shadcn/ui, Clerk, Convex (users, recipes, ingredients, households, shopping lists, chalkboard), theme, marketing + auth pages, dashboard, recipe create/edit, units, PWA plugin, installation hints, Discover/recipe browsing via server rendering.

### MVP (0–4 months) — remaining

#### Recipe management

- [ ] Scale ingredients (serves modifier).
- [ ] Metric/imperial conversion + user default.
- [ ] **Recipe tags**: dietary + cuisine signals from ingredients.
- [ ] **Ingredient categories**: meat, poultry, spice, etc. (or external DB + custom).

#### Shopping list

- [ ] **Ingredient deduplication**: smarter merging.
- [ ] Normalise units for combining lines.
- [ ] **Additional items** (beyond recipes/chalkboard flows).

#### Kitchen chalkboard

_Shipped: personal/household boards, CRUD, merge into shopping lists with scheduled removal._

#### Dashboard

_Shipped: onboarding / how-to._ Open:

- [ ] Recent recipes surfacing.
- [ ] Shopping list summary/widgets.

#### Household collaboration

_Shipped: `households` schema, create/join, recipe sharing, collaborative lists, email invites._ Open:

- [ ] Notifications for relevant actions (depends on PWA notifications).

#### AI features

_OpenAI in use for parsing._ Open:

- [ ] **Basic meal suggestions** from preferences/pantry.

#### PWA and offline

_Shipped: PWA plugin, manual text import, install hints._ Open:

- [ ] Offline caching (IndexedDB).
- [ ] Offline-first core flows.
- [ ] Notifications system.

### Post-launch phase 1 (4–8 months)

#### Recipe enhancement

- [x] **Recipe editing** (in-app edit + save).
- [ ] **Recipe cloning** with modifications.
- [ ] **Recipe versioning**.
- [ ] Recipe notes (see Major updates / backlog).
- [ ] Ingredient grouping (sauce, marinade, etc.).

#### Meal planning

- [ ] **Meal plan calendar** (extend beyond current weekly flow if needed).
- [ ] **Calendar sync** (Google/Apple).
- [ ] **Meal plan templates**.

#### Personalization

- [ ] Dietary preferences.
- [ ] Allergy management.
- [ ] Nutritional information.

#### Enhanced collaboration

- [ ] Voting on meals.
- [ ] Shopping task assignment.
- [ ] Chalkboard enhancements for non-weekly items.

#### Gamification

- [ ] Streaks, achievements, weekly challenges.

### Post-launch phase 2 (9–15 months)

#### Social

- [ ] Recipe feed, discovery, ratings.

#### Content and SEO

- [ ] Blog, recipe SEO, admin content tools.

#### Advanced AI

- [ ] Cook with what you have, advanced meal planning, recommendations.
  — Shipped: Photograph cookbooks → saved recipes.

#### Integrations

- [ ] Grocery delivery partners.
- [ ] Calendar and smart-home integrations.

#### Advanced features

- [ ] Community challenges, AI-first UX, native wrappers (Capacitor/Expo).

---

## Technical implementation notes

### Current tech stack

- **Frontend**: Next.js 16 (App Router), Tailwind CSS, shadcn/ui
- **Backend**: Convex (DB + realtime sync)
- **Auth**: Clerk (Google + email)
- **File storage**: Convex file storage
- **AI**: OpenAI (e.g. GPT-4o-mini) for parsing and related flows
- **Hosting**: Vercel (frontend), Convex (backend)

### Database schema status (Convex)

- `users` (Clerk-linked)
- `recipes`, `ingredients`
- `households`, household membership and invites
- `shoppingLists`, `shoppingListItems`
- `chalkboardItems` (personal and household boards)
- Plus meal plans, blog-related tables, etc. — see [`convex/schema.ts`](convex/schema.ts) for the full source of truth.

---

## Key metrics to track

- Weekly active households
- % of users creating shopping lists weekly
- Recipe saves per user
- Retention after 4 weeks
- Kitchen chalkboard usage

---

## Business goals

- **Positioning**: AI-powered collaborative meal planner for households
- **Target**: Young couples, families, fitness-focused individuals
- **Value prop**: Save time, reduce stress, discover meals together
- **Differentiator**: Household-first focus with kitchen chalkboard
