# Blog Creation Brief — Foodedo

**Purpose of this document:** Use this brief when creating or structuring blog content for Foodedo. It is intended for AI assistants and agents to ensure every post is optimized for **SEO** and **AEO** (Answer Engine Optimization) and aligned with the product. Treat SEO and AEO as the primary goals of the blog.

---

## 1. Product & Branding

- **App name:** **Foodedo** (use exactly this spelling and capitalization everywhere).
- **Tagline:** Family Meal Planning Made Simple.
- **What Foodedo does:** Meal planning and recipe management for families — weekly plans, shopping lists, recipe import, household sharing, chalkboard notes, and discovery of public recipes.
- **Audience:** Families and home cooks who want to plan meals, save recipes, and reduce stress around “what’s for dinner.”

All blog content should support this product and audience. Mention Foodedo by name where it’s natural (e.g. “with Foodedo you can…”), and keep the tone helpful, practical, and family-oriented.

---

## 2. SEO Requirements (Mandatory)

### 2.1 Title & Slug

- **Title:** Clear, specific, and keyword-led. Include the main target keyword near the front when it reads naturally. Avoid vague or clickbait phrasing.
- **Slug:** Derived from the title: lowercase, hyphens, no stop words unless needed for clarity. Must be unique and readable (e.g. `how-to-meal-plan-for-busy-families`).
- **Length:** Title ideally 50–60 characters for SERP display; slug concise but descriptive.

### 2.2 Meta Description (Excerpt)

- **Length:** 150–160 characters. This is used as the meta description and often as the excerpt on listing pages.
- **Content:** One clear value proposition or takeaway. Include the primary keyword and a light call-to-action or outcome (e.g. “Learn how to…” or “Get a simple system for…”).
- **Unique:** Every post must have a unique excerpt; no copying from other posts or from the first line of the body.

### 2.3 On-Page Structure

- **One H1 per post:** The post title. No other H1.
- **Logical heading hierarchy:** H2 → H3 (no skipping levels). Headings should be descriptive and keyword-aware so they work as scannable outline and SERP/snippet fodder.
- **First paragraph:** Directly address the topic and, where possible, include the main keyword in the first 100 words.
- **Internal links:** Where relevant, link to other blog posts or key site pages using the public URLs below. Use descriptive anchor text (avoid “click here” or “read more” as sole anchor). See **§2.5 Inline links & public URLs** for format and full list.

### 2.4 Technical / CMS Fields

Content is stored in Sanity. Each post has:

- **title** (string)
- **slug** (slug, from title)
- **excerpt** (text, 150–160 chars for meta description)
- **mainImage** (image; required for social/OG)
- **body** (Portable Text / block content)
- **publishedAt** (datetime)

Ensure every post has a unique slug, a compelling excerpt, and a main image so metadata and social sharing render correctly.

### 2.5 Inline links & public URLs

**Format:** Use **relative paths** only (no domain). Links should start with `/` and match the paths below. Examples: `[Try Foodedo](/sign-up)`, `[our pricing](/pricing)`, `[Discover recipes](/discover)`, `[How to start meal planning](/blog/how-to-start-meal-planning)`.

**When to link:** Add inline links where they help the reader take a clear next step (e.g. sign up, see pricing, read another post, browse discover). Prefer 1–3 relevant internal links per post; anchor text should describe the destination (e.g. “weekly meal plan” → `/blog/how-to-use-foodedo-weekly-meal-plan` or “Discover” → `/discover`).

**Exhaustive list of public URLs** (safe to use in blog content; do not require sign-in; most are indexable — except `/sign-in`, which has `robots: { index: false }`):

| Path                    | Use when                                                                                                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                     | Homepage; “Foodedo”, “our site”, “get started”.                                                                                                                        |
| `/sign-in`              | Sign in, log in, returning users. (Not indexable.)                                                                                                                     |
| `/sign-up`              | Sign up, create account, try Foodedo, get started.                                                                                                                     |
| `/pricing`              | Plans, pricing, upgrade, cost.                                                                                                                                         |
| `/privacy`              | Privacy policy, data, how we use information.                                                                                                                          |
| `/terms`                | Terms of service, terms and conditions.                                                                                                                                |
| `/beta`                 | Beta programme, early access, “we’re in beta”.                                                                                                                         |
| `/blog`                 | Blog index; “our blog”, “more articles”, “tips”.                                                                                                                       |
| `/blog/{slug}`          | Link to another post; use the post’s slug (e.g. `/blog/how-to-start-meal-planning`).                                                                                   |
| `/discover`             | Discover recipes, browse recipes, public recipe gallery.                                                                                                               |
| `/discover/recipe/{ID}` | A specific public (system) recipe; use the recipe’s Convex document ID for `{ID}` (e.g. `/discover/recipe/abc123xyz`). Only use when linking to a known system recipe. |

