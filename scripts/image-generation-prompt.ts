/**
 * Prompt template for recipe food photography image generation.
 * Based on IMAGE-GENERATION-PROMPT.md.
 */

const IMAGE_GENERATION_PROMPT = `You are a professional food photographer tasked with generating a high-quality, consistent image of a cooked meal for a recipe app. Create an image based on the following:

RECIPE TITLE:
{{TITLE}}

RECIPE DESCRIPTION:
{{DESCRIPTION}}

METHOD (how the dish is made – use this to infer plating, garnishes, and final appearance):
{{METHOD_STEPS}}

STYLE GUIDELINES:

- Clean, natural food photography
- Soft natural lighting (window daylight)
- Warm, appetising tones
- Slight shallow depth of field (food in focus)
- Neutral background (wooden table / light marble etc)
- Simple plating (no distracting props)
- Close-crop that shows the whole meal
- No text overlays or logos

COMPOSITION GUIDELINES:

- Overhead or 45° angle depending on meal type
- If it's pasta/rice, use a rustic bowl
- If it's one-pan/tray bake, use a baking dish if visible
- If it's plated, center the main portion with interesting garnishes
- Garnish appropriate to cuisine and only if applicable (parsley for italian, lime/coriander for mexican/indian, etc.)

SIZE GUIDELINES

- Image must be large enough to serve as a hero image on a recipe landing page
- Image MUST be 4:3 aspect ratio

OUTPUT:
• One single image
• No text
• Realistic, appetising food photo

Generate a single image that fits these constraints.
`;

export type MethodStep = { title: string; description?: string | null };

export function buildImagePrompt(
  title: string,
  description: string,
  method: MethodStep[] = []
): string {
  const desc = description?.trim() || "A delicious home-cooked meal";
  const methodText =
    method.length > 0
      ? method
          .map(
            (step, i) =>
              `${i + 1}. ${step.title}${step.description ? `: ${step.description}` : ""}`
          )
          .join("\n")
      : "(No method steps provided)";
  return IMAGE_GENERATION_PROMPT.replace(/\{\{TITLE\}\}/g, title)
    .replace(/\{\{DESCRIPTION\}\}/g, desc)
    .replace(/\{\{METHOD_STEPS\}\}/g, methodText);
}
