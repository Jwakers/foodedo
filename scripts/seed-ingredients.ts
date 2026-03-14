#!/usr/bin/env npx tsx
/**
 * Regenerate convex/ingredients-seed.json from docs/Food.json, then run the
 * Convex migration that seeds the ingredients table from that file.
 *
 * Run: pnpm run seed-ingredients
 *
 * Ensure npx convex dev is running (or your deployment is synced) so the
 * migration runs against dev/local, not production.
 */

import { spawnSync } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function main() {
  console.log("Regenerating convex/ingredients-seed.json...");
  const preview = spawnSync("pnpm", ["run", "ingredients-seed-preview"], {
    cwd: projectRoot,
    stdio: "inherit",
    shell: true,
  });
  if (preview.status !== 0) {
    process.exit(preview.status ?? 1);
  }

  console.log("Populating aliases in seed file...");
  const aliasScript = spawnSync("pnpm", ["run", "populate-ingredient-aliases"], {
    cwd: projectRoot,
    stdio: "inherit",
    shell: true,
  });
  if (aliasScript.status !== 0) {
    process.exit(aliasScript.status ?? 1);
  }

  console.log("Running migrations:seedIngredients (pushing latest code so seed file with aliases is used)...");
  const result = spawnSync(
    "npx",
    ["convex", "run", "migrations:seedIngredients", "--push"],
    {
      cwd: projectRoot,
      stdio: "inherit",
      shell: true,
    }
  );
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
  console.log("Done.");
}

main();
