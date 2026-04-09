"use server";

import { client, isSanityConfigured } from "@/sanity/client";
import { POST_TITLES_AND_SLUGS_QUERY } from "@/sanity/queries";
import { requireSuperUser } from "@/lib/require-super-user";
import { generateText, Output } from "ai";
import { z } from "zod";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const DEFAULT_BLOG_AI_MODEL = "openai/gpt-4o";
const DEFAULT_BLOG_AI_TEMPERATURE = 0.85;

function getBlogAiModel(): string {
  const v = process.env.FOODEDO_BLOG_AI_MODEL?.trim();
  return v && v.length > 0 ? v : DEFAULT_BLOG_AI_MODEL;
}

function getBlogAiTemperature(): number {
  const raw = process.env.FOODEDO_BLOG_AI_TEMPERATURE?.trim();
  if (!raw) return DEFAULT_BLOG_AI_TEMPERATURE;
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n < 0 || n > 2) return DEFAULT_BLOG_AI_TEMPERATURE;
  return n;
}

/** Voice and visual variety layered on top of docs/BLOG-CREATION-BRIEF.md. */
const BLOG_CREATIVITY_GUIDANCE = `CREATIVITY AND READABILITY (still obey every mandatory rule in the brief above):
- Use concrete, relatable moments (e.g. a specific evening routine, busy weeknight constraints) and varied sentence rhythm. Avoid making every paragraph follow the same SEO-template shape.
- Open with one memorable angle or tension that fits the topic—honest and practical. Do not invent statistics, studies, or survey data.
- Where you use numbers, keep them grounded (e.g. "about 15 minutes", "three dinners you already know") rather than fabricated percentages or citations.

IMAGE PROMPT FOR HERO (imageGenerationPrompt field):
- May describe a photoreal food/lifestyle scene OR an editorial illustration, abstract metaphor, or bold graphic treatment—whatever best matches the post—still with no readable text, logos, watermarks, or UI; optimised for a wide 16:9 hero crop.`;

const GenerateBlogInputSchema = z.object({
  mode: z.enum(["fromGuidance", "auto"]),
  guidance: z.string().nullable(),
});

const ResubmitBlogDraftInputSchema = z.object({
  additionalPrompt: z.string().min(1),
  current: z.object({
    title: z.string(),
    slug: z.string(),
    excerpt: z.string(),
    markdownBody: z.string(),
    primaryKeyword: z.string(),
    suggestedInternalLinks: z.array(
      z.object({
        anchorText: z.string(),
        href: z.string(),
      }),
    ),
    imageGenerationPrompt: z.string(),
  }),
  /**
   * Optional: if provided, this specific draft document will be excluded from
   * title/slug uniqueness checks and from the exclusion list prompt.
   */
  excludeSanityId: z.string().min(1).optional(),
});

const GenerateBlogResultSchema = z.object({
  title: z.string().describe("Blog title (ideally 50–60 characters)"),
  slug: z
    .string()
    .describe("Kebab-case slug, derived from title, unique vs existing slugs"),
  excerpt: z
    .string()
    .describe("Meta description / excerpt, 150–160 characters"),
  markdownBody: z
    .string()
    .describe(
      "Full blog body in Markdown. Must contain exactly one H1 which matches the title; use H2/H3 hierarchy otherwise.",
    ),
  primaryKeyword: z
    .string()
    .describe("Primary SEO keyword phrase (used in title/excerpt/body)"),
  suggestedInternalLinks: z
    .array(
      z.object({
        anchorText: z.string(),
        href: z
          .string()
          .describe("Relative path starting with / (no domain)"),
      }),
    )
    .describe("1–3 relevant internal links using relative paths"),
  imageGenerationPrompt: z
    .string()
    .describe(
      "A single detailed English prompt for a text-to-image tool for this post's hero. Photoreal food/lifestyle OR editorial illustration, abstract metaphor, or bold graphic—match the article. Describe subject, composition, lighting or colour, mood, and setting. Wide 16:9 hero crop. No readable text, logos, watermarks, or UI.",
    ),
});

