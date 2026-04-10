"use client";

import {
  createSanityPostDraft,
  upsertSanityPostDraft,
} from "@/app/(app)/actions/create-sanity-post-draft";
import {
  generateBlogDraft,
  resubmitBlogDraft,
  validateBlogDraftForSanityWrite,
} from "@/app/(app)/actions/generate-blog";
import { ROUTES } from "@/app/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";
import { Copy, ExternalLink, Loader2, ShieldAlert, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type Draft =
  | {
      success: true;
      data: {
        title: string;
        slug: string;
        excerpt: string;
        markdownBody: string;
        primaryKeyword: string;
        suggestedInternalLinks: { anchorText: string; href: string }[];
        /** Copy-paste utility for external image tools; not sent to Sanity. */
        imageGenerationPrompt: string;
      };
      warnings: string[];
    }
  | { success: false; error: string };

type GeneratedDraftData = Extract<Draft, { success: true }>["data"];

async function copyToClipboard(text: string, label: string) {
  await navigator.clipboard.writeText(text);
  toast.success(`Copied ${label}`);
}

export function BlogGeneratorClient() {
  const router = useRouter();
  const user = useQuery(api.users.current);
  const isSuperUser = user?.isSuperUser === true;

  const [mode, setMode] = useState<"fromGuidance" | "auto">("fromGuidance");
  const [guidance, setGuidance] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<Draft | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUpdatingDraft, setIsUpdatingDraft] = useState(false);
  const [publishResult, setPublishResult] = useState<{
    sanityId: string;
    studioEditUrl?: string;
  } | null>(null);
  const [additionalPrompt, setAdditionalPrompt] = useState("");
  const [isResubmitting, setIsResubmitting] = useState(false);

  // When applying validated/normalized SEO fields back into the editor,
  // reconcile against a snapshot so we don't clobber concurrent user edits.
  const normalizationSnapshotRef = useRef<
    | Pick<GeneratedDraftData, "title" | "slug" | "excerpt" | "markdownBody">
    | null
  >(null);
  const isApplyingNormalizationRef = useRef(false);

  useEffect(() => {
    if (user !== undefined && !user) {
      router.replace(ROUTES.DASHBOARD);
      return;
    }
    if (user && !user.isSuperUser) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [user, router]);

  const canGenerate = useMemo(() => {
    if (!isSuperUser) return false;
    if (mode === "fromGuidance") return guidance.trim().length > 0;
    return true;
  }, [isSuperUser, mode, guidance]);

  const canResubmit = useMemo(() => {
    return Boolean(result?.success && additionalPrompt.trim().length > 0);
  }, [result, additionalPrompt]);

  const updateDraftData = useCallback(
    (patch: Partial<GeneratedDraftData>) => {
      const applyingNormalization = isApplyingNormalizationRef.current;
      const snapshot = normalizationSnapshotRef.current;

      setResult((prev) => {
        if (!prev?.success) return prev;

        if (applyingNormalization && snapshot) {
          const reconciled: Partial<GeneratedDraftData> = {};

          if (
            "title" in patch &&
            patch.title !== undefined &&
            prev.data.title === snapshot.title
          ) {
            reconciled.title = patch.title;
          }
          if (
            "slug" in patch &&
            patch.slug !== undefined &&
            prev.data.slug === snapshot.slug
          ) {
            reconciled.slug = patch.slug;
          }
          if (
            "excerpt" in patch &&
            patch.excerpt !== undefined &&
            prev.data.excerpt === snapshot.excerpt
          ) {
            reconciled.excerpt = patch.excerpt;
          }
          if (
            "markdownBody" in patch &&
            patch.markdownBody !== undefined &&
            prev.data.markdownBody === snapshot.markdownBody
          ) {
            reconciled.markdownBody = patch.markdownBody;
          }

          return {
            ...prev,
            data: {
              ...prev.data,
              ...reconciled,
            },
          };
        }

        return {
          ...prev,
          data: {
            ...prev.data,
            ...patch,
          },
        };
      });
    },
    [],
  );

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;
    setIsGenerating(true);
    setResult(null);
    setPublishResult(null);
    try {
      const res = await generateBlogDraft({
        mode,
        guidance: mode === "fromGuidance" ? guidance : null,
      });
      setResult(res);
      if (!res.success) {
        toast.error(res.error);
      } else if (res.warnings.length) {
        toast.message("Generated with warnings", {
          description: res.warnings.join(" "),
        });
      } else {
        toast.success("Blog draft generated");
      }
    } catch (e) {
      setResult({
        success: false,
        error: "Something went wrong. Please try again.",
      });
      toast.error("Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }, [canGenerate, mode, guidance]);

  const copyAllText = useMemo(() => {
    if (!result?.success) return null;
    const d = result.data;
    return [
      `Title: ${d.title}`,
      `Slug: ${d.slug}`,
      `Excerpt: ${d.excerpt}`,
      "",
      d.markdownBody.trimEnd(),
      "",
      "---",
      "Image generation prompt (utility):",
      "",
      d.imageGenerationPrompt.trim(),
      "",
    ].join("\n");
  }, [result]);

  const handleCreateDraftInSanity = useCallback(async () => {
    if (!result?.success) return;
    if (isPublishing || isUpdatingDraft || isResubmitting) return;

    setIsPublishing(true);
    setPublishResult(null);
    try {
      normalizationSnapshotRef.current = {
        title: result.data.title,
        slug: result.data.slug,
        excerpt: result.data.excerpt,
        markdownBody: result.data.markdownBody,
      };

      const validated = await validateBlogDraftForSanityWrite({
        title: result.data.title,
        slug: result.data.slug,
        excerpt: result.data.excerpt,
        markdownBody: result.data.markdownBody,
      });

      if (!validated.success) {
        toast.error(validated.error);
        return;
      }

      if (validated.warnings.length) {
        toast.message("Validated with warnings", {
          description: validated.warnings.join(" "),
        });
      }

      const res = await createSanityPostDraft({
        title: validated.data.title,
        slug: validated.data.slug,
        excerpt: validated.data.excerpt,
        markdownBody: validated.data.markdownBody,
      });
      if (res.success) {
        setPublishResult({
          sanityId: res.sanityId,
          studioEditUrl: res.studioEditUrl,
        });

        // Reflect any normalisations (slug/H1/etc.) in the editor UI.
        isApplyingNormalizationRef.current = true;
        updateDraftData(validated.data);
        isApplyingNormalizationRef.current = false;
        normalizationSnapshotRef.current = null;

        toast.success("Draft created in Sanity");
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Failed to create draft in Sanity");
    } finally {
      setIsPublishing(false);
    }
  }, [result, isPublishing, isUpdatingDraft, isResubmitting, updateDraftData]);

  const handleUpdateDraftInSanity = useCallback(async () => {
    if (!result?.success) return;
    if (!publishResult?.sanityId) return;

    setIsUpdatingDraft(true);
    try {
      normalizationSnapshotRef.current = {
        title: result.data.title,
        slug: result.data.slug,
        excerpt: result.data.excerpt,
        markdownBody: result.data.markdownBody,
      };

      const validated = await validateBlogDraftForSanityWrite({
        title: result.data.title,
        slug: result.data.slug,
        excerpt: result.data.excerpt,
        markdownBody: result.data.markdownBody,
        excludeSanityId: publishResult.sanityId,
      });

      if (!validated.success) {
        toast.error(validated.error);
        return;
      }

      if (validated.warnings.length) {
        toast.message("Validated with warnings", {
          description: validated.warnings.join(" "),
        });
      }

      const res = await upsertSanityPostDraft({
        sanityId: publishResult.sanityId,
        title: validated.data.title,
        slug: validated.data.slug,
        excerpt: validated.data.excerpt,
        markdownBody: validated.data.markdownBody,
      });
      if (res.success) {
        isApplyingNormalizationRef.current = true;
        updateDraftData(validated.data);
        isApplyingNormalizationRef.current = false;
        normalizationSnapshotRef.current = null;

        toast.success("Draft updated in Sanity");
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Failed to update draft in Sanity");
    } finally {
      setIsUpdatingDraft(false);
    }
  }, [publishResult?.sanityId, result, updateDraftData]);

  const handleResubmitWithAdditionalPrompt = useCallback(async () => {
    if (!result?.success) return;
    if (isPublishing || isUpdatingDraft || isResubmitting) return;
    if (additionalPrompt.trim().length === 0) return;

    setIsResubmitting(true);
    try {
      const res = await resubmitBlogDraft({
        additionalPrompt: additionalPrompt.trim(),
        current: result.data,
        excludeSanityId: publishResult?.sanityId,
      });

      if (!res.success) {
        toast.error(res.error);
        return;
      }

      if (res.warnings.length) {
        toast.message("Resubmitted with warnings", {
          description: res.warnings.join(" "),
        });
      } else {
        toast.success("Resubmission updated the draft");
      }

      setResult({ success: true, data: res.data, warnings: res.warnings });

      // If the draft already exists in Sanity, update it immediately in-place.
      if (publishResult?.sanityId) {
        normalizationSnapshotRef.current = {
          title: res.data.title,
          slug: res.data.slug,
          excerpt: res.data.excerpt,
          markdownBody: res.data.markdownBody,
        };

        const validated = await validateBlogDraftForSanityWrite({
          title: res.data.title,
          slug: res.data.slug,
          excerpt: res.data.excerpt,
          markdownBody: res.data.markdownBody,
          excludeSanityId: publishResult.sanityId,
        });

        if (!validated.success) {
          toast.error(validated.error);
          normalizationSnapshotRef.current = null;
        } else {
          if (validated.warnings.length) {
            toast.message("Validated with warnings", {
              description: validated.warnings.join(" "),
            });
          }

          const up = await upsertSanityPostDraft({
            sanityId: publishResult.sanityId,
            title: validated.data.title,
            slug: validated.data.slug,
            excerpt: validated.data.excerpt,
            markdownBody: validated.data.markdownBody,
          });

          if (!up.success) {
            toast.error(up.error);
          } else {
            isApplyingNormalizationRef.current = true;
            updateDraftData(validated.data);
            isApplyingNormalizationRef.current = false;
            normalizationSnapshotRef.current = null;

            toast.success("Sanity draft updated");
          }
        }
      }
    } catch {
      toast.error("Resubmission failed. Please try again.");
    } finally {
      setIsResubmitting(false);
    }
  }, [
    additionalPrompt,
    publishResult?.sanityId,
    result,
    isPublishing,
    isUpdatingDraft,
    isResubmitting,
    updateDraftData,
  ]);

  if (user === undefined) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Card>
          <CardContent className="p-6 flex items-center gap-3 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading…
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isSuperUser) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-destructive" />
              Access denied
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            This page is only available to super users.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Blog Generator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
              <TabsList>
                <TabsTrigger value="fromGuidance">
                  Generate from guidance
                </TabsTrigger>
                <TabsTrigger value="auto">Auto-generate</TabsTrigger>
              </TabsList>

              <TabsContent value="fromGuidance" className="mt-4">
                <div className="space-y-2">
                  <Label htmlFor="guidance">Guidance</Label>
                  <Textarea
                    id="guidance"
                    placeholder={`e.g. Perfectly cooked chicken thighs

Include:
- Oven + air fryer options
- Internal temps + carryover
- Crispy skin tips
- Common mistakes`}
                    value={guidance}
                    onChange={(e) => setGuidance(e.target.value)}
                    className="min-h-32"
                  />
                  <p className="text-sm text-muted-foreground">
                    Give a topic plus any must-include points. We’ll generate
                    the best title, slug, excerpt, and a Markdown body following
                    `docs/BLOG-CREATION-BRIEF.md`.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="auto" className="mt-4">
                <p className="text-sm text-muted-foreground">
                  This will pick a topic from your content pillars and generate
                  a full draft.
                </p>
              </TabsContent>
            </Tabs>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleGenerate}
                disabled={!canGenerate || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  "Generate draft"
                )}
              </Button>
              {copyAllText && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => copyToClipboard(copyAllText, "everything")}
                >
                  <Copy className="mr-2 size-4" />
                  Copy everything
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {result?.success ? (
          <Card>
            <CardHeader>
              <CardTitle>Generated draft</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.warnings.length ? (
                <div className="rounded-md border border-amber-200/60 bg-amber-50/60 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                  <div className="font-medium mb-1">Warnings</div>
                  <ul className="list-disc pl-5 space-y-1">
                    {result.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="out-title">Title</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(result.data.title, "title")
                      }
                    >
                      <Copy className="mr-2 size-4" />
                      Copy
                    </Button>
                  </div>
                  <Input
                    id="out-title"
                    value={result.data.title}
                    onChange={(e) =>
                      updateDraftData({ title: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="out-slug">Slug</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(result.data.slug, "slug")}
                    >
                      <Copy className="mr-2 size-4" />
                      Copy
                    </Button>
                  </div>
                  <Input
                    id="out-slug"
                    value={result.data.slug}
                    onChange={(e) =>
                      updateDraftData({ slug: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="out-excerpt">
                    Excerpt (meta description)
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(result.data.excerpt, "excerpt")
                    }
                  >
                    <Copy className="mr-2 size-4" />
                    Copy
                  </Button>
                </div>
                <Textarea
                  id="out-excerpt"
                  value={result.data.excerpt}
                  onChange={(e) =>
                    updateDraftData({ excerpt: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="out-body">Body (Markdown)</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(result.data.markdownBody, "body")
                    }
                  >
                    <Copy className="mr-2 size-4" />
                    Copy
                  </Button>
                </div>
                <Textarea
                  id="out-body"
                  value={result.data.markdownBody}
                  onChange={(e) =>
                    updateDraftData({ markdownBody: e.target.value })
                  }
                  className="min-h-[360px] font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label>Primary keyword</Label>
                <Input
                  value={result.data.primaryKeyword}
                  onChange={(e) =>
                    updateDraftData({ primaryKeyword: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2 border-t pt-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                  <div>
                    <Label htmlFor="out-image-prompt">
                      Image generation prompt
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Utility only, not uploaded to Sanity. Paste into your
                      image tool for a hero that matches this post.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 self-start"
                    onClick={() =>
                      copyToClipboard(
                        result.data.imageGenerationPrompt,
                        "image prompt",
                      )
                    }
                  >
                    <Copy className="mr-2 size-4" />
                    Copy
                  </Button>
                </div>
                <Textarea
                  id="out-image-prompt"
                  value={result.data.imageGenerationPrompt}
                  onChange={(e) =>
                    updateDraftData({ imageGenerationPrompt: e.target.value })
                  }
                  className="min-h-28 font-mono text-sm"
                />
              </div>

              <div className="space-y-2 border-t pt-4">
                <Label htmlFor="additional-prompt">
                  Additional changes prompt
                </Label>
                <Textarea
                  id="additional-prompt"
                  placeholder="e.g. Shorten intro, add a quick checklist, make the tone warmer, and ensure the CTA points to meal planning."
                  value={additionalPrompt}
                  onChange={(e) => setAdditionalPrompt(e.target.value)}
                  className="min-h-24"
                />
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    type="button"
                    onClick={handleResubmitWithAdditionalPrompt}
                    disabled={
                      !canResubmit ||
                      isResubmitting ||
                      isPublishing ||
                      isUpdatingDraft
                    }
                  >
                    {isResubmitting ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Resubmitting…
                      </>
                    ) : (
                      "Resubmit & update draft"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isResubmitting}
                    onClick={() => setAdditionalPrompt("")}
                  >
                    Clear prompt
                  </Button>
                </div>
              </div>

              {publishResult?.sanityId && (
                <p className="text-sm text-muted-foreground">
                  Your edits are local until you click{" "}
                  <span className="font-medium">Update draft in Sanity</span>{" "}
                  (Title, Slug, Excerpt, Body).
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="button"
                  onClick={
                    publishResult?.sanityId
                      ? handleUpdateDraftInSanity
                      : handleCreateDraftInSanity
                  }
                  disabled={
                    (publishResult?.sanityId ? isUpdatingDraft : isPublishing) ||
                    isResubmitting
                  }
                >
                  {publishResult?.sanityId ? (
                    isUpdatingDraft ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Updating draft…
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 size-4" />
                        Update draft in Sanity
                      </>
                    )
                  ) : isPublishing ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Creating draft…
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 size-4" />
                      Create draft in Sanity
                    </>
                  )}
                </Button>
                {publishResult && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Draft ID:{" "}
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                        {publishResult.sanityId}
                      </code>
                    </span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(publishResult.sanityId, "draft ID")
                      }
                    >
                      <Copy className="mr-1.5 size-3.5" />
                      Copy ID
                    </Button>
                    {publishResult.studioEditUrl && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        asChild
                      >
                        <a
                          href={publishResult.studioEditUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink className="mr-1.5 size-3.5" />
                          Open in Studio
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : result?.success === false ? (
          <Card>
            <CardHeader>
              <CardTitle>Generation failed</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              {result.error}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
