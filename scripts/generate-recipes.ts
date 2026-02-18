#!/usr/bin/env npx tsx
/**
 * Standalone recipe generation script.
 * Run: pnpm run generate-recipes <protein> <batchSize>
 * Example: pnpm run generate-recipes chicken 10
 *
 * Existing recipe titles for the same protein are automatically excluded to avoid duplicates.
 * Output: convex/generated-recipes/{protein}_batch_{seq}.json
 */

import dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: ".env.local", override: true });
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { generateText } from "ai";
import { PRIMARY_PROTEINS } from "../convex/lib/constants";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OUTPUT_DIR = path.resolve(__dirname, "../convex/generated-recipes");

const RECIPE_GENERATION_PROMPT = `GOAL:
Generate {{BATCH_SIZE}} popular, mainstream dinner recipes using {{PRIMARY_PROTEIN}} as the primary protein.
{{PROTEIN_CLARIFICATION}}

These recipes will seed a system-level recipe database for an intelligent weekly meal planning engine.

CRITICAL CONSTRAINTS:

1. Audience:
   - UK market
   - Ingredients must be easily available in UK supermarkets (Tesco, Sainsbury's, Asda, Aldi, Waitrose, etc.)
   - Avoid obscure or hard-to-source ingredients
   - Avoid American-only branded ingredients
   - Use metric units where appropriate (g, kg, ml, l)
   - Use UK-friendly terminology (e.g., courgette not zucchini, aubergine not eggplant)

2. Recipe Style:
   - Popular, recognisable meals
   - Family-friendly
   - Not avant-garde
   - Not overly complicated
   - Weeknight appropriate
   - No experimental gastronomy
   - Avoid niche diet trends

3. Cuisine:
   Must ONLY use values from this list:
   [
   "italian",
   "indian",
   "mexican",
   "thai",
   "chinese",
   "japanese",
   "korean",
   "french",
   "mediterranean",
   "middle_eastern",
   "british",
   "american",
   "caribbean",
   "african",
   "vietnamese",
   "greek",
   "spanish",
   "other"
   ]

4. Distribution Rules (VERY IMPORTANT):
   - At least 40% must be 45 minutes or under total time
   - At least 30% must be simple traybake / one-pan / low complexity meals
   - Meals must feel meaningfully different from each other
   - Vary cooking methods (roasted, grilled, pan-fried, baked, etc.)
   - Vary carb bases (rice, pasta, potatoes, bread, none)
   - Avoid repeating similar sauces or spice profiles
   - Avoid near-duplicate meals

{{EXCLUDED_TITLES_SECTION}}

5. Ingredients:
   - MUST only use preparation values from:
     [
     "chopped","finely chopped","roughly chopped","diced","finely diced","rough chop",
     "sliced","thinly sliced","thickly sliced","chiffonade","julienned","brunoise",
     "minced","grated","finely grated","shredded","cubed","quartered","halved","whole",
     "crushed","mashed","pureed",
     "room temperature","chilled","warmed","softened","melted","frozen","defrosted",
     "beaten","whipped","folded","kneaded","rolled","pressed","strained","drained",
     "rinsed","peeled","trimmed","seeded","cored","stemmed","zested","de-boned",
     "filleted","butterflied",
     "blanched","toasted","roasted","caramelized","sautéed","fried","poached",
     "grilled","boiled","steamed","smoked",
     "fresh","dried"
     ]

   - MUST only use units from:
     Volume: ["cups","tsp","tbsp","fl oz","gal","ml","l","pt","qt"]
     Weight: ["lbs","oz","g","kg","mg"]
     Count: ["pinch","dash","handful","drop"]
     Items: [
     "piece","whole","clove","slice","sheet","sprig","stalk","stem",
     "head","bunch","bulb","wedge","cube","strip","fillet","leaf",
     "can","jar","packet","package","container","bottle","bag",
     "box","loaf","stick","square","round","breast","thigh","leg","rack"
     ]

   - Use "clove" ONLY for garlic. For ginger root use "piece" or "g" (never "clove").

   - Use "piece" (singular) not "pieces" for countable items (tortillas, pitas, etc.).

   - Use exactly ONE preparation per ingredient. Never combine (e.g. no "grilled and sliced" or "cooked and shredded").
   - For citrus to be juiced: use "whole" (the method will describe juicing).
   - For Parmesan or hard cheese: use "grated" or "finely grated" (never "shaved").
   - For broccoli: use "chopped" or "halved" (never "florets").
   - For flattened chicken: use "butterflied" (never "flattened").

   - Do NOT invent units
   - Do NOT invent preparation types
   - Use null for preparation when an ingredient needs no preparation (JSON null, not "none")
   - Keep ingredient naming consistent and normalised
   - No duplicate ingredient entries

6. Schema Alignment:
   Output must strictly follow this shape:

{
recipes: [
{
title: string,
description: string,
prepTime: number,
cookTime: number,
serves: number,
category: "dinner",
ingredients: [
{
name: string,
amount: number,
unit: string,
preparation: string | null
}
],
method: [
{
title: string,
description: string
}
],
nutrition: {
calories: number,
protein: number,
fat: number,
carbohydrates: number
},
primaryProtein: "{{PRIMARY_PROTEIN}}",
complexityTier: "simple" | "moderate" | "complex",
cuisine: ["one_value_from_allowed_list"]
}
]
}

7. Intelligent Planner Awareness:
   These recipes are foundational data for a scoring-based meal planning algorithm.

   They must:
   - Represent a balanced distribution of flavour profiles
   - Represent a balanced distribution of effort levels
   - Provide enough structural variety to avoid repetition fatigue
   - Be appropriate for recurring weekly rotation

8. Nutrition:
   - Provide realistic approximate values per serving
   - Keep within reasonable dinner ranges (400–900 kcal typical)
   - Avoid extreme macro distortions

FINAL INSTRUCTION:
Return ONLY valid JSON.
No markdown.
No explanation.
No commentary.
No extra text.
`;