type GenerateBlogInput = z.infer<typeof GenerateBlogInputSchema>;
type GenerateBlogResult = z.infer<typeof GenerateBlogResultSchema>;

type ExistingPostTitleSlug = { title?: string; slug?: string };

function normaliseKey(s: string) {
  return s.trim().toLowerCase();
}

function normaliseSlugToKebabCase(s: string) {
  return s
    .trim()
    .toLowerCase()
    // Replace any non-alphanumeric sequence with dashes.
    .replace(/[^a-z0-9]+/g, "-")
    // Trim leading/trailing dashes.
    .replace(/^-+|-+$/g, "")
    // Collapse multiple dashes.
    .replace(/-{2,}/g, "-");
}

function coerceSuggestedLinks(
  links: GenerateBlogResult["suggestedInternalLinks"],
): { anchorText: string; href: string }[] {
  return (links ?? [])
    .map((l) => ({
      anchorText: String(l.anchorText ?? "").trim(),
      href: String(l.href ?? "").trim(),
    }))
    .filter((l) => l.anchorText.length > 0 && l.href.startsWith("/"));
}

function injectInternalLinksIntoMarkdown(args: {
  markdownBody: string;
  suggestedInternalLinks: { anchorText: string; href: string }[];
}): string {
  const links = coerceSuggestedLinks(args.suggestedInternalLinks);
  if (links.length === 0) return args.markdownBody;

  // If the markdown already contains at least one of the suggested hrefs, assume the model embedded them.
  const alreadyIncluded = links.some((l) => args.markdownBody.includes(`](${l.href})`));
  if (alreadyIncluded) return args.markdownBody;

  const section = [
    "## Next steps with Foodedo",
    "",
    ...links.map((l) => `- [${l.anchorText}](${l.href})`),
    "",
  ].join("\n");

  return `${args.markdownBody.trimEnd()}\n\n${section}`;
}

function ensureSingleH1(title: string, markdownBody: string) {
  const lines = markdownBody.split(/\r?\n/);
  const withoutAnyH1 = lines.filter((l) => !l.trimStart().startsWith("# "));
  return [`# ${title}`.trimEnd(), "", ...withoutAnyH1].join("\n").trim() + "\n";
}

function excerptWarnings(excerpt: string) {
  const len = excerpt.trim().length;
  if (len < 150) return [`Excerpt is ${len} chars (target 150–160).`];
  if (len > 160) return [`Excerpt is ${len} chars (target 150–160).`];
  return [];
}

async function fetchExistingTitlesAndSlugsWithIds(): Promise<
  { _id: string; title?: string; slug?: string }[]
> {
  if (!isSanityConfigured) return [];
  try {
    return await client.fetch<{ _id: string; title?: string; slug?: string }[]>(
      `*[
        _type == "post"
        && defined(slug.current)
      ]{
        _id,
        title,
        "slug": slug.current
      }`,
      {},
      { cache: "no-store" },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `fetchExistingTitlesAndSlugsWithIds failed: ${message}`,
    );
  }
}

const ValidateBlogDraftForSanityWriteInputSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string(),
  markdownBody: z.string(),
  /**
   * Optional: exclude this specific draft/post from uniqueness checks.
   * Useful when updating an existing Sanity draft.
   */
  excludeSanityId: z.string().min(1).optional(),
});

export async function validateBlogDraftForSanityWrite(
  rawInput: unknown,
): Promise<
  | {
      success: true;
      data: Pick<GenerateBlogResult, "title" | "slug" | "excerpt" | "markdownBody">;
      warnings: string[];
    }
  | { success: false; error: string }
