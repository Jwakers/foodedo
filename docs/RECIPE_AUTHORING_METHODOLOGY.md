# Recipe authoring methodology (system-quality & super-user generation)

This document captures a **repeatable process** for designing recipes that fit Foodedo’s **system recipe** pipeline: schema-safe data, shopping-list reconciliation, and migrations. Use it when inventing **one-off thematic recipes** (creative briefs) and when building a **super-user recipe generation** feature so outputs stay consistent.

For **bulk dinner generation** (many recipes, distribution rules), use [`RECIPE-GENERATION-PROMPT.md`](RECIPE-GENERATION-PROMPT.md). This methodology **overlaps** those constraints but adds **brief interpretation, technique research, and meal-composition** steps that batch prompts under-specify.

---

## 1. Lock the brief (constraints and anti-patterns)

- **Must-haves**: e.g. protein, format (wrap / bowl / traybake), flavour lane (Asian accents), specific ingredients (cucumber).
- **Anti-patterns**: e.g. “not schnitzel”—reject techniques that are **thematically or effort-mismatched** (heavy three-stage breading for a casual wrap).
- **Implicit goals**: weeknight realism, UK supermarket availability, family-friendly tone (aligned with `RECIPE-GENERATION-PROMPT.md`).

Write the brief in plain language first; only then choose cooking technique.

---

## 2. Align with the data model before writing ingredients

System seeds live in [`convex/lib/systemRecipes.ts`](../convex/lib/systemRecipes.ts) as `SystemRecipeSeed`. Hard rules:

- **Categories, cuisines, primary protein, complexity, units, preparations** must match [`convex/lib/constants.ts`](../convex/lib/constants.ts) (and thus [`convex/schema.ts`](../convex/schema.ts)).
- **Cuisine**: at most **two** values (fusion cap).
- **Units / preparation**: only values allowed by the schema unions—never invent a unit string.

If the feature generates user recipes instead of seeds, the same unions apply wherever the UI or API validates.

---

## 3. Choose technique to match format and effort

- Ask: **Does this cooking path belong on the plate?** (A wrap wants **fast assembly**; a deep breaded cutlet stack fights that.)
- When the obvious technique is wrong, **research alternatives**: authoritative home-cook or regional sources (e.g. a **light starch coat** and shallow-fry for thin, crispy pork without full breading—common in Chinese-style crispy / salt–pepper pork). That is **technique**, not something to headline for eaters.
- Prefer **one primary cooking story** for the protein; put optional shortcuts in **description or final method note** (e.g. leftover crispy strips) without derailing the main recipe.

---

## 4. Meal composition (satiety and balance)

For **dinner-class** recipes, sanity-check **layers**:

| Layer | Role | Examples |
|--------|------|----------|
| Protein | Centre | Pork strips, tofu, chicken |
| Fresh / acid | Cut richness | Cucumber, pickle, lime (method copy) |
| Bulk | Satiety | Noodles, rice, beans, generous veg |
| Sauce | Identity | Hoisin–sesame mayo, curry, yogurt |
| Crunch / fat (optional) | Satisfaction | Peanuts, sesame, fried shallots |

**Cucumber + protein + wrap alone** is often **too light** for dinner; add **at least one** bulk or pickle/herb/peanut layer that fits the **same culinary story** (e.g. quick vinegar pickle + extra shredded cabbage + coriander). **Rice vermicelli inside rice-paper rolls** is classic; **noodles inside flour tortillas** is less traditional—use only when it genuinely fits the brief.

---

## 5. Theme coherence

- **Title and description** should promise what the method delivers.
- **Titles and `publicSlug`s** are user-facing: lead with **appetising outcomes** (crispy pork, hoisin, wraps)—not **utilitarian pantry items** (cornflour, cornstarch) that only exist to get texture.
- **Descriptions** stay in normal recipe voice: avoid meta lines like “eats like a main”—**category** (e.g. dinner) already signals meal type.
- **Cuisine tags** should reflect **flavour and technique**, not every ingredient.
- **Ingredient wording**: UK-friendly terms where the rest of the app uses them (courgette, coriander, etc.); keep **consistent naming** with existing rows in `systemRecipes.ts` and the ingredient catalog when possible.

---

## 6. Ingredient lines and catalog reconciliation

- Shopping lists resolve **`ingredientId`** from names via seed/catalog rules. Prefer names that **match or alias** entries in [`convex/ingredients-seed.json`](../convex/ingredients-seed.json) and [`convex/ingredients-seed-manual.json`](../convex/ingredients-seed-manual.json).
- After adding or changing system recipe lines on a deployment, run **`migrations:reconcileIngredientReferences`** (and **`backfillMethodStepIngredientRefs`** when applicable)—see [`AGENTS.md`](../AGENTS.md).

---

## 7. Method writing

- **Ordered steps**: prep protein → cook protein → sauces/sides → assemble.
- **Don’t list pantry salt/pepper/generic “oil”** as ingredients if your house style treats them as implied—name specific oils (sesame, vegetable) when they’re material; match [`RECIPE-GENERATION-PROMPT.md`](RECIPE-GENERATION-PROMPT.md) if in doubt.
- **Times**: `prepTime`, `cookTime`, sensible `serves`; nutrition optional but useful for generator UX.

---

## 8. Shipping system recipes to Convex

- New row: new stable **`_id`** (Convex-style id, unique in file and DB), **`source: "system"`**, no **`image`** until you upload later if desired.
- Optional **`publicSlug`**: kebab-case, unique among system recipes; migration can allocate from title if omitted.
- After deploy, run **`migrations:patchSystemRecipesFromFile`**, then **`migrations:assignSystemRecipePublicSlugs`**, on the target deployment so the DB matches the file and slugs stay unique (exact CLI names and notes: [`AGENTS.md`](../AGENTS.md)).

---

## 9. Exemplar (how this doc was exercised)

**Brief**: Crispy pork + cucumber + wrap + Asian sauce; **not** schnitzel-style; still crispy; filling enough for dinner.

**Technique**: Brief soy/sherry-style marinade, **cornflour** dust, **shallow-fry** (not flour–egg–breadcrumbs)—named in ingredients/method only, **not** in title or slug.

**Composition**: Hoisin–sesame mayo + cucumber + **quick-pickled carrot/daikon** + **generous cabbage** + **herbs** + **peanuts** (noodles omitted—flour-tortilla filling leans fusion; vermicelli belongs more naturally in rice-paper rolls).

**Data**: `SystemRecipeSeed` fields only; cuisines like `chinese` / `vietnamese` within the two-tag cap; complexity **simple** or **moderate** by honest effort.

---

## Super-user product note

A future **super-user recipe generator** should encode this as **checklist steps** or **LLM system constraints**: brief → anti-patterns → schema validation → technique justification → composition audit → catalog name check → method order → migration hints. That keeps generated drafts **editable but not broken** when saved into Convex.
