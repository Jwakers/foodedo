/**
 * Load and transform docs/Food.json (JSONL) into the shape we seed into the
 * ingredients table. Used by ingredients-seed-preview.ts and seed-ingredients.ts.
 */

import * as fs from "node:fs";

/** One line from Food.json (JSONL) */
export type FoodJsonLine = {
  id: number;
  name: string;
  name_scientific?: string;
  food_group?: string;
  food_subgroup?: string;
  public_id?: string;
};

/** Shape we insert into Convex ingredients table (and output in preview JSON) */
export type IngredientSeedItem = {
  name: string;
  externalId?: string;
  foodGroup?: string;
  foodSubGroup?: string;
  displayName?: string;
  aliases: string[];
};

/** Convert one Food.json line to our seed shape. Aliases left empty for manual curation. */
export function toSeedItem(row: FoodJsonLine): IngredientSeedItem {
  const name = (row.name ?? "").trim();
  const externalId = row.public_id ?? String(row.id);
  return {
    name,
    externalId,
    foodGroup: row.food_group?.trim() || undefined,
    foodSubGroup: row.food_subgroup?.trim() || undefined,
    displayName: name || undefined,
    aliases: [],
  };
}

/** Load Food.json as JSONL and return array of IngredientSeedItem */
export function loadAndTransform(seedPath: string): IngredientSeedItem[] {
  const text = fs.readFileSync(seedPath, "utf-8");
  const lines = text.split("\n").filter((line) => line.trim());
  const items: IngredientSeedItem[] = [];
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    try {
      const row = JSON.parse(line) as FoodJsonLine;
      if (!row.name?.trim()) continue;
      items.push(toSeedItem(row));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(
        `Food.json parse error at line ${index + 1}: ${message}. Line content: ${line.slice(0, 80)}...`
      );
    }
  }
  return items;
}
