"use client";

import { startOfLocalDayMs } from "@/lib/utils";
import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";
import { FunctionReturnType } from "convex/server";
import { createContext, useContext, type ReactNode } from "react";

type CurrentMealPlanLoaded = FunctionReturnType<
  typeof api.mealPlans.getCurrentMealPlan
>;

type CurrentMealPlanContextValue = {
  /** `undefined` while loading; `null` when no overlapping plan; otherwise the plan doc with entries. */
  currentPlan: CurrentMealPlanLoaded | null | undefined;
  /** Start of local "today" used for the query (ms). */
  localDayStartMs: number;
};

const CurrentMealPlanContext =
  createContext<CurrentMealPlanContextValue | null>(null);

export function CurrentMealPlanProvider({ children }: { children: ReactNode }) {
  const localDayStartMs = startOfLocalDayMs(Date.now());
  const currentPlan = useQuery(api.mealPlans.getCurrentMealPlan, {
    localDayStartMs,
  });

  return (
    <CurrentMealPlanContext.Provider
      value={{ currentPlan, localDayStartMs }}
    >
      {children}
    </CurrentMealPlanContext.Provider>
  );
}

export function useCurrentMealPlan(): CurrentMealPlanContextValue {
  const ctx = useContext(CurrentMealPlanContext);
  if (ctx === null) {
    throw new Error(
      "useCurrentMealPlan must be used within CurrentMealPlanProvider",
    );
  }
  return ctx;
}
