"use client";

import { ROUTES } from "@/app/constants";
import { listSanityPosts, type SanityPostListRow } from "@/app/(app)/actions/list-sanity-posts";
import { generateBlogHeroImage } from "@/app/(app)/actions/generate-blog-hero-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";
import {
  Copy,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Search,
  ShieldAlert,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

async function copyToClipboard(text: string, label: string) {
  await navigator.clipboard.writeText(text);
  toast.success(`Copied ${label}`);
}

function isDraftId(id: string) {
  return id.startsWith("drafts.");
}

function labelForPost(p: SanityPostListRow) {
  return p.isDraft || isDraftId(p._id) ? "Draft" : "Published";
}

type GeneratedImage = {
  base64: string;
  mediaType: string;
  promptUsed: string;
};

export function BlogImagesClient() {
  const router = useRouter();
  const user = useQuery(api.users.current);
  const isSuperUser = user?.isSuperUser === true;

  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [posts, setPosts] = useState<SanityPostListRow[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedImage | null>(null);

  const latestFetchId = useRef(0);
  const limit = 20;
  const offset = page * limit;
  const pageCount = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    if (user !== undefined && !user) {
      router.replace(ROUTES.DASHBOARD);
      return;
    }
    if (user && !user.isSuperUser) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [user, router]);

  const selected = useMemo(
    () => posts.find((p) => p._id === selectedId) ?? null,
    [posts, selectedId],
  );

  const fetchPosts = useCallback(
    async (opts?: { resetPage?: boolean }) => {
      if (!isSuperUser) return;
      const fetchId = ++latestFetchId.current;
      setIsLoading(true);
      try {
        const res = await listSanityPosts({
          q,
          offset: opts?.resetPage ? 0 : offset,
          limit,
        });
        if (fetchId !== latestFetchId.current) return;
        if (!res.success) {
          toast.error(res.error);
          return;
        }
        setPosts(res.posts);
        setTotal(res.total);
        if (opts?.resetPage) setPage(0);
        setGenerated(null);
        if (!selectedId && res.posts[0]?._id) {
          setSelectedId(res.posts[0]._id);
        }
      } catch {
        if (fetchId !== latestFetchId.current) return;
        toast.error("Failed to load posts");
      } finally {
        if (fetchId === latestFetchId.current) setIsLoading(false);
      }
    },
    [isSuperUser, q, offset, selectedId],
  );

  // Debounced search
  useEffect(() => {
    if (!isSuperUser) return;
    const t = setTimeout(() => {
      fetchPosts({ resetPage: true });
    }, 350);
    return () => clearTimeout(t);
  }, [q, isSuperUser, fetchPosts]);

  // Page changes
  useEffect(() => {
    if (!isSuperUser) return;
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, isSuperUser]);

  const canPrev = page > 0;
  const canNext = offset + limit < total;

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setGenerated(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!selected) return;
    setIsGenerating(true);
    setGenerated(null);
    try {
      const res = await generateBlogHeroImage({
        title: selected.title ?? "",
        excerpt: selected.excerpt ?? null,
      });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setGenerated({
        base64: res.base64,
        mediaType: res.mediaType,
        promptUsed: res.promptUsed,
      });
      toast.success("Hero image generated");
    } catch {
      toast.error("Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  }, [selected]);

  if (user === undefined) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-6xl">
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
      <div className="container mx-auto px-4 py-12 max-w-6xl">
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

  const imageDataUrl =
    generated?.base64 && generated.mediaType
      ? `data:${generated.mediaType};base64,${generated.base64}`
      : null;

  const downloadName = selected?.slug?.current
    ? `blog-hero-${selected.slug.current}`
    : selected?.title
      ? `blog-hero-${selected.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase().slice(0, 50)}`
      : "blog-hero";
  const downloadExt =
    generated?.mediaType === "image/jpeg" || generated?.mediaType === "image/jpg"
      ? "jpg"
      : "png";

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="size-5" />
              Blog posts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input
                  id="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search title or excerpt…"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="text-sm text-muted-foreground">
                {total ? (
                  <>
                    Showing <span className="font-medium text-foreground">{offset + 1}</span>–
                    <span className="font-medium text-foreground">
                      {Math.min(offset + limit, total)}
                    </span>{" "}
                    of <span className="font-medium text-foreground">{total}</span>
                  </>
                ) : (
                  "No posts found."
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Page <span className="font-medium text-foreground">{page + 1}</span>/
                <span className="font-medium text-foreground">{pageCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!canPrev || isLoading}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Prev
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!canNext || isLoading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isLoading}
                onClick={() => fetchPosts()}
                className="ml-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Refreshing…
                  </>
                ) : (
                  "Refresh"
                )}
              </Button>
            </div>

            <div className="max-h-[520px] overflow-y-auto rounded-md border">
              {posts.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">
                  {isLoading ? "Loading…" : "No results."}
                </div>
              ) : (
                <ul className="divide-y">
                  {posts.map((p) => {
                    const active = p._id === selectedId;
                    const label = labelForPost(p);
                    return (
                      <li key={p._id}>
                        <button
                          type="button"
                          onClick={() => handleSelect(p._id)}
                          className={[
                            "w-full text-left p-3 transition-colors",
                            active ? "bg-muted" : "hover:bg-muted/50",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-medium leading-snug truncate">
                                {p.title || "(untitled)"}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2">
                                <span className="rounded-full border px-2 py-0.5">
                                  {label}
                                </span>
                                {p.publishedAt ? (
                                  <span>
                                    {new Date(p.publishedAt).toLocaleDateString()}
                                  </span>
                                ) : (
                                  <span>No date</span>
                                )}
                                <span>
                                  {p.hasMainImage ? "Has image" : "No image"}
                                </span>
                              </div>
                            </div>
                            {active ? (
                              <div className="mt-0.5 h-2 w-2 rounded-full bg-primary" />
                            ) : null}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Hero image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selected ? (
              <div className="text-sm text-muted-foreground">
                Select a post to generate a hero image.
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    {labelForPost(selected)}{" "}
                    {selected.slug?.current ? (
                      <>
                        · <span className="font-mono">/{selected.slug.current}</span>
                      </>
                    ) : null}
                  </div>
                  <div className="text-xl font-semibold leading-tight">
                    {selected.title || "(untitled)"}
                  </div>
                  {selected.excerpt ? (
                    <div className="text-sm text-muted-foreground">
                      {selected.excerpt}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t">
                  <Button type="button" onClick={handleGenerate} disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Generating…
                      </>
                    ) : (
                      <>
                        <ImageIcon className="mr-2 size-4" />
                        Generate hero image
                      </>
                    )}
                  </Button>
                  {generated?.promptUsed ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => copyToClipboard(generated.promptUsed, "prompt")}
                    >
                      <Copy className="mr-2 size-4" />
                      Copy prompt
                    </Button>
                  ) : null}
                  {selected._id && process.env.NEXT_PUBLIC_SANITY_STUDIO_URL ? (
                    <Button type="button" variant="secondary" asChild>
                      <a
                        href={`${process.env.NEXT_PUBLIC_SANITY_STUDIO_URL.replace(/\/$/, "")}/desk/post;${selected._id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink className="mr-2 size-4" />
                        Open in Studio
                      </a>
                    </Button>
                  ) : null}
                </div>

                {imageDataUrl ? (
                  <div className="space-y-3">
                    <div className="rounded-lg border bg-muted overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageDataUrl}
                        alt={selected.title || "Generated hero image"}
                        className="w-full h-auto"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button type="button" asChild>
                        <a
                          href={imageDataUrl}
                          download={`${downloadName}.${downloadExt}`}
                        >
                          <Download className="mr-2 size-4" />
                          Download image
                        </a>
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => copyToClipboard(imageDataUrl, "data URL")}
                      >
                        <Copy className="mr-2 size-4" />
                        Copy data URL
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Download the image and upload it to the post’s `mainImage` in Sanity Studio.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border p-4 text-sm text-muted-foreground">
                    Generate an image to preview and download it here.
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

