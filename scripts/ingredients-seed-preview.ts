#!/usr/bin/env npx tsx
/**
 * Preview what would be seeded into the ingredients table from docs/Food.json (JSONL).
 * Does not touch the database. Outputs JSON to docs/ingredients-seed-preview.json
 * so you can review the structure and count before running the real seed.
 *
 * Run: pnpm run ingredients-seed-preview
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { loadAndTransform, type IngredientSeedItem } from "./lib/ingredients-food-json";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SEED_PATH = path.resolve(__dirname, "../docs/Food.json");
const PREVIEW_PATH = path.resolve(__dirname, "../docs/ingredients-seed-preview.json");
const CONVEX_SEED_PATH = path.resolve(__dirname, "../convex/ingredients-seed.json");
const MANUAL_SEED_PATH = path.resolve(__dirname, "../convex/ingredients-seed-manual.json");

function main() {
  if (!fs.existsSync(SEED_PATH)) {
    console.error("Seed file not found:", SEED_PATH);
    process.exit(1);
  }

  console.log("Loading Food.json (JSONL) from", SEED_PATH);
  const foodItems = loadAndTransform(SEED_PATH);
  console.log("Parsed", foodItems.length, "ingredients from Food.json");

  let manualItems: IngredientSeedItem[] = [];
  if (fs.existsSync(MANUAL_SEED_PATH)) {
    try {
      const raw = JSON.parse(fs.readFileSync(MANUAL_SEED_PATH, "utf-8")) as {
        items?: Partial<IngredientSeedItem>[];
      };
      const baseItems = raw.items ?? [];
      manualItems = baseItems.map((item) => {
        const name = (item.name ?? "").trim();
        if (name === "") {
          throw new Error(
            `Manual seed entry has blank name. Check convex/ingredients-seed-manual.json (item: ${JSON.stringify(item).slice(0, 80)}...)`
          );
        }
        const displayName = (item.displayName ?? item.name ?? "").trim() || name;
        const aliases = (item.aliases ?? [])
          .map((a) => (a ?? "").trim())
          .filter((a) => a !== "");
        const base = {
          name,
          foodGroup: item.foodGroup,
          foodSubGroup: item.foodSubGroup,
          displayName: displayName || undefined,
          aliases,
        };
        const rawExtId = (item.externalId ?? "").trim();
        return rawExtId !== "" ? { ...base, externalId: rawExtId } : base;
      });
      console.log("Loaded", manualItems.length, "manual ingredients from convex/ingredients-seed-manual.json");
    } catch (e) {
      const err = e as NodeJS.ErrnoException;
      if (err?.code === "ENOENT") {
        console.log("Manual seed file not found at", MANUAL_SEED_PATH, "- continuing with Food.json only.");
      } else {
        console.error("Manual seed file is missing or malformed:", MANUAL_SEED_PATH, err);
        throw e;
      }
    }
  }

  let items: IngredientSeedItem[] = [...foodItems, ...manualItems];

  // Preserve aliases from existing seed so regeneration doesn't wipe populate-ingredient-aliases output
  if (fs.existsSync(CONVEX_SEED_PATH)) {
    try {
      const existing = JSON.parse(fs.readFileSync(CONVEX_SEED_PATH, "utf-8")) as {
        items?: IngredientSeedItem[];
      };
      const aliasByKey = new Map<string, string[]>();
      for (const item of existing.items ?? []) {
        const key = (item.externalId ?? item.name ?? "").trim();
        if (key && item.aliases?.length) aliasByKey.set(key, item.aliases);
      }
      if (aliasByKey.size > 0) {
        items = items.map((item) => {
          const key = (item.externalId ?? item.name ?? "").trim();
          const preserved = key ? aliasByKey.get(key) : undefined;
          if (preserved !== undefined) {
            const merged = [...(preserved ?? []), ...(item.aliases ?? [])]
              .map((a) => a.trim())
              .filter((a) => a.length > 0);
            const mergedAliases = Array.from(
              new Map(merged.map((a) => [a.toLowerCase(), a])).values()
            );
            return { ...item, aliases: mergedAliases };
          }
          return item;
        });
        console.log("Preserved aliases for", aliasByKey.size, "ingredients from existing seed");
      }
    } catch (e) {
      console.warn("Could not load existing seed to preserve aliases:", (e as Error).message);
    }
  }

  console.log("Total items for preview/seed:", items.length);

  const output = {
    _meta: {
      generatedAt: new Date().toISOString(),
      sourceFile: "docs/Food.json",
      totalItems: items.length,
      description:
        "Structure of what will be seeded into the ingredients table. Run seed-ingredients to apply.",
    },
    items,
  };

  fs.writeFileSync(PREVIEW_PATH, JSON.stringify(output, null, 2), "utf-8");
  console.log("Preview written to", PREVIEW_PATH);

  fs.writeFileSync(CONVEX_SEED_PATH, JSON.stringify({ items }), "utf-8");
  console.log("Seed data written to convex/ingredients-seed.json (used by migrations:seedIngredients)");
}

main();
