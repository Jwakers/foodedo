export const BLOG_HERO_IMAGE_STYLES = [
  "generalAuto",
  "finishedDish",
  "ingredientsFlatlay",
  "techniqueCloseup",
  "lifestyleTableScene",
  "minimalStillLife",
  "abstractConcept",
  "editorialIllustration",
  "boldColorGraphic",
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

  return `You are creating a single hero image for a cooking / food blog post.

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
- One single image. Photoreal, illustrated, or abstract—match the custom direction.

VARIATION HINT (optional, helps avoid repeating the exact same scene):
${variation || "- Vary composition, palette, and metaphor; keep it hero-friendly and wide."}

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

function isPhotorealFoodStyle(style: BlogHeroImageStyle): boolean {
  return (
    style === "finishedDish" ||
    style === "ingredientsFlatlay" ||
    style === "techniqueCloseup" ||
    style === "lifestyleTableScene" ||
    style === "minimalStillLife"
  );
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
- Choose ONE direction that best fits the title/excerpt (vary across generations):
  (A) Photoreal: finished dish, ingredient flatlay, technique close-up, lifestyle table, or minimal still life.
  (B) Non-photoreal: editorial illustration, abstract metaphor, or bold graphic interpretation of the topic.
- Do NOT always default to (A). When (B) fits equally well, prefer it for variety.
- Do NOT default to shopping list/planner/clipboard checklist artifacts.
- Avoid generic "vegetables on a counter" unless the topic truly demands it.`;
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
      case "abstractConcept":
        return `STYLE TARGET: Abstract / conceptual
- Non-literal visual metaphor for the post topic (calm weeknight rhythm, organisation, abundance, time saved—whatever fits)
- Soft gradients, organic shapes, subtle food-adjacent cues OK; avoid cluttered literal meals
- Gallery-like or premium editorial abstract; strong negative space`;
      case "editorialIllustration":
        return `STYLE TARGET: Editorial illustration
- Illustrated hero (not a photograph): mid-century editorial, gentle texture, warm palette
- Simplified forms, tasteful props or food shapes—readable mood without literal recipe photography
- Paper or print texture subtle OK; no typography`;
      case "boldColorGraphic":
        return `STYLE TARGET: Bold colour graphic
- High-impact graphic or risograph-inspired flat shapes, limited palette, strong composition
- Food or kitchen symbolism through shape and colour—not a realistic tabletop photo
- Energetic but clean; poster-like clarity for a wide hero`;
      default: {
        const _exhaustive: never = args.style;
        return _exhaustive;
      }
    }
  })();

  const photorealStyleSection = `STYLE:
- Editorial food photography, modern and premium
- Soft natural light, warm appetising tones
- Shallow depth of field, subject in focus
- Clean background, minimal props (no clutter)
- No hands, no faces, no logos, no watermarks
- No readable text. Avoid checklists/planners by default; if any checkboxes appear, ensure there are no words/numbers.
- Avoid UI screenshots, packaging with readable branding, or over-styled AI artifacts
- Avoid repeating the same “food prep on a kitchen counter” scene; choose a composition that matches the STYLE TARGET below.`;

  const generalAutoStyleSection = `STYLE:
- Premium blog hero: either editorial food photography OR illustrated / abstract / graphic—follow STYLE TARGET below to choose.
- Cohesive, warm palette when it fits the topic; clean composition; minimal clutter
- No hands, no faces, no logos, no watermarks
- No readable text. Avoid checklists/planners by default; if any checkboxes appear, ensure there are no words/numbers.
- Avoid UI screenshots. Do not default every time to the same tabletop or flatlay food scene.`;

  const stylizedStyleSection = `STYLE:
- Design-led or illustrated hero (not required to be a photograph)
- Warm, appetising palette when the topic is food or family meals; otherwise match the mood of the title
- Generous negative space for site header margins
- No hands, no faces, no logos, no watermarks
- No readable text. No UI screenshots.
- Avoid defaulting to the same tabletop-food motif; follow the STYLE TARGET below for art direction.`;

  const usePhotoreal =
    args.style !== "generalAuto" && isPhotorealFoodStyle(args.style);

  const styleSection =
    args.style === "generalAuto"
      ? generalAutoStyleSection
      : usePhotoreal
        ? photorealStyleSection
        : stylizedStyleSection;

  const outputLine =
    args.style === "generalAuto"
      ? `- One single image: photoreal food scene OR stylised illustration / graphic / abstract per STYLE TARGET`
      : usePhotoreal
        ? `- One single realistic photograph-style image`
        : `- One single stylised image (illustration, graphic, or abstract as per STYLE TARGET—not a generic food photo unless the target asks for it)`;

  return `You are creating a single hero image for a cooking / food blog post.

BLOG POST TITLE:
${title}

BLOG POST EXCERPT:
${excerpt || "(no excerpt provided)"}

${styleSection}

${styleBlock}

COMPOSITION:
- Designed as a hero/header image (wide framing)
- One clear focal idea that matches the post topic
- Keep space for site UI margins (don’t crop too tight)
${variation ? `\nVARIATION HINT (use this to vary the scene):\n- ${variation}\n` : ""}

OUTPUT:
${outputLine}
- No readable text of any kind (no words/numbers). Checkboxes/blank planner blocks are allowed only if completely unlabeled.
`;
}
