/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as chalkboard from "../chalkboard.js";
import type * as contact from "../contact.js";
import type * as crons from "../crons.js";
import type * as households from "../households.js";
import type * as http from "../http.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_systemRecipes from "../lib/systemRecipes.js";
import type * as mealPlanGenerator from "../mealPlanGenerator.js";
import type * as mealPlans from "../mealPlans.js";
import type * as migrations from "../migrations.js";
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
  chalkboard: typeof chalkboard;
  contact: typeof contact;
  crons: typeof crons;
  households: typeof households;
  http: typeof http;
  "lib/constants": typeof lib_constants;
  "lib/systemRecipes": typeof lib_systemRecipes;
  mealPlanGenerator: typeof mealPlanGenerator;
  mealPlans: typeof mealPlans;
  migrations: typeof migrations;
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