**App / dashboard URLs** (signed-in users go straight there; others are redirected to sign-up — use these in blog copy when the CTA is product-led):

| Path                       | Use when                                                                                 |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| `/dashboard`               | Dashboard, “your Foodedo”, home after sign-in.                                           |
| `/dashboard/meal-plan`     | Weekly meal plan, plan your week.                                                        |
| `/dashboard/my-recipes`    | My recipes, recipe library, saved recipes.                                               |
| `/dashboard/shopping-list` | Shopping list, build your list.                                                          |
| `/dashboard/chalkboard`    | Chalkboard, pantry list, “need by end of week”.                                          |
| `/dashboard/import-recipe` | Import a recipe, add from URL.                                                           |
| `/dashboard/create-recipe` | Create recipe, add recipe from scratch.                                                  |
| `/dashboard/households`    | Households, sharing, invite family.                                                      |
| `/recipe/{id}`             | A specific recipe (user or app context); use the recipe’s Convex document ID for `{id}`. |

**Dashboard and app URLs in blog copy:** You may and are encouraged to link to dashboard and app-only paths (e.g. `/dashboard/meal-plan`, `/dashboard/my-recipes`, `/recipe/{id}`) in blog copy. If the reader is not signed in, these links will redirect them to the sign-up page, which supports conversion. Use them when the CTA is clearly product-led (e.g. “Build your [weekly meal plan](/dashboard/meal-plan)” or “Add it to [My recipes](/dashboard/my-recipes)”).

---

## 3. AEO Requirements (Answer Engine Optimization)

The blog should be written so that **search engines and AI answer engines** (e.g. Google SGE, Perplexity, ChatGPT search, voice assistants) can easily extract clear, accurate answers. AEO is as important as traditional SEO.

### 3.1 Direct Answers Up Front

- **Opening:** State the core answer or definition in the first 1–2 paragraphs. Don’t bury the main point.
- **Featured-snippet style:** For “how to,” “what is,” or “why” topics, provide a short, direct answer (2–4 sentences or a short list) near the top, then expand in the rest of the post.

### 3.2 Question-Friendly Structure

- **Subheadings as questions:** Where it fits, use H2/H3 phrased as the exact question people ask (e.g. “How do I meal plan on a budget?” or “What is batch cooking?”). This helps match query intent and snippet selection.
- **FAQ-style sections:** For posts that cover multiple related questions, consider a clear “Common questions” or FAQ section with concise, standalone answers. These are often used for rich results and AI citations.

### 3.3 Clear, Citeable Statements

- **One idea per paragraph:** Keep paragraphs short (2–4 sentences). Makes it easier for engines to extract a single, citeable fact.
- **Definitions:** When introducing a term (e.g. “meal prep,” “batch cooking”), give a clear one-sentence definition early.
- **Lists and steps:** Use ordered lists for steps and unordered lists for options or tips. Format consistently so steps can be quoted as “Step 1: …”, “Step 2: …”, etc.
- **Numbers and specifics:** Prefer concrete numbers and timeframes (e.g. “plan for 30 minutes each Sunday”) over vague phrasing.

### 3.4 Entity and Context

- **Product name:** Use “Foodedo” consistently so answer engines associate the content with the product.
- **Topic clarity:** Make the post’s main topic obvious from the title, first paragraph, and headings so engines can classify and attribute the content correctly.

---

## 4. Content Pillars & Topics

Blog content should support discovery and trust in Foodedo. Priority topic areas:

