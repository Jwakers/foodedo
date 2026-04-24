/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adminIngredients from "../adminIngredients.js";
import type * as chalkboard from "../chalkboard.js";
import type * as contact from "../contact.js";
import type * as crons from "../crons.js";
import type * as households from "../households.js";
import type * as http from "../http.js";
import type * as ingredients from "../ingredients.js";
import type * as lib_applyMethodIngredientRefs from "../lib/applyMethodIngredientRefs.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_ingredientFoodGroups from "../lib/ingredientFoodGroups.js";
import type * as lib_ingredientFoodSubGroups from "../lib/ingredientFoodSubGroups.js";
import type * as lib_ingredientGrouping from "../lib/ingredientGrouping.js";
import type * as lib_leftoverIngredients from "../lib/leftoverIngredients.js";
import type * as lib_recipeAiHeroImageQuota from "../lib/recipeAiHeroImageQuota.js";
import type * as lib_recipePublicSlug from "../lib/recipePublicSlug.js";
import type * as lib_recipeStepIngredientMatch from "../lib/recipeStepIngredientMatch.js";
import type * as lib_servings from "../lib/servings.js";
import type * as lib_systemRecipes from "../lib/systemRecipes.js";
import type * as lib_unitConversion from "../lib/unitConversion.js";
import type * as mealPlanGenerator from "../mealPlanGenerator.js";
import type * as mealPlans from "../mealPlans.js";
import type * as migrations from "../migrations.js";
import type * as recipeAiHeroImages from "../recipeAiHeroImages.js";
import type * as recipeBehaviourStats from "../recipeBehaviourStats.js";
import type * as recipes from "../recipes.js";
import type * as shoppingLists from "../shoppingLists.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  adminIngredients: typeof adminIngredients;
  chalkboard: typeof chalkboard;
  contact: typeof contact;
  crons: typeof crons;
  households: typeof households;
  http: typeof http;
  ingredients: typeof ingredients;
  "lib/applyMethodIngredientRefs": typeof lib_applyMethodIngredientRefs;
  "lib/constants": typeof lib_constants;
  "lib/ingredientFoodGroups": typeof lib_ingredientFoodGroups;
  "lib/ingredientFoodSubGroups": typeof lib_ingredientFoodSubGroups;
  "lib/ingredientGrouping": typeof lib_ingredientGrouping;
  "lib/leftoverIngredients": typeof lib_leftoverIngredients;
  "lib/recipeAiHeroImageQuota": typeof lib_recipeAiHeroImageQuota;
  "lib/recipePublicSlug": typeof lib_recipePublicSlug;
  "lib/recipeStepIngredientMatch": typeof lib_recipeStepIngredientMatch;
  "lib/servings": typeof lib_servings;
  "lib/systemRecipes": typeof lib_systemRecipes;
  "lib/unitConversion": typeof lib_unitConversion;
  mealPlanGenerator: typeof mealPlanGenerator;
  mealPlans: typeof mealPlans;
  migrations: typeof migrations;
  recipeAiHeroImages: typeof recipeAiHeroImages;
  recipeBehaviourStats: typeof recipeBehaviourStats;
  recipes: typeof recipes;
  shoppingLists: typeof shoppingLists;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  crons: {
    public: {
      del: FunctionReference<
        "mutation",
        "internal",
        { identifier: { id: string } | { name: string } },
        null
      >;
      get: FunctionReference<
        "query",
        "internal",
        { identifier: { id: string } | { name: string } },
        {
          args: Record<string, any>;
          functionHandle: string;
          id: string;
          name?: string;
          schedule:
            | { kind: "interval"; ms: number }
            | { cronspec: string; kind: "cron"; tz?: string };
        } | null
      >;
      list: FunctionReference<
        "query",
        "internal",
        {},
        Array<{
          args: Record<string, any>;
          functionHandle: string;
          id: string;
          name?: string;
          schedule:
            | { kind: "interval"; ms: number }
            | { cronspec: string; kind: "cron"; tz?: string };
        }>
      >;
      register: FunctionReference<
        "mutation",
        "internal",
        {
          args: Record<string, any>;
          functionHandle: string;
          name?: string;
          schedule:
            | { kind: "interval"; ms: number }
            | { cronspec: string; kind: "cron"; tz?: string };
        },
        string
      >;
    };
  };
};
