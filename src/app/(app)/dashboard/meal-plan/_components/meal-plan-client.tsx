"use client";

import { ROUTES } from "@/app/constants";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/posthog-client";
import { pickPreferredMealPlanIdFromSummaries } from "@/lib/meal-plan-preference";
import { cn, startOfLocalDayMs } from "@/lib/utils";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import {
  ArrowRight,
  CalendarPlus,
  CheckCircle2,
  Home,
  MoreVertical,
  ShoppingCart,
  Sparkles,
  Trash2,
  UserMinus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { EmptySlot } from "./empty-slot";
import { MealPlanCard } from "./meal-plan-card";
import { MealPlanDayView } from "./meal-plan-day-view";
import { MealPlanRecipePickerModal } from "./meal-plan-recipe-picker-modal";

const MEAL_PLAN_LAST_VIEWED_STORAGE_KEY = "foodedo_meal_plan_last_viewed_id";

type CurrentPlan = NonNullable<
  FunctionReturnType<typeof api.mealPlans.getMealPlan>
>;

function formatPlanRangeShort(start: number | undefined, end: number): string {
  const fmt = (ms: number) =>
    new Date(ms).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  if (start !== undefined) return `${fmt(start)} – ${fmt(end)}`;
  return fmt(end);
}

export default function MealPlanClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");

  const localDayStartMs = startOfLocalDayMs(Date.now());

  const planSummaries = useQuery(api.mealPlans.getActiveMealPlanSummaries, {
    localDayStartMs,
  });

  const resolvedPlanId = useMemo(() => {
    if (planSummaries === undefined) return undefined;
    if (planSummaries.length === 0) return null;

    const validIds = new Set(planSummaries.map((s) => s._id));
    if (planParam && validIds.has(planParam as Id<"mealPlans">)) {
      return planParam as Id<"mealPlans">;
    }
    if (typeof window !== "undefined") {
      const last = sessionStorage.getItem(MEAL_PLAN_LAST_VIEWED_STORAGE_KEY);
      if (last && validIds.has(last as Id<"mealPlans">)) {
        return last as Id<"mealPlans">;
      }
    }
    return pickPreferredMealPlanIdFromSummaries(
      planSummaries,
      localDayStartMs,
    );
  }, [planSummaries, planParam, localDayStartMs]);

  useEffect(() => {
    if (planSummaries === undefined) return;

    if (planSummaries.length === 0) {
      if (planParam) {
        router.replace(pathname, { scroll: false });
      }
      return;
    }

    if (resolvedPlanId && planParam !== resolvedPlanId) {
      router.replace(
        `${pathname}?plan=${encodeURIComponent(resolvedPlanId)}`,
        { scroll: false },
      );
    }

    if (resolvedPlanId && typeof window !== "undefined") {
      sessionStorage.setItem(
        MEAL_PLAN_LAST_VIEWED_STORAGE_KEY,
        resolvedPlanId,
      );
    }
  }, [planSummaries, planParam, resolvedPlanId, pathname, router]);

  const currentPlan = useQuery(
    api.mealPlans.getMealPlan,
    resolvedPlanId !== undefined && resolvedPlanId !== null
      ? { mealPlanId: resolvedPlanId }
      : "skip",
  );
  const poolRecipes = useQuery(api.recipes.getRecipesForWeeklyPlan, {
    limit: 50,
  });
  const households = useQuery(api.households.getUserHouseholds);
  const listsForPlan = useQuery(
    api.shoppingLists.getShoppingListsByMealPlan,
    currentPlan ? { mealPlanId: currentPlan._id } : "skip",
  );
  const personalChalkboard = useQuery(api.chalkboard.getPersonalChalkboard);
  const householdChalkboards = useQuery(
    api.chalkboard.getAllHouseholdChalkboards,
  );

  const generateWeeklyPlan = useMutation(api.mealPlans.generateWeeklyPlan);
  const createBlankWeeklyPlan = useMutation(api.mealPlans.createBlankWeeklyPlan);
  const regenerateWeeklyPlan = useMutation(api.mealPlans.regenerateWeeklyPlan);
  const removeEntry = useMutation(api.mealPlans.removeEntry);
  const updateEntry = useMutation(api.mealPlans.updateEntry);
  const addEntry = useMutation(api.mealPlans.addEntry);
  const deleteMealPlan = useMutation(api.mealPlans.deleteMealPlan);
  const shareMealPlanWithHousehold = useMutation(
    api.mealPlans.shareMealPlanWithHousehold,
  );
  const unshareMealPlan = useMutation(api.mealPlans.unshareMealPlan);
  const createShoppingListFromMealPlan = useMutation(
    api.shoppingLists.createShoppingListFromMealPlan,
  );
  const finaliseMealPlan = useMutation(api.mealPlans.finaliseMealPlan);

  const [selectedChalkboardIds, setSelectedChalkboardIds] = useState<
    Set<Id<"chalkboardItems">>
  >(new Set());
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareHouseholdId, setShareHouseholdId] = useState<
    Id<"households"> | ""
  >("");
  const [isSharing, setIsSharing] = useState(false);
  const shareInFlightRef = useRef(false);
  const [showDeletePlanDialog, setShowDeletePlanDialog] = useState(false);
  const [showUnshareConfirmDialog, setShowUnshareConfirmDialog] =
    useState(false);
  const [showFinaliseDialog, setShowFinaliseDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  /** When the user has multiple households, we default the picker so generation shares to a household; omitting would leave the new plan private. */
  const [generateWeekHouseholdId, setGenerateWeekHouseholdId] = useState<
    Id<"households"> | ""
  >("");

  useEffect(() => {
    if (
      households &&
      households.length > 1 &&
      generateWeekHouseholdId === "" &&
      households[0]
    ) {
      setGenerateWeekHouseholdId(households[0]._id);
    }
  }, [households, generateWeekHouseholdId]);
  const [isFinalising, setIsFinalising] = useState(false);
  const [pickerState, setPickerState] = useState<{
    mode: "add" | "replace";
    entry?: CurrentPlan["entries"][number];
  } | null>(null);

  const entriesSorted = useMemo(() => {
    const entries = currentPlan?.entries ?? [];
    return [...entries].sort(
      (a, b) => (a.order ?? 999) - (b.order ?? 999) || a.date - b.date,
    );
  }, [currentPlan?.entries]);

  const emptySlotsCount = useMemo(
    () => Math.max(0, 7 - (currentPlan?.entries?.length ?? 0)),
    [currentPlan?.entries?.length],
  );

  const handleGenerateWeek = useCallback(async () => {
    if (households === undefined) {
      toast.info("Loading households…");
      return;
    }
    setIsGenerating(true);
    try {
      const payload =
        households.length > 1
          ? {
              householdId:
                (generateWeekHouseholdId as Id<"households">) ||
                households[0]!._id,
            }
          : {};
      const { planId } = await generateWeeklyPlan(payload);
      trackEvent(ANALYTICS_EVENTS.MEAL_PLAN_GENERATED, {
        shared_with_household: households.length > 1,
      });
      if (typeof window !== "undefined") {
        sessionStorage.setItem(MEAL_PLAN_LAST_VIEWED_STORAGE_KEY, planId);
      }
      router.push(ROUTES.mealPlanWithId(planId));
      toast.success("Your week is ready!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate plan");
    } finally {
      setIsGenerating(false);
    }
  }, [generateWeeklyPlan, generateWeekHouseholdId, households, router]);

  const handleBlankWeek = useCallback(async () => {
    if (households === undefined) {
      toast.info("Loading households…");
      return;
    }
    setIsGenerating(true);
    try {
      const payload =
        households.length > 1
          ? {
              householdId:
                (generateWeekHouseholdId as Id<"households">) ||
                households[0]!._id,
            }
          : {};
      const { planId } = await createBlankWeeklyPlan(payload);
      trackEvent(ANALYTICS_EVENTS.MEAL_PLAN_BLANK_CREATED, {
        shared_with_household: households.length > 1,
      });
      if (typeof window !== "undefined") {
        sessionStorage.setItem(MEAL_PLAN_LAST_VIEWED_STORAGE_KEY, planId);
      }
      router.push(ROUTES.mealPlanWithId(planId));
      toast.success("Empty week ready — add your meals.");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to create empty week",
      );
    } finally {
      setIsGenerating(false);
    }
  }, [
    createBlankWeeklyPlan,
    generateWeekHouseholdId,
    households,
    router,
  ]);

  const handleRegenerateWeek = useCallback(async () => {
    if (!currentPlan) return;
    setIsGenerating(true);
    try {
      const { planId } = await regenerateWeeklyPlan({
        previousPlanId: currentPlan._id,
      });
      trackEvent(ANALYTICS_EVENTS.MEAL_PLAN_REGENERATED);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(MEAL_PLAN_LAST_VIEWED_STORAGE_KEY, planId);
      }
      router.push(ROUTES.mealPlanWithId(planId));
      toast.success("Week regenerated. Locked meals kept.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to regenerate");
    } finally {
      setIsGenerating(false);
    }
  }, [currentPlan, regenerateWeeklyPlan, router]);

  const handleLockToggle = useCallback(
    async (entry: CurrentPlan["entries"][number]) => {
      try {
        await updateEntry({
          entryId: entry._id,
          isLocked: !entry.isLocked,
        });
        toast.success(entry.isLocked ? "Meal unlocked" : "Meal locked");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update");
      }
    },
    [updateEntry],
  );

  const handleSwitchClick = useCallback(
    async (entry: CurrentPlan["entries"][number]) => {
      const pool = poolRecipes ?? [];
      const inPlanIds = new Set(
        (currentPlan?.entries ?? []).map((e) => e.recipeId),
      );
      let candidates = pool.filter(
        (r) => r._id !== entry.recipeId && !inPlanIds.has(r._id),
      );
      if (candidates.length === 0) {
        candidates = pool.filter((r) => r._id !== entry.recipeId);
      }
      if (candidates.length === 0) {
        toast.error("No other recipes available");
        return;
      }
      const picked = candidates[Math.floor(Math.random() * candidates.length)];
      try {
        await updateEntry({ entryId: entry._id, recipeId: picked._id });
        toast.success("Meal changed");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to change meal");
      }
    },
    [poolRecipes, currentPlan?.entries, updateEntry],
  );

  const handleRemoveEntry = useCallback(
    async (entryId: Id<"mealPlanEntries">) => {
      try {
        await removeEntry({ entryId });
        toast.success("Meal removed");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to remove meal");
      }
    },
    [removeEntry],
  );

  const handleGenerateList = useCallback(async () => {
    if (!currentPlan) return;
    try {
      const { listId } = await createShoppingListFromMealPlan({
        mealPlanId: currentPlan._id,
        chalkboardItemIds: Array.from(selectedChalkboardIds),
      });
      trackEvent(ANALYTICS_EVENTS.SHOPPING_LIST_GENERATED, {
        meal_count: currentPlan.entries?.length ?? 0,
        chalkboard_items_included: selectedChalkboardIds.size,
      });
      setShowGenerateDialog(false);
      setSelectedChalkboardIds(new Set());
      toast.success("Shopping list created from meal plan");
      router.push(ROUTES.shoppingListWithId(listId));
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to create shopping list",
      );
    }
  }, [
    currentPlan,
    selectedChalkboardIds,
    createShoppingListFromMealPlan,
    router,
  ]);

  const performShareWithHousehold = useCallback(
    async (
      mealPlanId: Id<"mealPlans">,
      householdId: Id<"households">,
      mealCount: number,
    ): Promise<void> => {
      await shareMealPlanWithHousehold({ mealPlanId, householdId });
      trackEvent(ANALYTICS_EVENTS.MEAL_PLAN_SHARED_WITH_HOUSEHOLD, {
        household_id: householdId,
        meal_count: mealCount,
      });
      setShowShareDialog(false);
      setShareHouseholdId("");
      toast.success("Meal plan shared with household");
    },
    [shareMealPlanWithHousehold],
  );

  const runMealPlanShare = useCallback(
    async (householdId: Id<"households">) => {
      if (!currentPlan || isSharing || shareInFlightRef.current) return;
      shareInFlightRef.current = true;
      setIsSharing(true);
      try {
        await performShareWithHousehold(
          currentPlan._id,
          householdId,
          currentPlan.entries?.length ?? 0,
        );
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to share");
      } finally {
        shareInFlightRef.current = false;
        setIsSharing(false);
      }
    },
    [currentPlan, isSharing, performShareWithHousehold],
  );

  const handleShare = useCallback(async () => {
    if (!shareHouseholdId) return;
    await runMealPlanShare(shareHouseholdId);
  }, [shareHouseholdId, runMealPlanShare]);

  const handleUnshare = useCallback(async () => {
    if (!currentPlan) return;
    try {
      await unshareMealPlan({ mealPlanId: currentPlan._id });
      setShowUnshareConfirmDialog(false);
      toast.success("Meal plan is private again");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to unshare");
    }
  }, [currentPlan, unshareMealPlan]);

  const handleDeletePlan = useCallback(async () => {
    if (!currentPlan) return;
    try {
      await deleteMealPlan({ mealPlanId: currentPlan._id });
      setShowDeletePlanDialog(false);
      toast.success("Meal plan deleted");
      router.replace(ROUTES.MEAL_PLAN, { scroll: false });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete plan");
    }
  }, [currentPlan, deleteMealPlan, router]);

  const handleFinalisePlan = useCallback(async () => {
    if (!currentPlan) return;
    setIsFinalising(true);
    try {
      await finaliseMealPlan({ mealPlanId: currentPlan._id });
      trackEvent(ANALYTICS_EVENTS.MEAL_PLAN_FINALISED, {
        meal_count: currentPlan.entries?.length ?? 0,
      });
      setShowFinaliseDialog(false);
      toast.success("Plan saved. You can still move meals between days.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save plan");
    } finally {
      setIsFinalising(false);
    }
  }, [currentPlan, finaliseMealPlan]);

  const handleMoveEntryToDay = useCallback(
    async (entryId: Id<"mealPlanEntries">, date: number, order: number) => {
      try {
        await updateEntry({ entryId, date, order });
        toast.success("Meal moved");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to move meal");
      }
    },
    [updateEntry],
  );

  const handlePickerSelect = useCallback(
    async (recipeId: Id<"recipes">) => {
      if (!currentPlan || !pickerState) return;
      try {
        if (pickerState.mode === "add") {
          const date = currentPlan.startDate ?? currentPlan.endDate;
          await addEntry({
            mealPlanId: currentPlan._id,
            date,
            recipeId,
            order: currentPlan.entries?.length ?? 0,
          });
          toast.success("Meal added");
        } else if (pickerState.entry) {
          await updateEntry({
            entryId: pickerState.entry._id,
            recipeId,
          });
          toast.success("Meal changed");
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update meal");
      } finally {
        setPickerState(null);
      }
    },
    [currentPlan, pickerState, addEntry, updateEntry],
  );

  const chalkboardItemsForGenerate = useMemo(() => {
    const personal = personalChalkboard ?? [];
    const byHousehold = householdChalkboards ?? {};
    const list: { id: Id<"chalkboardItems">; text: string; source: string }[] =
      [];
    personal.forEach((item) => {
      list.push({ id: item._id, text: item.text, source: "Personal" });
    });
    Object.entries(byHousehold).forEach(([householdId, items]) => {
      const householdName =
        households?.find((h) => h._id === householdId)?.name ?? "Household";
      items.forEach((item: { _id: Id<"chalkboardItems">; text: string }) => {
        list.push({ id: item._id, text: item.text, source: householdName });
      });
    });
    return list;
  }, [personalChalkboard, householdChalkboards, households]);

  useEffect(() => {
    if (!resolvedPlanId || currentPlan === undefined) return;
    if (currentPlan === null) {
      router.replace(ROUTES.MEAL_PLAN, { scroll: false });
    }
  }, [resolvedPlanId, currentPlan, router]);

  const isPlanListLoading =
    planSummaries === undefined || resolvedPlanId === undefined;
  const isPlanDetailLoading =
    resolvedPlanId !== null &&
    resolvedPlanId !== undefined &&
    currentPlan === undefined;

  if (isPlanListLoading || isPlanDetailLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (planSummaries.length === 0) {
    return (
      <div className="bg-background w-full min-w-0 overflow-x-hidden">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                Your Weekly Plan
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg">
                One click to organize your entire week of healthy eating.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full sm:w-auto sm:items-end">
              {households && households.length > 1 ? (
                <div className="w-full sm:w-64 space-y-1.5">
                  <Label htmlFor="empty-gen-household">Household</Label>
                  <Select
                    value={generateWeekHouseholdId || households[0]?._id || ""}
                    onValueChange={(v) =>
                      setGenerateWeekHouseholdId(v as Id<"households">)
                    }
                  >
                    <SelectTrigger id="empty-gen-household">
                      <SelectValue placeholder="Select household" />
                    </SelectTrigger>
                    <SelectContent>
                      {households.map((h) => (
                        <SelectItem key={h._id} value={h._id}>
                          {h.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full shrink-0 sm:w-auto"
                  onClick={handleBlankWeek}
                  disabled={isGenerating || households === undefined}
                >
                  <CalendarPlus className="size-5 mr-2" />
                  Choose my own meals
                </Button>
                <Button
                  size="lg"
                  className="w-full shrink-0 sm:w-auto"
                  onClick={handleGenerateWeek}
                  disabled={isGenerating || households === undefined}
                >
                  <Sparkles className="size-5 mr-2" />
                  Generate My Week
                </Button>
              </div>
            </div>
          </div>
          <Card className="border-2 border-dashed border-muted-foreground/25 bg-card p-8 sm:p-10 text-center max-w-xl mx-auto">
            <CardContent className="p-0 flex flex-col items-center">
              <div className="size-16 rounded-full border-2 border-primary/30 bg-primary/10 flex items-center justify-center mb-6">
                <Sparkles className="size-8 text-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                Ready to eat better?
              </h2>
              <p className="text-muted-foreground mb-3 max-w-sm mx-auto">
                Our intelligent system creates a balanced, delicious plan for
                you in seconds.
              </p>
              <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                Prefer to pick every meal yourself? Start with seven empty
                days, then fill them in.
              </p>
              {households && households.length > 1 ? (
                <div className="w-full max-w-sm mx-auto mb-4 space-y-1.5 text-left">
                  <Label htmlFor="card-gen-household">Household</Label>
                  <Select
                    value={generateWeekHouseholdId || households[0]?._id || ""}
                    onValueChange={(v) =>
                      setGenerateWeekHouseholdId(v as Id<"households">)
                    }
                  >
                    <SelectTrigger id="card-gen-household">
                      <SelectValue placeholder="Select household" />
                    </SelectTrigger>
                    <SelectContent>
                      {households.map((h) => (
                        <SelectItem key={h._id} value={h._id}>
                          {h.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <div className="flex w-full max-w-sm mx-auto flex-col gap-2 sm:flex-row sm:justify-center">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:flex-1"
                  onClick={handleBlankWeek}
                  disabled={isGenerating || households === undefined}
                >
                  <CalendarPlus className="size-5 mr-2" />
                  Empty week
                </Button>
                <Button
                  size="lg"
                  className="w-full sm:flex-1"
                  onClick={handleGenerateWeek}
                  disabled={isGenerating || households === undefined}
                >
                  Start Planning
                  <ArrowRight className="size-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Defensive: loading guards above usually prevent this; Convex can still return null for a stale ?plan= id before redirect runs.
  if (currentPlan === null || currentPlan === undefined) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const mealCount = currentPlan.entries?.length ?? 0;
  const sharedHousehold = currentPlan.householdId
    ? households?.find((h) => h._id === currentPlan.householdId)
    : null;
  const hasList = listsForPlan && listsForPlan.length > 0;
  const firstListId = listsForPlan?.[0]?._id;

  const isFinalised = currentPlan.isFinalised === true;

  return (
    <div className="bg-background min-w-0 w-full overflow-x-hidden">
      <div className="relative w-full max-w-full min-w-0 px-4 py-6 sm:py-8 sm:container sm:mx-auto box-border pb-20">
        {/* Top bar: always show Generate meal plan so user can generate next week early */}
        {currentPlan.isOwner && (
          <div className="mb-4 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
            {households && households.length > 1 ? (
              <div className="flex flex-col gap-1.5 sm:max-w-xs">
                <Label
                  htmlFor="top-gen-household"
                  className="text-xs text-muted-foreground"
                >
                  Next week · household
                </Label>
                <Select
                  value={generateWeekHouseholdId || households[0]?._id || ""}
                  onValueChange={(v) =>
                    setGenerateWeekHouseholdId(v as Id<"households">)
                  }
                >
                  <SelectTrigger id="top-gen-household" size="sm">
                    <SelectValue placeholder="Household" />
                  </SelectTrigger>
                  <SelectContent>
                    {households.map((h) => (
                      <SelectItem key={h._id} value={h._id}>
                        {h.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBlankWeek}
                disabled={isGenerating || households === undefined}
                className="shrink-0"
              >
                <CalendarPlus className="size-4" />
                Empty week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateWeek}
                disabled={isGenerating || households === undefined}
                className="shrink-0"
              >
                <Sparkles className="size-4" />
                Generate next plan
              </Button>
            </div>
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6 min-w-0">
          <div className="min-w-0 overflow-hidden">
            <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-2 truncate">
              Your Weekly Plan
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base truncate">
              {isFinalised
                ? "Drag meals to change which day they fall on."
                : "Review your week. Lock what you love, swap what you don't."}
            </p>
            {planSummaries.length > 1 ? (
              <div className="mt-3 max-w-md space-y-1.5">
                <Label
                  htmlFor="meal-plan-picker"
                  className="text-xs text-muted-foreground"
                >
                  Switch plan
                </Label>
                <Select
                  value={currentPlan._id}
                  onValueChange={(id) => {
                    if (typeof window !== "undefined") {
                      sessionStorage.setItem(
                        MEAL_PLAN_LAST_VIEWED_STORAGE_KEY,
                        id,
                      );
                    }
                    router.push(ROUTES.mealPlanWithId(id));
                  }}
                >
                  <SelectTrigger
                    id="meal-plan-picker"
                    size="sm"
                    className="w-full sm:w-72"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {planSummaries.map((s) => (
                      <SelectItem key={s._id} value={s._id}>
                        {formatPlanRangeShort(s.startDate, s.endDate)}
                        {s.isFinalised ? " · Saved" : " · Draft"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 items-center min-w-0 shrink-0">
            {hasList && firstListId ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={ROUTES.shoppingListWithId(firstListId)}>
                  <ShoppingCart className="size-4 " />
                  Shopping List
                </Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowGenerateDialog(true)}
                disabled={mealCount === 0}
              >
                <ShoppingCart className="size-4" />
                Shopping List
              </Button>
            )}
            {currentPlan.isOwner && (
              <>
                {!isFinalised && (
                  <div className="hidden sm:flex flex-wrap gap-2">
                    <Button
                      variant="default"
                      onClick={() => setShowFinaliseDialog(true)}
                      disabled={mealCount === 0}
                    >
                      <CheckCircle2 className="size-4" />
                      Save plan
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleRegenerateWeek}
                      disabled={isGenerating}
                    >
                      <Sparkles className="size-4" />
                      Regenerate
                    </Button>
                  </div>
                )}
                {sharedHousehold ? (
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => setShowUnshareConfirmDialog(true)}
                    aria-label="Stop sharing this meal plan with your household"
                  >
                    <UserMinus className="size-4 shrink-0" />
                    <span className="max-w-40 truncate sm:max-w-none">
                      Stop sharing
                    </span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowShareDialog(true)}
                    aria-label="Share this meal plan with a household"
                  >
                    <Users className="size-4 shrink-0" />
                    <span className="max-w-36 truncate sm:max-w-none">
                      Share with household
                    </span>
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Plan options"
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setShowDeletePlanDialog(true)}
                    >
                      <Trash2 className="size-4 mr-2" />
                      Delete meal plan
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>

        <AlertDialog
          open={showDeletePlanDialog}
          onOpenChange={setShowDeletePlanDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete meal plan?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this meal plan and all meals in it.
                You can create a new plan anytime.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  void handleDeletePlan();
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete plan
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={showUnshareConfirmDialog}
          onOpenChange={setShowUnshareConfirmDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Stop sharing this plan?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="grid gap-3 text-sm text-muted-foreground">
                  {sharedHousehold ? (
                    <>
                      <p>
                        People in{" "}
                        <strong className="text-foreground">
                          {sharedHousehold.name}
                        </strong>{" "}
                        will no longer see this meal plan. Shopping lists they
                        could only reach through this plan may disappear from
                        their list until you share again.
                      </p>
                      <p>
                        This turns off the same household access you get when a
                        plan is shared automatically after generating a week.
                        You can use{" "}
                        <strong className="text-foreground">
                          Share with household
                        </strong>{" "}
                        later to share again.
                      </p>
                    </>
                  ) : (
                    <p>Household members will no longer see this meal plan.</p>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  void handleUnshare();
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Stop sharing
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={showFinaliseDialog}
          onOpenChange={setShowFinaliseDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Save this plan?</AlertDialogTitle>
              <AlertDialogDescription>
                Once saved, you can&apos;t add, remove, or swap meals—only move
                them between days. To make bigger changes, you&apos;d need to
                delete this plan and create a new one.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  void handleFinalisePlan();
                }}
                disabled={isFinalising}
              >
                Save plan
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {sharedHousehold && (
          <Card className="mb-6 border-primary/25 bg-primary/5">
            <CardContent className="py-4 px-4 flex gap-3 items-start">
              <div className="mt-0.5 rounded-md bg-primary/15 p-1.5 shrink-0">
                <Home className="size-4 text-primary" />
              </div>
              <div className="min-w-0 space-y-1.5 text-sm">
                <p className="font-medium text-foreground">
                  Shared with{" "}
                  <span className="text-primary">{sharedHousehold.name}</span>
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Everyone in this household can see this plan and shop from
                  it—including new weeks you generate.{" "}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {isFinalised ? (
          <MealPlanDayView
            plan={currentPlan}
            onMoveEntry={handleMoveEntryToDay}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full min-w-0 max-w-full">
            {entriesSorted.map((entry) => (
              <MealPlanCard
                key={entry._id}
                entry={entry}
                isOwner={currentPlan.isOwner ?? false}
                onLockToggle={() => handleLockToggle(entry)}
                onSwitch={() => handleSwitchClick(entry)}
                onRemove={() => handleRemoveEntry(entry._id)}
                onChangeRecipe={
                  currentPlan.isOwner && !isFinalised
                    ? () => setPickerState({ mode: "replace", entry })
                    : undefined
                }
              />
            ))}
            {Array.from({ length: emptySlotsCount }, (_, i) => (
              <EmptySlot
                key={`empty-${i}`}
                onAdd={
                  currentPlan.isOwner && !isFinalised
                    ? () => setPickerState({ mode: "add" })
                    : undefined
                }
              />
            ))}
          </div>
        )}

        <MealPlanRecipePickerModal
          open={pickerState !== null}
          onOpenChange={(open) => {
            if (!open) setPickerState(null);
          }}
          mode={pickerState?.mode ?? "add"}
          replaceEntry={
            pickerState?.mode === "replace" ? pickerState.entry : undefined
          }
          onSelect={handlePickerSelect}
        />

        {/* Generate shopping list dialog */}
        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col p-0">
            <div className="flex-1 overflow-y-auto px-6 pt-6 space-y-4">
              <DialogHeader>
                <DialogTitle>Generate shopping list</DialogTitle>
                <DialogDescription>
                  Create a shopping list from your meal plan ingredients.
                  Optionally include chalkboard items.
                </DialogDescription>
              </DialogHeader>
              {listsForPlan && listsForPlan.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  You have an existing list for this plan:{" "}
                  <Link
                    href={ROUTES.shoppingListWithId(listsForPlan[0]._id)}
                    className="font-medium text-primary underline underline-offset-4"
                    onClick={() => setShowGenerateDialog(false)}
                  >
                    View list
                  </Link>
                </p>
              )}
              {chalkboardItemsForGenerate.length > 0 && (
                <div className="space-y-2 py-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <Label className="shrink-0">Include chalkboard items</Label>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setSelectedChalkboardIds(
                            new Set(
                              chalkboardItemsForGenerate.map((i) => i.id),
                            ),
                          )
                        }
                        disabled={
                          selectedChalkboardIds.size ===
                          chalkboardItemsForGenerate.length
                        }
                      >
                        Add all
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedChalkboardIds(new Set())}
                        disabled={selectedChalkboardIds.size === 0}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-2">
                    {chalkboardItemsForGenerate.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedChalkboardIds.has(item.id)}
                          onChange={(e) => {
                            setSelectedChalkboardIds((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(item.id);
                              else next.delete(item.id);
                              return next;
                            });
                          }}
                        />
                        <span className="text-sm truncate">{item.text}</span>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {item.source}
                        </Badge>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="shrink-0 border-t px-6 py-4">
              <Button
                variant="outline"
                onClick={() => setShowGenerateDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleGenerateList}>Create shopping list</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Share with household dialog */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share with household</DialogTitle>
              <DialogDescription>
                Use this when your plan is private and you want household
                members to see it. If the plan is already shared, use the{" "}
                <span className="font-medium text-foreground">
                  Stop sharing
                </span>{" "}
                button on the plan (not this dialog) to make it private again.
              </DialogDescription>
            </DialogHeader>
            {households && households.length === 1 ? (
              <div className="py-2">
                <p className="text-sm text-muted-foreground mb-4">
                  Share with <strong>{households[0].name}</strong>
                </p>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowShareDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={isSharing}
                    onClick={() => {
                      if (!households[0]) return;
                      void runMealPlanShare(households[0]._id);
                    }}
                  >
                    Share
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <>
                <div className="py-2">
                  <Label>Household</Label>
                  <Select
                    value={shareHouseholdId}
                    onValueChange={(v) =>
                      setShareHouseholdId(v as Id<"households">)
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select household" />
                    </SelectTrigger>
                    <SelectContent>
                      {(households ?? []).map((h) => (
                        <SelectItem key={h._id} value={h._id}>
                          {h.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowShareDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => void handleShare()}
                    disabled={!shareHouseholdId || isSharing}
                  >
                    Share
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {!isFinalised && currentPlan.isOwner && (
          <div
            className={cn(
              "fixed bottom-0 inset-x-0 z-40 border-t bg-background/60 backdrop-blur-md shadow-[0_-8px_32px_rgba(0,0,0,0.08)]",
              "bottom-(--nav-height) py-3 px-4 sm:hidden",
            )}
          >
            <p className="text-xs leading-snug text-muted-foreground mb-3 max-w-prose">
              Save your plan to open recipes from this week. After saving you
              can still move meals between days.
            </p>
            <div className="flex items-stretch justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="min-h-12 flex-1 shrink"
                onClick={handleRegenerateWeek}
                disabled={isGenerating}
              >
                <Sparkles className="size-5 shrink-0" />
                Regenerate
              </Button>
              <Button
                type="button"
                variant="default"
                size="lg"
                className="min-h-12 flex-1 shrink"
                onClick={() => setShowFinaliseDialog(true)}
                disabled={mealCount === 0}
              >
                <CheckCircle2 className="size-5 shrink-0" />
                Save plan
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
