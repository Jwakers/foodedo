import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import {
  getSuggestedIngredientRefsForStep,
  type CanonicalIngredientForMatch,
  type RecipeIngredientLine,
} from "./recipeStepIngredientMatch";

export async function buildCanonicalIngredientDocsMap(
  ctx: { db: QueryCtx["db"] },
  ingredients: { ingredientId?: Id<"ingredients"> }[] | undefined,
): Promise<Record<string, CanonicalIngredientForMatch>> {
  const uniq = [
    ...new Set(
      (ingredients ?? [])
        .map((i) => i.ingredientId)
        .filter((id): id is Id<"ingredients"> => id != null),
    ),
  ];
  const out: Record<string, CanonicalIngredientForMatch> = {};
  await Promise.all(
    uniq.map(async (id) => {
      const doc = await ctx.db.get(id);
      if (doc) {
        out[id] = {
          name: doc.name,
          displayName: doc.displayName,
          aliases: doc.aliases ?? null,
        };
      }
    }),
  );
  return out;
}

export function recipeLinesForMatcher(
  ingredients: Doc<"recipes">["ingredients"],
): RecipeIngredientLine[] {
  return (ingredients ?? []).map((i) => ({
    id: i.id,
    name: i.name,
    amount: i.amount,
    unit: i.unit,
    preparation: i.preparation,
    ingredientId: i.ingredientId,
  }));
}

type MethodStepIn = {
  title: string;
  description?: string;
  image?: Id<"_storage">;
  ingredientRefs?: string[];
  ingredientRefsSource?: "auto" | "user";
};

type MethodStepOut = MethodStepIn & {
  ingredientRefs?: string[];
  ingredientRefsSource: "auto" | "user";
};

type PrevStep = NonNullable<Doc<"recipes">["method"]>[number];

function effectiveSource(step: MethodStepIn, prev: PrevStep | undefined): "auto" | "user" {
  if (step.ingredientRefsSource === "user" || step.ingredientRefsSource === "auto") {
    return step.ingredientRefsSource;
  }
  if ((step.ingredientRefs?.length ?? 0) > 0) {
    return "user";
  }
  const pSource = prev?.ingredientRefsSource;
  if (pSource === "user" || pSource === "auto") {
    return pSource;
  }
  return "auto";
}

/**
 * Apply auto-matching for `auto` steps; preserve `user` steps (merge refs from payload or previous doc).
 */
export function finalizeMethodStepsForSave(
  incomingSteps: MethodStepIn[],
  recipeIngredientLines: RecipeIngredientLine[],
  canonMap: Record<string, CanonicalIngredientForMatch>,
  previousMethod: Doc<"recipes">["method"] | undefined,
): MethodStepOut[] {
  const validRefs = new Set(
    recipeIngredientLines.map((l) => l.id).filter((id): id is string => !!id),
  );

  return incomingSteps.map((step, i) => {
    const prev = previousMethod?.[i];
    const source = effectiveSource(step, prev);

    if (source === "user") {
      const rawRefs =
        step.ingredientRefs !== undefined
          ? step.ingredientRefs
          : (prev?.ingredientRefs ?? []);
      const refs = rawRefs.filter((r) => validRefs.has(r));
      return {
        title: step.title,
        description: step.description,
        image: step.image,
        ingredientRefs: refs.length ? refs : undefined,
        ingredientRefsSource: "user",
      };
    }

    const suggested = getSuggestedIngredientRefsForStep(
      { title: step.title, description: step.description ?? null },
      recipeIngredientLines,
      canonMap,
    );
    return {
      title: step.title,
      description: step.description,
      image: step.image,
      ingredientRefs: suggested.length ? suggested : undefined,
      ingredientRefsSource: "auto",
    };
  });
}
