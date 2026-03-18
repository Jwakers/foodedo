type BuildBlogHeroImagePromptArgs = {
  title: string;
  excerpt?: string | null;
};

export function buildBlogHeroImagePrompt(args: BuildBlogHeroImagePromptArgs): string {
  const title = args.title.trim();
  const excerpt = (args.excerpt ?? "").trim();

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
- No hands, no faces, no text, no logos, no watermarks
- Avoid UI screenshots, packaging with readable branding, or over-styled AI artifacts

COMPOSITION:
- Designed as a hero/header image (wide framing)
- One clear subject that matches the post topic (ingredients or finished dish)
- Keep space for site UI margins (don’t crop too tight)

OUTPUT:
- One single realistic photograph-style image
- No text of any kind (including labels/signs)
`;
}

