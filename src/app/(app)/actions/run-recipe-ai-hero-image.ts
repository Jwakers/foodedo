"use server";

import { auth } from "@clerk/nextjs/server";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { ConvexError } from "convex/values";
import { generateImage } from "ai";
import { z } from "zod";
import { buildImagePrompt } from "../../../../scripts/image-generation-prompt";
import { getConvexHttpClient } from "@/lib/convex-http";
import { RECIPE_AI_HERO_ERRORS } from "convex/lib/constants";

const DEFAULT_MODEL = "google/imagen-4.0-ultra-generate-001";
const UPLOAD_TO_CONVEX_TIMEOUT_MS = 30_000;

function getRecipeImageModel(): string {
  const v = process.env.FOODEDO_RECIPE_IMAGE_MODEL?.trim();
  return v && v.length > 0 ? v : DEFAULT_MODEL;
}

const JobIdSchema = z.string().min(1);

export type RunRecipeAiHeroImageJobResult =
  | { success: true }
  | { success: false; error: string; code?: string };

async function convexWithAuth() {
  const { userId, getToken } = await auth();
  if (!userId) {
    throw new Error("Authentication required");
  }
  const token =
    (await getToken({ template: "convex" })) ?? (await getToken());
  if (!token) {
    throw new Error("Authentication required");
  }
  return getConvexHttpClient({ auth: token });
}

function convexErrorData(err: unknown): string | undefined {
  if (err instanceof ConvexError) {
    const d = err.data;
    return typeof d === "string" ? d : undefined;
  }
  return undefined;
}

export async function runRecipeAiHeroImageJob(
  rawJobId: unknown,
): Promise<RunRecipeAiHeroImageJobResult> {
  const parsed = JobIdSchema.safeParse(rawJobId);
  if (!parsed.success) {
    return { success: false, error: "Invalid job." };
  }
  const jobId = parsed.data as Id<"recipeAiHeroImageAttempts">;

  if (!process.env.AI_GATEWAY_API_KEY) {
    return {
      success: false,
      error: "Image generation is not configured.",
    };
  }

  let convex: ReturnType<typeof getConvexHttpClient>;
  try {
    convex = await convexWithAuth();
  } catch {
    return { success: false, error: "Authentication required." };
  }

  let snapshot;
  try {
    snapshot = await convex.query(
      api.recipeAiHeroImages.getRecipeSnapshotForAiHeroJob,
      { jobId },
    );
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return {
      success: false,
      error: `Could not load recipe for generation (${detail})`,
      code: "RECIPE_AI_HERO_CONVEX_QUERY_FAILED",
    };
  }
  if (!snapshot) {
    return {
      success: false,
      error: "This generation session is no longer valid. Please start again.",
      code: "RECIPE_AI_HERO_SNAPSHOT_MISS",
    };
  }

  if (snapshot.status === "already_ai") {
    try {
      await convex.mutation(api.recipeAiHeroImages.markRecipeAiHeroJobFailed, {
        jobId,
        errorMessage:
          "Recipe already has an AI-generated image; upload a photo first to replace it.",
      });
    } catch {
      // best-effort cleanup of pending row
    }
    return {
      success: false,
      code: RECIPE_AI_HERO_ERRORS.ALREADY_HAS_AI_HERO,
      error:
        "This recipe already has an AI-generated image. Upload your own photo first if you want a different one.",
    };
  }

  if (snapshot.status !== "ok") {
    return { success: false, error: "Could not load recipe for generation." };
  }

  let uploadUrl: string;
  try {
    const issued = await convex.mutation(
      api.recipeAiHeroImages.issueUploadUrlForRecipeAiHeroJob,
      { jobId },
    );
    uploadUrl = issued.uploadUrl;
  } catch (e) {
    const code = convexErrorData(e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Could not start upload.",
      code,
    };
  }

  const promptUsed = buildImagePrompt(
    snapshot.title,
    snapshot.description ?? "",
    snapshot.method,
  );
  const model = getRecipeImageModel();

  let mediaType: string;
  let bytes: Uint8Array;
  try {
    const result = await generateImage({
      model,
      prompt: promptUsed,
      aspectRatio: "16:9",
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(60_000),
    });
    const img = result.image;
    if (!img?.base64) {
      await convex.mutation(api.recipeAiHeroImages.markRecipeAiHeroJobFailed, {
        jobId,
        errorMessage: "No image returned by the model.",
      });
      return { success: false, error: "No image returned by the model." };
    }
    mediaType = img.mediaType ?? "image/png";
    const binaryString = atob(img.base64);
    bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Image generation failed.";
    try {
      await convex.mutation(api.recipeAiHeroImages.markRecipeAiHeroJobFailed, {
        jobId,
        errorMessage: message,
      });
    } catch {
      // best-effort
    }
    return { success: false, error: message };
  }

  let storageId: Id<"_storage">;
  const uploadController = new AbortController();
  const uploadTimer = setTimeout(
    () => uploadController.abort(),
    UPLOAD_TO_CONVEX_TIMEOUT_MS,
  );
  try {
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": mediaType },
      body: Buffer.from(bytes),
      signal: uploadController.signal,
    });
    if (!uploadRes.ok) {
      const text = await uploadRes.text().catch(() => "");
      await convex.mutation(api.recipeAiHeroImages.markRecipeAiHeroJobFailed, {
        jobId,
        errorMessage: `Upload failed (${uploadRes.status}): ${text.slice(0, 200)}`,
      });
      return { success: false, error: "Failed to store the image." };
    }
    const json = (await uploadRes.json()) as { storageId?: string };
    if (!json.storageId) {
      await convex.mutation(api.recipeAiHeroImages.markRecipeAiHeroJobFailed, {
        jobId,
        errorMessage: "Upload response missing storageId.",
      });
      return { success: false, error: "Failed to store the image." };
    }
    storageId = json.storageId as Id<"_storage">;
  } catch (e) {
    const aborted =
      e instanceof Error &&
      (e.name === "AbortError" || uploadController.signal.aborted);
    const message = aborted
      ? "Upload timed out. Check your connection and try again."
      : e instanceof Error
        ? e.message
        : "Upload failed.";
    try {
      await convex.mutation(api.recipeAiHeroImages.markRecipeAiHeroJobFailed, {
        jobId,
        errorMessage: message,
      });
    } catch {
      // best-effort
    }
    return { success: false, error: message };
  } finally {
    clearTimeout(uploadTimer);
  }

  try {
    await convex.mutation(api.recipeAiHeroImages.finalizeRecipeAiHeroJob, {
      jobId,
      storageId,
      model,
      promptCharLength: promptUsed.length,
    });
  } catch (e) {
    const code = convexErrorData(e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to save image to recipe.",
      code,
    };
  }

  return { success: true };
}