function getExcludedTitles(protein: string): string[] {
  if (!fs.existsSync(OUTPUT_DIR)) return [];
  const files = fs.readdirSync(OUTPUT_DIR);
  const prefix = `${protein}_batch_`;
  const titles: string[] = [];
  for (const file of files) {
    if (!file.startsWith(prefix) || !file.endsWith(".json")) continue;
    try {
      const content = fs.readFileSync(path.join(OUTPUT_DIR, file), "utf-8");
      const data = JSON.parse(content) as { recipes?: { title?: string }[] };
      if (data.recipes && Array.isArray(data.recipes)) {
        for (const r of data.recipes) {
          if (r.title && typeof r.title === "string") titles.push(r.title);
        }
      }
    } catch {
      // Skip invalid files
    }
  }
  return titles;
}

const MAIN_PROTEINS =
  "chicken, beef, pork, fish, seafood, vegetarian, vegan, lamb, turkey";

function getProteinClarification(protein: string): string {
  if (protein === "other") {
    return `
PROTEIN CLARIFICATION: "other" means a protein NOT in the main list (${MAIN_PROTEINS}).
Use something else as the primary ingredient, e.g. duck, venison, tofu, beans, lentils, halloumi, prawns, squid, rabbit.
Vary the actual protein across recipes in this batch. Output primaryProtein as "other" in the schema.`;
  }
  if (protein === "none") {
    return `
PROTEIN CLARIFICATION: "none" means recipes without a primary protein focus (sides, salads, egg-based dishes, cheese-based, vegetable-forward).
Output primaryProtein as "none" in the schema.`;
  }
  return "";
}

