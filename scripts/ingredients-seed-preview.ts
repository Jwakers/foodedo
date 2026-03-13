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
import { loadAndTransform } from "./lib/ingredients-food-json";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SEED_PATH = path.resolve(__dirname, "../docs/Food.json");
const PREVIEW_PATH = path.resolve(__dirname, "../docs/ingredients-seed-preview.json");
const CONVEX_SEED_PATH = path.resolve(__dirname, "../convex/ingredients-seed.json");

function main() {
  if (!fs.existsSync(SEED_PATH)) {
    console.error("Seed file not found:", SEED_PATH);
    process.exit(1);
  }

  console.log("Loading Food.json (JSONL) from", SEED_PATH);
  const items = loadAndTransform(SEED_PATH);
  console.log("Parsed", items.length, "ingredients");

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
