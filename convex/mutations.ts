import { mutation } from "./_generated/server";
import { getCurrentUserOrThrow } from "./users";

/**
 * Validate and set isGeneratorEligible on all recipes.
 * Eligibility matches buildPool (meal plan generator): true when primaryProtein and complexityTier are both set and non-empty, or when isGeneratorEligible was already true.
 * Run from the dashboard to backfill or correct isGeneratorEligible after bulk imports or schema changes.
 */
export const validateRecipesGeneratorEligibility = mutation({
  args: {},
  handler: async (ctx) => {
    await getCurrentUserOrThrow(ctx);

    const recipes = await ctx.db.query("recipes").collect();
    let updated = 0;
    const now = Date.now();

    for (const recipe of recipes) {
      const hasMetadata =
        recipe.primaryProtein != null &&
        recipe.complexityTier != null;
      const eligible = recipe.isGeneratorEligible === true || hasMetadata;
      const current = recipe.isGeneratorEligible === true;
      if (eligible !== current) {
        await ctx.db.patch(recipe._id, {
          isGeneratorEligible: eligible,
          updatedAt: now,
        });
        updated++;
      }
    }

    return { total: recipes.length, updated };
  },
});
