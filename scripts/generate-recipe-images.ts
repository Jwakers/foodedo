#!/usr/bin/env npx tsx
/**
 * Generate images for system recipes using Vercel AI Gateway (Imagen 4 Ultra).
 * Run: pnpm run generate-recipe-images [--limit N] [--dry-run]
 *
 * Requires: AI_GATEWAY_API_KEY, NEXT_PUBLIC_CONVEX_URL
 * Convex: NEXT_PUBLIC_CONVEX_URL or CONVEX_URL
 */

import dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: ".env.local", override: true });
import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
import { generateImage, gateway } from "ai";
import { buildImagePrompt } from "./image-generation-prompt";

const IMAGEN_MODEL = "google/imagen-4.0-ultra-generate-001";
const DELAY_MS = 2000;
const OUTPUT_DIR = path.resolve(process.cwd(), "scripts/generated-recipe-images");

interface RecipeForImage {
  _id: string;
  title: string;
  description?: string | null;
  method?: { title: string; description?: string | null }[];
}

function getSystemRecipesForImages(): RecipeForImage[] {
  const result = execSync(
    "npx convex run recipes:getSystemRecipesForImageGeneration",
    {
      encoding: "utf-8",
      env: process.env,
    }
  );

  try {
    const data = JSON.parse(result.trim());
    return Array.isArray(data) ? data : [];
  } catch {
    throw new Error("Failed to parse recipes from convex run output");
  }
}

function parseArgs(): { limit?: number; dryRun: boolean } {
  const args = process.argv.slice(2);
  let limit: number | undefined;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--limit" && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--dry-run") {
      dryRun = true;
    }
  }

  return { limit, dryRun };
}

async function generateImageForRecipe(
  recipe: RecipeForImage
): Promise<{ base64: string; mimeType: string } | null> {
  const prompt = buildImagePrompt(
    recipe.title,
    recipe.description ?? "",
    recipe.method ?? []
  );

  const result = await generateImage({
    model: gateway.image(IMAGEN_MODEL),
    prompt,
    aspectRatio: "16:9",
  });

  const img = result.image;
  if (!img) return null;
  return { base64: img.base64, mimeType: img.mediaType ?? "image/png" };
}

function saveImageToFile(
  recipe: RecipeForImage,
  imageBase64: string,
  mimeType: string
): string {
  const ext = mimeType === "image/jpeg" || mimeType === "image/jpg" ? "jpg" : "png";
  const safeTitle = recipe.title.replace(/[^a-zA-Z0-9-_ ]/g, "").replace(/\s+/g, "-").slice(0, 50);
  const filename = `${recipe._id}_${safeTitle}.${ext}`;
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(filepath, Buffer.from(imageBase64, "base64"));
  return filepath;
}

async function uploadImageToConvex(
  recipeId: string,
  imageBase64: string,
  mimeType: string
): Promise<void> {
  const convexBackend =
    process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL;
  if (!convexBackend) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL or CONVEX_URL not set");
  }

  const baseUrl = convexBackend.replace(".convex.cloud", ".convex.site");
  const endpoint = `${baseUrl}/upload-recipe-image`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipeId,
      image: imageBase64,
      mimeType,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Upload failed (${res.status}): ${text}\n` +
        `  Endpoint: POST ${endpoint}\n` +
        `  Convex backend: ${convexBackend}`
    );
  }
}

async function main(): Promise<void> {
  const gatewayKey = process.env.AI_GATEWAY_API_KEY;

  if (!gatewayKey) {
    console.error(
      "AI_GATEWAY_API_KEY is required. Get a key at https://vercel.com/ai-gateway"
    );
    process.exit(1);
  }

  const { limit, dryRun } = parseArgs();

  if (dryRun) {
    console.log("Dry run – no images will be uploaded.");
  }

  console.log("Fetching system recipes without images...");
  let recipes: RecipeForImage[];
  try {
    recipes = getSystemRecipesForImages();
  } catch (err) {
    console.error("Failed to fetch recipes:", err);
    process.exit(1);
  }

  if (recipes.length === 0) {
    console.log("No system recipes without images found.");
    return;
  }

  const toProcess = limit ? recipes.slice(0, limit) : recipes;
  console.log(`Processing ${toProcess.length} recipe(s)...`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const recipe = toProcess[i];
    console.log(`[${i + 1}/${toProcess.length}] ${recipe.title}`);

    try {
      const imageData = await generateImageForRecipe(recipe);
      if (!imageData) {
        console.warn(`  No image generated for ${recipe.title}`);
        failed++;
        continue;
      }

      const filepath = saveImageToFile(recipe, imageData.base64, imageData.mimeType);
      console.log(`  Saved to ${filepath}`);

      if (dryRun) {
        console.log(`  Would upload ${imageData.mimeType} image (${imageData.base64.length} chars base64)`);
        success++;
        continue;
      }

      await uploadImageToConvex(
        recipe._id,
        imageData.base64,
        imageData.mimeType
      );
      console.log(`  Uploaded successfully.`);
      success++;
    } catch (err) {
      console.error(`  Error:`, err instanceof Error ? err.message : err);
      failed++;
    }

    if (i < toProcess.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  console.log(`\nDone. Success: ${success}, Failed: ${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