> {
  await requireSuperUser();

  const parsed = ValidateBlogDraftForSanityWriteInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: "Invalid input." };
  }

  const { title, slug, excerpt, markdownBody, excludeSanityId } = parsed.data;

  const normalisedSlug = normaliseSlugToKebabCase(slug);
  const slugOk = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalisedSlug);
  if (!normalisedSlug || !slugOk) {
    return { success: false, error: "Slug must be strict kebab-case." };
  }

  const normalisedMarkdownBody = ensureSingleH1(title, markdownBody);

  // Uniqueness checks (exact match only, case-insensitive).
  const rows = await fetchExistingTitlesAndSlugsWithIds();
  const existing: ExistingPostTitleSlug[] = excludeSanityId
    ? rows
        .filter((r) => {
          const draftId = excludeSanityId.startsWith("drafts.")
            ? excludeSanityId
            : `drafts.${excludeSanityId}`;
          return r._id !== excludeSanityId && r._id !== draftId;
        })
        .map(({ title, slug }) => ({
          title,
          slug,
        }))
    : rows.map(({ title, slug }) => ({ title, slug }));

  const exclusions = buildExclusions(existing);
  const titleKey = normaliseKey(title);
  const slugKey = normaliseKey(normalisedSlug);
  if (exclusions.titles.has(titleKey)) {
    return { success: false, error: "a title that already exists in Sanity." };
  }
  if (exclusions.slugs.has(slugKey)) {
    return { success: false, error: "a slug that already exists in Sanity." };
  }

  const warnings: string[] = [];
  warnings.push(...excerptWarnings(excerpt));
  if (normalisedSlug !== slug.trim()) {
    warnings.push("Slug was normalized to kebab-case.");
  }

  return {
    success: true,
    data: {
      title,
      slug: normalisedSlug,
      excerpt,
      markdownBody: normalisedMarkdownBody,
    },
    warnings: warnings.filter(Boolean),
  };
}

async function loadBlogBrief(): Promise<string> {
  const briefPath = path.join(process.cwd(), "docs", "BLOG-CREATION-BRIEF.md");
  return await fs.readFile(briefPath, "utf8");
}

async function fetchExistingTitlesAndSlugs(): Promise<ExistingPostTitleSlug[]> {
  if (!isSanityConfigured) return [];
  try {
    const rows = await client.fetch<{ title?: string; slug?: string }[]>(
      POST_TITLES_AND_SLUGS_QUERY,
      {},
      // No need for caching here; this is an admin tool.
      { cache: "no-store" },
    );
    return rows ?? [];
  } catch {
    // If Sanity isn't configured or errors, we still allow generation.
    return [];
  }
}

function buildExclusions(existing: ExistingPostTitleSlug[]) {
  const titles = new Set<string>();
  const slugs = new Set<string>();
  for (const p of existing) {
    if (p.title) titles.add(normaliseKey(p.title));
    if (p.slug) slugs.add(normaliseKey(p.slug));
  }
  return { titles, slugs };
}

function buildSystemPrompt(args: {
  brief: string;
  existing: ExistingPostTitleSlug[];
  input: GenerateBlogInput;
}) {
  const existingList = args.existing
    .slice(0, 500)
    .map((p) => `- ${p.title ?? "(untitled)"} (/${p.slug ?? ""})`)
    .join("\n");

  const modeInstruction =
    args.input.mode === "fromGuidance"
      ? `The human has provided guidance for what they want the blog post to cover. Use it as a starting point, but you MUST still produce the best SEO title (50–60 chars target) that matches the guidance.\nGuidance:\n${args.input.guidance ?? ""}`
      : `The human did not provide guidance. Choose a post topic from the allowed pillars and generate a strong SEO title (50–60 chars target).`;

  return `You are an expert SEO + AEO blog writer for Foodedo.

You MUST follow this brief exactly:
${args.brief}

${BLOG_CREATIVITY_GUIDANCE}

UNIQUENESS CONSTRAINT (mandatory):
- Do NOT reuse an existing title or slug from the exclusion list below.
- Titles and slugs must be unique by exact match (case-insensitive).

EXCLUSION LIST (existing posts):
${existingList || "- (no existing posts found)"}

OUTPUT FORMAT (mandatory):
- Return ONLY a JSON object that matches the required schema.
- markdownBody must be Markdown.
- markdownBody must contain exactly one H1 and it must match the JSON title.
- All internal links must be relative paths starting with / (no domain).
- IMPORTANT: Embed 1–3 internal links inline inside markdownBody using markdown link syntax, e.g. [Try Foodedo](/sign-up). Do not return links only in suggestedInternalLinks.
- imageGenerationPrompt: copy-paste-ready for an image generator; align with title + excerpt + topic. Photoreal or stylised/abstract/graphic per CREATIVITY AND READABILITY above; no readable text in the described scene.

${modeInstruction}`;
}

