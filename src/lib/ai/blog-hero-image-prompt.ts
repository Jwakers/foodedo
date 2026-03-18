export const BLOG_HERO_IMAGE_STYLES = [
  "generalAuto",
  "finishedDish",
  "ingredientsFlatlay",
  "techniqueCloseup",
  "lifestyleTableScene",
  "minimalStillLife",
] as const;

export type BlogHeroImageStyle = (typeof BLOG_HERO_IMAGE_STYLES)[number];

/**
 * Intent helpers used by the blog hero image generator.
 *
 * This is intentionally exported for potential reuse in future UI/features
 * (e.g. more deterministic “intent controls”), even though the current
 * prompt builder primarily relies on style + optional override prompt.
 */
export type BlogHeroIntent =
  | "shoppingList"
  | "mealPlanning"
  | "recipeDish"
  | "technique"
  | "ingredients"
  | "general";

export type BlogHeroImageOverrideArgs = {
  title: string;
  excerpt?: string | null;
  overridePrompt: string;
  variationHint?: string | null;
};

export function buildBlogHeroImagePromptOverride(
  args: BlogHeroImageOverrideArgs,
): string {
  const title = args.title.trim();
  const excerpt = (args.excerpt ?? "").trim();
  const custom = args.overridePrompt.trim();
  const variation = (args.variationHint ?? "").trim();

  return `You are a professional food + lifestyle photographer creating a single hero image for a cooking blog post.

BLOG POST TITLE:
${title}

BLOG POST EXCERPT:
${excerpt || "(no excerpt provided)"}

CUSTOM USER IMAGE DIRECTION (OVERRIDES STYLE/INTENT SELECTION):
${custom}

HARD CONSTRAINTS (must follow):
- No readable text at all (no words, numbers, labels, or brand text). Checkboxes are allowed only if they contain no words/numbers.
- No logos or watermarks.
- No UI screenshots.
- One single realistic photograph-style image.

VARIATION HINT (optional, helps avoid repeating the exact same scene):
${variation || "- Change camera angle and background subtly; keep it hero-friendly."}

OUTPUT:
- Return only the image (no text overlays).`;
}

/**
 * Infers a rough blog intent signal from title/excerpt.
 *
 * Kept exported for future feature work (and for any external consumers)
 * even if the current hero prompt no longer injects an intent block.
 */
export function inferBlogHeroIntent(
  title: string,
  excerpt?: string | null,
): BlogHeroIntent {
  const text = `${title} ${excerpt ?? ""}`.toLowerCase();

  // Intent ordering matters: shopping lists & grocery lists are strong signals.

  if (
    /(meal plan|meal planning|meal-plann|weekly plan|planning meals)/.test(
      text,
    )
  ) {
    return "mealPlanning";
  }

  if (
    /(carryover|resting|sear|baste|temperature|how to|technique|crispy|crisp)/.test(
      text,
    )
  ) {
    return "technique";
  }

  if (/(ingredient|ingredients|pantry|spice|produce)/.test(text)) {
    return "ingredients";
  }

  if (
    /(recipe|cook|bake|roast|fry|sauce|chicken|beef|pasta|thighs|cooking)/.test(
      text,
    )
  ) {
    return "recipeDish";
  }

  return "general";
}

type BuildBlogHeroImagePromptArgs = {
  title: string;
  excerpt?: string | null;
  style: BlogHeroImageStyle;
  variationHint?: string | null;
};

export function buildBlogHeroImagePrompt(
  args: BuildBlogHeroImagePromptArgs,
): string {
  const title = args.title.trim();
  const excerpt = (args.excerpt ?? "").trim();
  const variation = (args.variationHint ?? "").trim();
  // No deterministic intent block here: use style selection + optional override
  // to steer composition so results don't converge to a single motif.

  const styleBlock = (() => {
    switch (args.style) {
      case "generalAuto":
        return `STYLE TARGET: General (auto)
- Pick ONE scene type for variety: finished plated dish OR ingredient flatlay OR technique close-up OR lifestyle table scene OR minimal still life.
- Do NOT default to shopping list/planner/clipboard checklist artifacts in general mode.
- Choose a composition that best matches the blog title/excerpt without falling back to generic countertop prep.`;
      case "finishedDish":
        return `STYLE TARGET: Finished dish hero
- Show the final plated dish as the clear subject
- Avoid prep scenes (no chopping boards, no raw mise-en-place, no hands)
- Garnish subtly; keep it believable`;
      case "ingredientsFlatlay":
        return `STYLE TARGET: Ingredients flatlay
- Overhead flatlay of key ingredients (raw or minimally prepped)
- Clean layout with 5–10 ingredients, no clutter
- Avoid showing a full finished dish`;
      case "techniqueCloseup":
        return `STYLE TARGET: Technique close-up
- Close-up of a key technique moment that matches the post topic (e.g. searing, basting, resting)
- No hands/faces, no readable branding, no text
- Make it feel like a cookbook detail shot`;
      case "lifestyleTableScene":
        return `STYLE TARGET: Lifestyle table scene
- Finished dish in a realistic home setting (table, linen, cutlery)
- Warm, inviting, but still minimal and premium
- Avoid busy countertops or chaotic kitchens`;
      case "minimalStillLife":
        return `STYLE TARGET: Minimal still life
- One primary hero subject matching the blog title/excerpt with lots of negative space
- Ultra-clean, premium editorial mood
- No prep scenes, no clutter, no multiple competing objects`;
      default: {
        const _exhaustive: never = args.style;
        return _exhaustive;
      }
    }
  })();

  return `You are a professional food + lifestyle photographer creating a single hero image for a cooking blog post.

BLOG POST TITLE:
${title}

BLOG POST EXCERPT:
${excerpt || "(no excerpt provided)"}

STYLE:
- Editorial food photography, modern and premium
- Soft natural light, warm appetising tones
- Shallow depth of field, subject in focus
- Clean background, minimal props (no clutter)
- No hands, no faces, no logos, no watermarks
- No readable text. Avoid checklists/planners by default; if any checkboxes appear, ensure there are no words/numbers.
- Avoid UI screenshots, packaging with readable branding, or over-styled AI artifacts
- Avoid repeating the same “food prep on a kitchen counter” scene; choose a composition that matches the STYLE TARGET below.

${styleBlock}

COMPOSITION:
- Designed as a hero/header image (wide framing)
- One clear subject that matches the post topic
- Keep space for site UI margins (don’t crop too tight)
${variation ? `\nVARIATION HINT (use this to vary the scene):\n- ${variation}\n` : ""}

OUTPUT:
- One single realistic photograph-style image
- No readable text of any kind (no words/numbers). Checkboxes/blank planner blocks are allowed.
`;
}