- **Meal planning:** How to start, weekly planning, planning for busy families, saving time, reducing food waste.
- **Recipes & cooking:** Organising recipes, importing and saving recipes, family-friendly ideas, batch cooking, quick weeknight meals.
- **Shopping lists:** Building lists from meal plans, saving money, reducing trips to the shop.
- **Family & household:** Cooking for a family, involving kids, sharing plans and recipes with a partner or household.
- **Product-led tips:** How to use Foodedo (e.g. weekly plan, chalkboard, discover, shopping list) in a way that’s useful for SEO and AEO (e.g. “How to use the Foodedo weekly plan to save time”).

Avoid topics that don’t relate to meal planning, recipes, or family cooking; keep the blog focused so the site stays topically coherent for SEO and AEO.

---

## 5. Tone & Voice

- **Helpful and practical:** Focus on actionable advice. Readers should leave with something they can do (e.g. a tip, a system, a next step).
- **Inclusive and family-oriented:** Assume a range of family sizes, schedules, and skill levels. Avoid jargon; explain terms when needed.
- **Calm and reassuring:** Meal planning can feel overwhelming; the tone should reduce stress, not add to it.
- **Brand-aligned:** When mentioning Foodedo, be clear and benefit-led (e.g. “Foodedo helps you…” or “With Foodedo, you can…”). No hype or exaggeration.

**Readable, magazine-like prose:** It is encouraged to write with warmth and specific, human scenes (e.g. a believable weeknight moment) and varied rhythm, as long as you still meet the SEO/AEO structure in this brief (clear headings, direct answers, grounded numbers only—no invented studies or statistics).

---

## 6. Supplemental Guidance for AI / Agent Use

When an AI or agent is drafting or structuring a blog post using this brief:

1. **Resolve ambiguity up front:** If the request is vague (e.g. “write about meal planning”), infer a specific angle (e.g. “meal planning for busy parents”) and state it in the title and intro so the post has one clear focus.
2. **Output structure:** Prefer delivering:
   - **Title** (with suggested primary keyword)
   - **Slug** (lowercase, hyphenated)
   - **Excerpt** (150–160 characters, meta-friendly)
   - **Outline** (H2/H3 with short bullet points or one-line descriptions)
   - **Body** (full draft or key sections), with the main answer or definition in the first 1–2 paragraphs
   - **Suggested internal links** (use relative paths from §2.5, e.g. “Link ‘weekly plan’ to /blog/how-to-use-foodedo-weekly-meal-plan or /discover”)
3. **Keyword usage:** Use the target keyword in: title, excerpt, first paragraph, at least one H2, and naturally 1–2 times in the body. Avoid stuffing; readability and clarity come first.
4. **Snippet and AEO check:** Before finalising, ask: “Could a search engine or AI quote one sentence or one list from this post as the answer to the target question?” If not, add or tighten a direct answer near the top and/or in a clear list or FAQ.
5. **Factual accuracy:** Don’t invent statistics, studies, or product features. If specific data or features are needed, note “[verify with product/team]” or “[add source]” for the human editor.
6. **Canonical product name:** Always use **Foodedo** (not “Foodedo app,” “the Foodedo platform,” etc., unless the sentence truly requires it). Never use a different spelling or variant.

---

## 7. Checklist Before Publishing

- [ ] **App name:** “Foodedo” used correctly throughout.
- [ ] **Title:** Clear, keyword-aware, 50–60 characters where possible.
- [ ] **Slug:** Unique, lowercase, hyphenated, descriptive.
- [ ] **Excerpt:** 150–160 characters, unique, meta-description ready.
- [ ] **Main image:** Present and relevant (for OG/social).
- [ ] **H1:** Only the post title; no duplicate H1 in body.
- [ ] **Headings:** Logical H2 → H3 hierarchy; question-style where it fits.
- [ ] **Direct answer:** Main takeaway or definition in the first 1–2 paragraphs.
- [ ] **Lists/steps:** Used where they improve clarity and snippet potential.
- [ ] **Internal links:** At least one relevant link to another page or post with descriptive anchor text; use relative paths only and only public URLs from §2.5.
- [ ] **Tone:** Helpful, practical, family-oriented, and aligned with Foodedo.

---

_This brief is the single source of truth for blog structure and SEO/AEO when creating or editing Foodedo blog content. When in doubt, prioritise clarity for both humans and answer engines, and correctness of the product name and positioning._
