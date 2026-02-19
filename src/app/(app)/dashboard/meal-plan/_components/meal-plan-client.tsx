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
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import {
  ArrowRight,
  CheckCircle2,
  Home,
  MoreVertical,
  ShoppingCart,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptySlot } from "./empty-slot";
import { MealPlanCard } from "./meal-plan-card";
import { MealPlanDayView } from "./meal-plan-day-view";

type CurrentPlan = NonNullable<
  FunctionReturnType<typeof api.mealPlans.getCurrentMealPlan>
>;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function startOfDayMs(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function shuffle<T>(array: T[]): T[] {
  const out = [...array];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function MealPlanClient() {
  const router = useRouter();
  const currentPlan = useQuery(api.mealPlans.getCurrentMealPlan);
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
  const regenerateWeeklyPlan = useMutation(api.mealPlans.regenerateWeeklyPlan);
  const removeEntry = useMutation(api.mealPlans.removeEntry);
  const updateEntry = useMutation(api.mealPlans.updateEntry);
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
  const [showDeletePlanDialog, setShowDeletePlanDialog] = useState(false);
  const [showFinaliseDialog, setShowFinaliseDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFinalising, setIsFinalising] = useState(false);

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
    setIsGenerating(true);
    try {
      await generateWeeklyPlan();
      toast.success("Your week is ready!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate plan");
    } finally {
      setIsGenerating(false);
    }
  }, [generateWeeklyPlan]);

  const handleRegenerateWeek = useCallback(async () => {
    if (!currentPlan) return;
    setIsGenerating(true);
    try {
      await regenerateWeeklyPlan({ previousPlanId: currentPlan._id });
      toast.success("Week regenerated. Locked meals kept.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to regenerate");
    } finally {
      setIsGenerating(false);
    }
  }, [currentPlan, regenerateWeeklyPlan]);

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

  const handleShare = useCallback(async () => {
    if (!currentPlan || !shareHouseholdId) return;
    try {
      await shareMealPlanWithHousehold({
        mealPlanId: currentPlan._id,
        householdId: shareHouseholdId,
      });
      setShowShareDialog(false);
      setShareHouseholdId("");
      toast.success("Meal plan shared with household");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to share");
    }
  }, [currentPlan, shareHouseholdId, shareMealPlanWithHousehold]);

  const handleUnshare = useCallback(async () => {
    if (!currentPlan) return;
    try {
      await unshareMealPlan({ mealPlanId: currentPlan._id });
      toast.success("Meal plan is no longer shared");
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
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete plan");
    }
  }, [currentPlan, deleteMealPlan]);

  const handleFinalisePlan = useCallback(async () => {
    if (!currentPlan) return;
    setIsFinalising(true);
    try {
      await finaliseMealPlan({ mealPlanId: currentPlan._id });
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

  if (currentPlan === undefined) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!currentPlan) {
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
            <Button
              size="lg"
              className="shrink-0"
              onClick={handleGenerateWeek}
              disabled={isGenerating || (poolRecipes?.length ?? 0) === 0}
            >
              <Sparkles className="size-5 mr-2" />
              Generate My Week
            </Button>
          </div>
          <Card className="border-2 border-dashed border-muted-foreground/25 bg-card p-8 sm:p-10 text-center max-w-xl mx-auto">
            <CardContent className="p-0 flex flex-col items-center">
              <div className="size-16 rounded-full border-2 border-primary/30 bg-primary/10 flex items-center justify-center mb-6">
                <Sparkles className="size-8 text-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                Ready to eat better?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Our intelligent system creates a balanced, delicious plan for
                you in seconds.
              </p>
              <Button
                size="lg"
                onClick={handleGenerateWeek}
                disabled={isGenerating || (poolRecipes?.length ?? 0) === 0}
              >
                Start Planning
                <ArrowRight className="size-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
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
      <div className="w-full max-w-full min-w-0 px-4 py-6 sm:py-8 sm:container sm:mx-auto box-border">
        {/* Top bar: always show Generate meal plan so user can generate next week early */}
        {currentPlan.isOwner && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateWeek}
              disabled={isGenerating || (poolRecipes?.length ?? 0) === 0}
            >
              <Sparkles className="size-4" />
              Generate next week
            </Button>
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
                  <>
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
                      disabled={
                        isGenerating || (poolRecipes?.length ?? 0) === 0
                      }
                    >
                      <Sparkles className="size-4" />
                      Regenerate
                    </Button>
                  </>
                )}
                {sharedHousehold ? (
                  <Button variant="outline" onClick={handleUnshare}>
                    <Users className="size-4" />
                    <span className="hidden sm:inline">Stop sharing</span>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowShareDialog(true)}
                  >
                    <Users className="size-4" />
                    <span className="hidden sm:inline">Share</span>
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
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="py-3 px-4 flex items-center gap-2">
              <Home className="size-4 text-primary" />
              <span className="text-sm">
                Shared with <strong>{sharedHousehold.name}</strong>
              </span>
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
              />
            ))}
            {Array.from({ length: emptySlotsCount }, (_, i) => (
              <EmptySlot key={`empty-${i}`} />
            ))}
          </div>
        )}

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
                  <Label>Include chalkboard items</Label>
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
                Household members can view this meal plan and generate their own
                shopping list from it.
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
                    onClick={async () => {
                      if (!currentPlan || !households[0]) return;
                      try {
                        await shareMealPlanWithHousehold({
                          mealPlanId: currentPlan._id,
                          householdId: households[0]._id,
                        });
                        setShowShareDialog(false);
                        toast.success("Meal plan shared with household");
                      } catch (e) {
                        toast.error(
                          e instanceof Error ? e.message : "Failed to share",
                        );
                      }
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
                  <Button onClick={handleShare} disabled={!shareHouseholdId}>
                    Share
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