function buildPrompt(protein: string, batchSize: number): string {
  const excludedTitles = getExcludedTitles(protein);
  const excludedSection =
    excludedTitles.length > 0
      ? `EXCLUDED RECIPES (do NOT generate any of these - they already exist):\n${excludedTitles.map((t) => `   - ${t}`).join("\n")}\n`
      : "";

  return RECIPE_GENERATION_PROMPT.replace(/\{\{PRIMARY_PROTEIN\}\}/g, protein)
    .replace(/\{\{BATCH_SIZE\}\}/g, String(batchSize))
    .replace("{{PROTEIN_CLARIFICATION}}", getProteinClarification(protein))
    .replace("{{EXCLUDED_TITLES_SECTION}}", excludedSection);
}

function getNextBatchSeq(protein: string): number {
  if (!fs.existsSync(OUTPUT_DIR)) {
    return 1;
  }
  const files = fs.readdirSync(OUTPUT_DIR);
  const prefix = `${protein}_batch_`;
  const matches = files
    .filter((f) => f.startsWith(prefix) && f.endsWith(".json"))
    .map((f) => {
      const numStr = f.slice(prefix.length, -5);
      return parseInt(numStr, 10);
    })
    .filter((n) => !isNaN(n));
  return matches.length === 0 ? 1 : Math.max(...matches) + 1;
}

function parseArgs(): { protein: string; batchSize: number } {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error("Usage: pnpm run generate-recipes <protein> [batchSize]");
    console.error(`Valid proteins: ${PRIMARY_PROTEINS.join(", ")}`);
    process.exit(1);
  }
  const protein = args[0].toLowerCase();
  const batchSize = args[1] ? parseInt(args[1], 10) : 10;

  if (
    !PRIMARY_PROTEINS.includes(protein as (typeof PRIMARY_PROTEINS)[number])
  ) {
    console.error(`Invalid protein: ${args[0]}`);
    console.error(`Valid proteins: ${PRIMARY_PROTEINS.join(", ")}`);
    process.exit(1);
  }
  if (isNaN(batchSize) || batchSize < 1 || batchSize > 10) {
    console.error(
      "batchSize must be 1–10 (larger batches may hit model output limits)",
    );
    process.exit(1);
  }

  return { protein, batchSize };
}

async function main(): Promise<void> {
  const { protein, batchSize } = parseArgs();

  const excludedTitles = getExcludedTitles(protein);
  if (excludedTitles.length > 0) {
    console.log(
      `Excluding ${excludedTitles.length} existing recipe titles to avoid duplicates.`,
    );
  }
  console.log(`Generating ${batchSize} ${protein} recipes...`);

  const prompt = buildPrompt(protein, batchSize);

  try {
    const result = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
      temperature: 0.7,
    });

    let text = result.text.trim();
    // Strip markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      text = jsonMatch[1].trim();
    }

    let data: { recipes?: unknown[] };
    try {
      data = JSON.parse(text);
    } catch {
      console.error(
        "LLM returned invalid JSON. Writing raw response to .raw file for debugging.",
      );
      const rawPath = path.join(
        OUTPUT_DIR,
        `${protein}_batch_${String(getNextBatchSeq(protein)).padStart(3, "0")}_raw.txt`,
      );
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      fs.writeFileSync(rawPath, result.text, "utf-8");
      console.error(`Raw output written to: ${rawPath}`);
      process.exit(1);
    }

    if (!data.recipes || !Array.isArray(data.recipes)) {
      console.error(
        "LLM response missing 'recipes' array. Got keys:",
        Object.keys(data),
      );
      process.exit(1);
    }

    const seq = getNextBatchSeq(protein);
    const filename = `${protein}_batch_${String(seq).padStart(3, "0")}.json`;
    const outPath = path.join(OUTPUT_DIR, filename);

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");

    console.log(`Wrote ${data.recipes.length} recipes to ${outPath}`);
  } catch (err) {
    console.error("Generation failed:", err);
    process.exit(1);
  }
}

main();
