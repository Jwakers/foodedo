#!/usr/bin/env npx tsx
/**
 * Validates and fixes generated recipe JSON files.
 * Run: pnpm exec tsx scripts/validate-recipes.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CUISINES,
  PREPARATION_OPTIONS,
  UNITS_FLAT,
} from "../convex/lib/constants";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RECIPES_DIR = path.resolve(__dirname, "../convex/generated-recipes");

const VALID_PREPARATIONS = new Set(PREPARATION_OPTIONS);
const VALID_UNITS = new Set(UNITS_FLAT);
const VALID_CUISINES = new Set(CUISINES);

const UNIT_FIXES: Record<string, string> = {
  pieces: "piece",
  item: "piece",
  items: "piece",
  sheets: "sheet",
};

const PREP_FIXES: Record<string, string | null> = {
  juiced: "whole",
  shaved: "grated",
  florets: "chopped",
  flattened: "butterflied",
  "finely shredded": "shredded",
  "peeled and cubed": "cubed",
  "de-stemmed": "stemmed",
  uncooked: null,
  cooked: null,
  wedged: "quartered",
  cleaned: "trimmed",
};

interface Ingredient {
  name: string;
  amount: number;
  unit?: string;
  preparation?: string | null;
}

interface Recipe {
  title: string;
  description?: string;
  ingredients?: Ingredient[];
  method?: { title: string; description?: string }[];
  [key: string]: unknown;
}

function extractIngredientKeywords(name: string): string[] {
  const stop = new Set([
    "the", "and", "or", "with", "for", "in", "a", "an", "of", "to",
  ]);
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stop.has(w));
}

function methodMentionsIngredient(
  methodText: string,
  ingName: string,
  keywords: string[]
): boolean {
  const lower = methodText.toLowerCase();
  if (lower.includes(ingName.toLowerCase())) return true;
  for (const kw of keywords) {
    if (lower.includes(kw)) return true;
  }
  return false;
}

function validateRecipe(
  recipe: Recipe,
  filePath: string,
  idx: number
): { fixes: number; flags: string[] } {
  let fixes = 0;
  const flags: string[] = [];

  // Fix cuisine
  if (recipe.cuisine && Array.isArray(recipe.cuisine)) {
    for (let i = 0; i < recipe.cuisine.length; i++) {
      const c = recipe.cuisine[i];
      if (typeof c === "string" && !VALID_CUISINES.has(c as (typeof CUISINES)[number])) {
        recipe.cuisine[i] = "other";
        fixes++;
        flags.push(`Cuisine "${c}" invalid, fixed to "other"`);
      }
    }
  }

  // Fix ingredients
  if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
    for (const ing of recipe.ingredients) {
      if (ing.unit && UNIT_FIXES[ing.unit]) {
        ing.unit = UNIT_FIXES[ing.unit];
        fixes++;
      }
      if (ing.unit && !VALID_UNITS.has(ing.unit as (typeof UNITS_FLAT)[number])) {
        flags.push(`Invalid unit "${ing.unit}" for ${ing.name}`);
      }
      const prep = ing.preparation;
      if (prep !== null && prep !== undefined && typeof prep === "string") {
        if (PREP_FIXES[prep]) {
          ing.preparation = PREP_FIXES[prep];
          fixes++;
        } else if (!VALID_PREPARATIONS.has(prep as (typeof PREPARATION_OPTIONS)[number])) {
          flags.push(`Invalid preparation "${prep}" for ${ing.name}`);
        }
      }
    }
  }

  // Check method mentions ingredients
  const methodText = (recipe.method || [])
    .map((s) => (s.description || "").toLowerCase())
    .join(" ");
  const methodTitles = (recipe.method || [])
    .map((s) => (s.title || "").toLowerCase())
    .join(" ");
  const allMethodText = methodText + " " + methodTitles;

  if (recipe.ingredients && recipe.method) {
    for (const ing of recipe.ingredients) {
      const keywords = extractIngredientKeywords(ing.name);
      if (
        ing.name.toLowerCase() !== "salt" &&
        ing.name.toLowerCase() !== "pepper" &&
        ing.name.toLowerCase() !== "black pepper" &&
        ing.name.toLowerCase() !== "oil" &&
        ing.name.toLowerCase() !== "olive oil" &&
        ing.name.toLowerCase() !== "cooking oil" &&
        ing.name.toLowerCase() !== "water"
      ) {
        if (!methodMentionsIngredient(allMethodText, ing.name, keywords)) {
          flags.push(`Ingredient "${ing.name}" may not be used in method`);
        }
      }
    }
  }

  return { fixes, flags };
}

function main(): void {
  const files = fs.readdirSync(RECIPES_DIR).filter((f) => f.endsWith(".json"));
  let totalFixes = 0;
  const allFlags: { file: string; recipe: string; flag: string }[] = [];

  for (const file of files) {
    const filePath = path.join(RECIPES_DIR, file);
    const content = fs.readFileSync(filePath, "utf-8");
    let data: { recipes?: Recipe[] };
    try {
      data = JSON.parse(content);
    } catch {
      console.error(`Failed to parse ${file}`);
      continue;
    }
    if (!data.recipes || !Array.isArray(data.recipes)) continue;

    let fileFixes = 0;
    for (let i = 0; i < data.recipes.length; i++) {
      const { fixes, flags } = validateRecipe(data.recipes[i], filePath, i);
      fileFixes += fixes;
      for (const flag of flags) {
        allFlags.push({ file, recipe: data.recipes[i].title, flag });
      }
    }
    totalFixes += fileFixes;
    if (fileFixes > 0) {
      fs.writeFileSync(
        filePath,
        JSON.stringify(data, null, 2),
        "utf-8"
      );
      console.log(`${file}: ${fileFixes} fixes applied`);
    }
  }

  console.log(`\nTotal fixes applied: ${totalFixes}`);

  if (allFlags.length > 0) {
    console.log("\n--- Flags (manual review) ---");
    for (const { file, recipe, flag } of allFlags) {
      console.log(`[${file}] ${recipe}: ${flag}`);
    }
  }
}

main();
