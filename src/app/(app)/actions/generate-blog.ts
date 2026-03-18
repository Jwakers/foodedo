"use server";

import { client, isSanityConfigured } from "@/sanity/client";
import { POST_TITLES_AND_SLUGS_QUERY } from "@/sanity/queries";
import { requireSuperUser } from "@/lib/require-super-user";
import { generateText, Output } from "ai";
import { z } from "zod";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const GenerateBlogInputSchema = z.object({
  mode: z.enum(["fromGuidance", "auto"]),
  guidance: z.string().nullable(),
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
});

type GenerateBlogInput = z.infer<typeof GenerateBlogInputSchema>;
type GenerateBlogResult = z.infer<typeof GenerateBlogResultSchema>;

type ExistingPostTitleSlug = { title?: string; slug?: string };

function normaliseKey(s: string) {
  return s.trim().toLowerCase();
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

  const [brief, existing] = await Promise.all([
    loadBlogBrief(),
    fetchExistingTitlesAndSlugs(),
  ]);
  const exclusions = buildExclusions(existing);

  const system = buildSystemPrompt({ brief, existing, input });

  const result = await generateText({
    model: "openai/gpt-4o-mini",
    system,
    prompt:
      input.mode === "fromGuidance"
        ? `Generate a Foodedo blog post using this guidance:\n\n${input.guidance}`
        : "Generate a Foodedo blog post draft for next week's publish.",
    output: Output.object({
      schema: GenerateBlogResultSchema,
      name: "foodedo_blog_draft",
    }),
    temperature: 0.7,
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
    return { success: false, error: "Generated title already exists in Sanity." };
  }
  if (exclusions.slugs.has(slugKey)) {
    return { success: false, error: "Generated slug already exists in Sanity." };
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
}

