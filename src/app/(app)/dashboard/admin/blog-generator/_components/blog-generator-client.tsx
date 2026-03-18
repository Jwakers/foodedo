"use client";

import { createSanityPostDraft } from "@/app/(app)/actions/create-sanity-post-draft";
import { generateBlogDraft } from "@/app/(app)/actions/generate-blog";
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
import { useCallback, useEffect, useMemo, useState } from "react";
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
      };
      warnings: string[];
    }
  | { success: false; error: string };

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
  const [publishResult, setPublishResult] = useState<{
    sanityId: string;
    studioEditUrl?: string;
  } | null>(null);

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
    ].join("\n");
  }, [result]);

  const handleCreateDraftInSanity = useCallback(async () => {
    if (!result?.success) return;
    setIsPublishing(true);
    setPublishResult(null);
    try {
      const res = await createSanityPostDraft({
        title: result.data.title,
        slug: result.data.slug,
        excerpt: result.data.excerpt,
        markdownBody: result.data.markdownBody,
      });
      if (res.success) {
        setPublishResult({
          sanityId: res.sanityId,
          studioEditUrl: res.studioEditUrl,
        });
        toast.success("Draft created in Sanity");
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Failed to create draft in Sanity");
    } finally {
      setIsPublishing(false);
    }
  }, [result]);

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
                  <Input id="out-title" readOnly value={result.data.title} />
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
                  <Input id="out-slug" readOnly value={result.data.slug} />
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
                  readOnly
                  value={result.data.excerpt}
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
                  readOnly
                  value={result.data.markdownBody}
                  className="min-h-[360px] font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label>Primary keyword</Label>
                <Input readOnly value={result.data.primaryKeyword} />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t">
                <Button
                  type="button"
                  onClick={handleCreateDraftInSanity}
                  disabled={isPublishing}
                >
                  {isPublishing ? (
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