export async function generateBlogDraft(rawInput: unknown): Promise<
  | { success: true; data: GenerateBlogResult; warnings: string[] }
  | { success: false; error: string }
> {
  await requireSuperUser();

  const parsed = GenerateBlogInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: "Invalid input." };
  }

  const input = parsed.data;
  if (input.mode === "fromGuidance" && !input.guidance?.trim()) {
    return { success: false, error: "Please provide guidance." };
  }

  try {
    const [brief, existing] = await Promise.all([
      loadBlogBrief(),
      fetchExistingTitlesAndSlugs(),
    ]);
    const exclusions = buildExclusions(existing);

    const system = buildSystemPrompt({ brief, existing, input });

    const result = await generateText({
      model: getBlogAiModel(),
      system,
      prompt:
        input.mode === "fromGuidance"
          ? `Generate a Foodedo blog post using this guidance:\n\n${input.guidance}`
          : "Generate a Foodedo blog post draft for next week's publish.",
      output: Output.object({
        schema: GenerateBlogResultSchema,
        name: "foodedo_blog_draft",
      }),
      temperature: getBlogAiTemperature(),
    });

    const validation = GenerateBlogResultSchema.safeParse(result.output);
    if (!validation.success) {
      return { success: false, error: "AI returned invalid blog draft data." };
    }

    const draft = validation.data;

    // Enforce uniqueness (exact match only).
    const titleKey = normaliseKey(draft.title);
    const slugKey = normaliseKey(draft.slug);
    if (exclusions.titles.has(titleKey)) {
      return { success: false, error: "Generated title that already exists in Sanity." };
    }
    if (exclusions.slugs.has(slugKey)) {
      return { success: false, error: "Generated slug that already exists in Sanity." };
    }

    const markdownWithLinks = injectInternalLinksIntoMarkdown({
      markdownBody: draft.markdownBody,
      suggestedInternalLinks: draft.suggestedInternalLinks,
    });
    const markdownBody = ensureSingleH1(draft.title, markdownWithLinks);

    const warnings: string[] = [];
    warnings.push(...excerptWarnings(draft.excerpt));
    if (!draft.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug.trim())) {
      warnings.push("Slug is not strict kebab-case.");
    }

    return {
      success: true,
      data: { ...draft, markdownBody },
      warnings: warnings.filter(Boolean),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

function buildSystemPromptForResubmit(args: {
  brief: string;
  existing: ExistingPostTitleSlug[];
  current: GenerateBlogResult;
  additionalPrompt: string;
}) {
  const existingList = args.existing
    .slice(0, 500)
    .map((p) => `- ${p.title ?? "(untitled)"} (/${p.slug ?? ""})`)
    .join("\n");

  return `You are an expert SEO + AEO blog writer for Foodedo.

You are updating an EXISTING Foodedo blog draft.

You MUST follow this brief exactly:
${args.brief}

${BLOG_CREATIVITY_GUIDANCE}

UNIQUENESS CONSTRAINT (mandatory):
- Do NOT reuse an existing title or slug from the exclusion list below.

EXCLUSION LIST (existing posts):
${existingList || "- (no existing posts found)"}

CURRENT DRAFT (JSON):
${JSON.stringify(args.current, null, 2)}

USER CHANGES (additional prompt):
${args.additionalPrompt}

OUTPUT FORMAT (mandatory):
- Return ONLY a JSON object that matches the required schema.
- markdownBody must be Markdown.
- markdownBody must contain exactly one H1 which matches the JSON title.
- All internal links must be relative paths starting with / (no domain).
- IMPORTANT: Embed 1–3 internal links inline inside markdownBody using markdown link syntax, e.g. [Try Foodedo](/sign-up).
- imageGenerationPrompt: refresh when topic, title, excerpt, or visual angle changes; photoreal or stylised/abstract/graphic as appropriate; copy-paste-ready; no readable text in scene.

PREFERENCES:
- Prefer keeping the current title/slug/excerpt/body structure unless the user changes require edits.
- If you change the title, ensure the H1 in markdownBody updates to match.`;
}

export async function resubmitBlogDraft(rawInput: unknown): Promise<
  | { success: true; data: GenerateBlogResult; warnings: string[] }
  | { success: false; error: string }
> {
  await requireSuperUser();

  const parsed = ResubmitBlogDraftInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: "Invalid input." };
  }

  const { additionalPrompt, current, excludeSanityId } = parsed.data;
  const trimmedAdditionalPrompt = additionalPrompt.trim();
  if (trimmedAdditionalPrompt.length === 0) {
    return { success: false, error: "Additional prompt is empty." };
  }

  try {
    const [brief, existing] = await Promise.all([
      loadBlogBrief(),
      (async () => {
        const rows = await fetchExistingTitlesAndSlugsWithIds();
        const rowsExcludingCurrent = excludeSanityId
          ? rows.filter((r) => {
              const draftId = excludeSanityId.startsWith("drafts.")
                ? excludeSanityId
                : `drafts.${excludeSanityId}`;
              return r._id !== excludeSanityId && r._id !== draftId;
            })
          : rows;
        return rowsExcludingCurrent.map(({ title, slug }) => ({ title, slug }));
      })(),
    ]);
    const exclusions = buildExclusions(existing);

    const system = buildSystemPromptForResubmit({
      brief,
      existing,
      current,
      additionalPrompt: trimmedAdditionalPrompt,
    });

    const result = await generateText({
      model: getBlogAiModel(),
      system,
      prompt: "Update the draft according to USER CHANGES. Return JSON only.",
      output: Output.object({
        schema: GenerateBlogResultSchema,
        name: "foodedo_blog_draft",
      }),
      temperature: getBlogAiTemperature(),
    });

    const validation = GenerateBlogResultSchema.safeParse(result.output);
    if (!validation.success) {
      return { success: false, error: "AI returned invalid blog draft data." };
    }

    const draft = validation.data;

    const titleKey = normaliseKey(draft.title);
    const slugKey = normaliseKey(draft.slug);
    if (exclusions.titles.has(titleKey)) {
      return {
        success: false,
        error: "Resubmission generated a title that already exists in Sanity.",
      };
    }
    if (exclusions.slugs.has(slugKey)) {
      return {
        success: false,
        error: "Resubmission generated a slug that already exists in Sanity.",
      };
    }

    const markdownWithLinks = injectInternalLinksIntoMarkdown({
      markdownBody: draft.markdownBody,
      suggestedInternalLinks: draft.suggestedInternalLinks,
    });
    const markdownBody = ensureSingleH1(draft.title, markdownWithLinks);

    const warnings: string[] = [];
    warnings.push(...excerptWarnings(draft.excerpt));
    if (!draft.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug.trim())) {
      warnings.push("Slug is not strict kebab-case.");
    }

    return {
      success: true,
      data: { ...draft, markdownBody },
      warnings: warnings.filter(Boolean),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

