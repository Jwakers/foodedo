"use client";

import { CATEGORY_COLORS, ROUTES } from "@/app/constants";
import { LimitIndicator } from "@/components/limit-indicator";
import {
  RecipeSourceSwitcher,
  TAB_ALL,
  TAB_DISCOVER,
  TAB_MY_RECIPES,
  type RecipeListingTab,
} from "@/components/recipes";
import { RECIPE_QUICK_FILTERS } from "@/components/recipes/quick-filters";
import {
  applyRecipeCoreFilters,
  initialRecipeCoreFilterState,
  toRecipeListServerFilter,
  type RecipeCoreFilterState,
} from "@/components/recipes/recipe-filter-utils";
import { RecipeLoadMore } from "@/components/recipes/recipe-listing";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import useSubscription from "@/lib/hooks/use-subscription";
import { navigateBackOr } from "@/lib/navigation";
import { isPantryStaple } from "@/lib/pantry-staples";
import { cn, titleCase } from "@/lib/utils";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import {
  COMPLEXITY_TIERS,
  PRIMARY_PROTEINS,
  RECIPE_CATEGORIES,
  TARGET_SERVINGS_MIN,
} from "convex/lib/constants";
import { normaliseNameForGrouping } from "convex/lib/ingredientGrouping";
import { scaleAmountForServings } from "convex/lib/servings";
import { combineAmounts } from "convex/lib/unitConversion";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Clock,
  Home,
  ListChecks,
  Plus,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import ShoppingList from "./shopping-list";

type UnifiedRecipe = FunctionReturnType<
  typeof api.recipes.listRecipesPaginatedUnified
>["page"][number];
type UserRecipe = UnifiedRecipe;
type HouseholdRecipe = FunctionReturnType<
  typeof api.households.getAllHouseholdRecipes
>[number];
type SystemRecipe = UnifiedRecipe;
type SelectionSource = "user" | "household" | "discover";
type Recipe = (UserRecipe | HouseholdRecipe | SystemRecipe) & {
  selectionSource: SelectionSource;
};

const DURATION_OPTIONS = [
  { value: "all", label: "Any duration" },
  { value: "under-30", label: "Under 30 min" },
  { value: "30-60", label: "30-60 min" },
  { value: "60-plus", label: "60+ min" },
] as const;

function hasActiveFilters(filterState: RecipeCoreFilterState): boolean {
  return (
    filterState.searchQuery.trim() !== "" ||
    filterState.selectedCategory !== "all" ||
    filterState.selectedProtein !== "all" ||
    filterState.selectedDuration !== "all" ||
    filterState.selectedComplexity !== "all" ||
    filterState.selectedQuickFilters.length > 0
  );
}

function mergeMyRecipes(
  userRecipes: UserRecipe[],
  householdRecipes: HouseholdRecipe[],
): Recipe[] {
  const byId = new Map<Id<"recipes">, Recipe>();
  userRecipes.forEach((recipe) => {
    byId.set(recipe._id, {
      ...recipe,
      selectionSource: "user",
    });
  });
  householdRecipes.forEach((recipe) => {
    if (!byId.has(recipe._id)) {
      byId.set(recipe._id, {
        ...recipe,
        selectionSource: "household",
      });
    }
  });
  return Array.from(byId.values());
}

function mergeRecipeSources(first: Recipe[], second: Recipe[]): Recipe[] {
  const byId = new Map<Id<"recipes">, Recipe>();
  first.forEach((recipe) => {
    byId.set(recipe._id, recipe);
  });
  second.forEach((recipe) => {
    if (!byId.has(recipe._id)) {
      byId.set(recipe._id, recipe);
    }
  });
  return Array.from(byId.values());
}

export default function ShoppingListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listIdFromUrl = searchParams.get("listId");
  const [tab, setTab] = useState<RecipeListingTab>(TAB_MY_RECIPES);
  const [myFilters, setMyFilters] = useState<RecipeCoreFilterState>(
    initialRecipeCoreFilterState,
  );
  const [discoverFilters, setDiscoverFilters] = useState<RecipeCoreFilterState>(
    initialRecipeCoreFilterState,
  );
  const [allFilters, setAllFilters] = useState<RecipeCoreFilterState>(
    initialRecipeCoreFilterState,
  );
  const userQueryFilter = useMemo(() => {
    const sourceFilters =
      tab === TAB_MY_RECIPES
        ? myFilters
        : tab === TAB_ALL
          ? allFilters
          : initialRecipeCoreFilterState;
    return toRecipeListServerFilter(sourceFilters);
  }, [allFilters, myFilters, tab]);
  const systemQueryFilter = useMemo(() => {
    const sourceFilters =
      tab === TAB_DISCOVER
        ? discoverFilters
        : tab === TAB_ALL
          ? allFilters
          : initialRecipeCoreFilterState;
    return toRecipeListServerFilter(sourceFilters);
  }, [allFilters, discoverFilters, tab]);

  const {
    results: userRecipes,
    status: userRecipesStatus,
    loadMore: loadMoreUserRecipes,
  } = usePaginatedQuery(
    api.recipes.listRecipesPaginatedUnified,
    { scope: "my", filter: userQueryFilter },
    { initialNumItems: 20 },
  );
  const {
    results: systemRecipes,
    status: systemRecipesStatus,
    loadMore: loadMoreSystemRecipes,
  } = usePaginatedQuery(
    api.recipes.listRecipesPaginatedUnified,
    { scope: "discover", filter: systemQueryFilter },
    { initialNumItems: 20 },
  );
  const householdRecipes = useQuery(api.households.getAllHouseholdRecipes);
  const households = useQuery(api.households.getUserHouseholds);
  const accessibleLists = useQuery(
    api.shoppingLists.getAccessibleShoppingLists,
  );
  const listFromUrl = useQuery(
    api.shoppingLists.getShoppingListById,
    listIdFromUrl ? { listId: listIdFromUrl as Id<"shoppingLists"> } : "skip",
  );
  const activeShoppingList = useQuery(api.shoppingLists.getActiveShoppingList);
  const allActiveShoppingLists = useQuery(
    api.shoppingLists.getAllActiveShoppingLists,
  );
  const subscription = useSubscription();

  // Display list: prefer URL list if loaded and accessible, else default (most recent accessible). Return undefined when loading.
  const displayList = useMemo(() => {
    // Loading: list lookup in-flight for this URL list
    if (listIdFromUrl && listFromUrl === undefined) return undefined;
    // Loading: accessible lists not yet loaded (only when no URL list — needed to decide default)
    if (!listIdFromUrl && accessibleLists === undefined) return undefined;
    if (listIdFromUrl && listFromUrl !== undefined) {
      if (listFromUrl) return listFromUrl;
      return null;
    }
    return activeShoppingList ?? null;
  }, [listIdFromUrl, listFromUrl, accessibleLists, activeShoppingList]);

  const [selectedRecipeIds, setSelectedRecipeIds] = useState<
    Set<Id<"recipes">>
  >(new Set());
  /** When true, show recipe selection to create a new list (from list picker) */
  const [showRecipeSelection, setShowRecipeSelection] = useState(false);
  const myRecipes = useMemo(
    () => mergeMyRecipes(userRecipes ?? [], householdRecipes ?? []),
    [userRecipes, householdRecipes],
  );
  const discoverRecipes = useMemo(
    () =>
      (systemRecipes ?? []).map((recipe) => ({
        ...recipe,
        selectionSource: "discover" as const,
      })),
    [systemRecipes],
  );
  const allRecipes = useMemo(
    () => mergeRecipeSources(myRecipes, discoverRecipes),
    [myRecipes, discoverRecipes],
  );
  const targetServings = useMemo(() => {
    const selected = allRecipes.filter((recipe) =>
      selectedRecipeIds.has(recipe._id),
    );
    if (selected.length === 0) {
      return TARGET_SERVINGS_MIN;
    }
    const totalServes = selected.reduce(
      (sum, recipe) => sum + (recipe.serves ?? TARGET_SERVINGS_MIN),
      0,
    );
    return Math.max(
      TARGET_SERVINGS_MIN,
      Math.round(totalServes / selected.length),
    );
  }, [allRecipes, selectedRecipeIds]);

  const selectedRecipes = useMemo(
    () => allRecipes.filter((r) => selectedRecipeIds.has(r._id)) || [],
    [allRecipes, selectedRecipeIds],
  );
  const flatIngredients = useMemo(
    () => buildShoppingListItems(selectedRecipes ?? [], targetServings),
    [selectedRecipes, targetServings],
  );
  const getCanonicalKey = useCallback(
    (item: (typeof flatIngredients)[number]) =>
      (item.name ?? "").trim().toLowerCase(),
    [],
  );
  const { mainItems, pantryItems } = useMemo(() => {
    const main: typeof flatIngredients = [];
    const pantry: typeof flatIngredients = [];
    for (const item of flatIngredients) {
      if (!item.addedFromChalkboard && isPantryStaple(getCanonicalKey(item))) {
        pantry.push(item);
      } else {
        main.push(item);
      }
    }
    return { mainItems: main, pantryItems: pantry };
  }, [flatIngredients, getCanonicalKey]);
  const [showDoneDialog, setShowDoneDialog] = useState(false);
  const isUserRecipesInitialLoading =
    userRecipesStatus === "LoadingFirstPage" && userRecipes.length === 0;
  const isSystemRecipesInitialLoading =
    systemRecipesStatus === "LoadingFirstPage" && systemRecipes.length === 0;
  const canLoadMoreUserRecipes =
    userRecipesStatus === "CanLoadMore" || userRecipesStatus === "LoadingMore";
  const isLoadingMoreUserRecipes = userRecipesStatus === "LoadingMore";
  const canLoadMoreSystemRecipes =
    systemRecipesStatus === "CanLoadMore" ||
    systemRecipesStatus === "LoadingMore";
  const isLoadingMoreSystemRecipes = systemRecipesStatus === "LoadingMore";
  const canLoadMoreActiveTab =
    (tab === TAB_MY_RECIPES && canLoadMoreUserRecipes) ||
    (tab === TAB_DISCOVER && canLoadMoreSystemRecipes) ||
    (tab === TAB_ALL && (canLoadMoreUserRecipes || canLoadMoreSystemRecipes));
  const isLoadingMoreActiveTab =
    tab === TAB_MY_RECIPES
      ? isLoadingMoreUserRecipes
      : tab === TAB_DISCOVER
        ? isLoadingMoreSystemRecipes
        : isLoadingMoreUserRecipes || isLoadingMoreSystemRecipes;
  const [selectedChalkboardItems, setSelectedChalkboardItems] = useState<
    Set<Id<"chalkboardItems">>
  >(new Set());
  /** Household for sharing when creating from recipes; UI defaults the picker when the user has several households. */
  const [recipeListHouseholdId, setRecipeListHouseholdId] = useState<
    Id<"households"> | ""
  >("");

  useEffect(() => {
    if (
      households &&
      households.length > 1 &&
      recipeListHouseholdId === "" &&
      households[0]
    ) {
      setRecipeListHouseholdId(households[0]._id);
    }
  }, [households, recipeListHouseholdId]);

  // Mutations
  const createShoppingList = useMutation(api.shoppingLists.createShoppingList);
  const completeShoppingList = useMutation(
    api.shoppingLists.completeShoppingList,
  );
  const unfinaliseShoppingList = useMutation(
    api.shoppingLists.unfinaliseShoppingList,
  );
  const deleteShoppingList = useMutation(api.shoppingLists.deleteShoppingList);

  const filteredMyRecipes = useMemo(
    () => applyRecipeCoreFilters(myRecipes, myFilters),
    [myRecipes, myFilters],
  );
  const filteredDiscoverRecipes = useMemo(
    () => applyRecipeCoreFilters(discoverRecipes, discoverFilters),
    [discoverRecipes, discoverFilters],
  );
  const filteredAllRecipes = useMemo(
    () => applyRecipeCoreFilters(allRecipes, allFilters),
    [allRecipes, allFilters],
  );
  const activeFilters =
    tab === TAB_MY_RECIPES
      ? myFilters
      : tab === TAB_DISCOVER
        ? discoverFilters
        : allFilters;
  const activeFilteredRecipes =
    tab === TAB_MY_RECIPES
      ? filteredMyRecipes
      : tab === TAB_DISCOVER
        ? filteredDiscoverRecipes
        : filteredAllRecipes;
  const activeBaseRecipes =
    tab === TAB_MY_RECIPES
      ? myRecipes
      : tab === TAB_DISCOVER
        ? discoverRecipes
        : allRecipes;
  const setActiveFilters = (
    updater: (prev: RecipeCoreFilterState) => RecipeCoreFilterState,
  ) => {
    if (tab === TAB_MY_RECIPES) {
      setMyFilters(updater);
      return;
    }
    if (tab === TAB_DISCOVER) {
      setDiscoverFilters(updater);
      return;
    }
    setAllFilters(updater);
  };
  const clearActiveFilters = () => {
    if (tab === TAB_MY_RECIPES) {
      setMyFilters(initialRecipeCoreFilterState);
      return;
    }
    if (tab === TAB_DISCOVER) {
      setDiscoverFilters(initialRecipeCoreFilterState);
      return;
    }
    setAllFilters(initialRecipeCoreFilterState);
  };
  const handleLoadMore = () => {
    if (tab === TAB_MY_RECIPES) {
      if (userRecipesStatus === "CanLoadMore") loadMoreUserRecipes(20);
      return;
    }
    if (tab === TAB_DISCOVER) {
      if (systemRecipesStatus === "CanLoadMore") loadMoreSystemRecipes(20);
      return;
    }
    if (userRecipesStatus === "CanLoadMore") {
      loadMoreUserRecipes(20);
    }
    if (systemRecipesStatus === "CanLoadMore") {
      loadMoreSystemRecipes(20);
    }
  };

  const handleToggleRecipe = (recipeId: Id<"recipes">) => {
    setSelectedRecipeIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(recipeId)) {
        newSet.delete(recipeId);
      } else {
        newSet.add(recipeId);
      }
      return newSet;
    });
  };

  // When creating a list, always include both main items and pantry staples.
  // Users can choose to drop pantry staples later on the shopping list screen.
  const itemsToCreate = useMemo(
    () => [...mainItems, ...pantryItems],
    [mainItems, pantryItems],
  );

  const handleGenerateList = async () => {
    if (accessibleLists === undefined) {
      toast.info("Loading your shopping lists…");
      return;
    }

    try {
      const householdArg =
        households && households.length > 1
          ? {
              householdId:
                (recipeListHouseholdId as Id<"households">) ||
                households[0]!._id,
            }
          : {};

      const { listId } = await createShoppingList({
        items: itemsToCreate.map((item) => ({
          name: item.name,
          amount: item.amountEntries?.[0]?.amount ?? item.amount ?? null,
          unit: item.amountEntries?.[0]?.unit ?? item.unit,
          preparation: item.preparation ?? undefined,
          ingredientId: item.ingredientId,
          amountEntries: item.amountEntries,
          ...(item.recipeIds?.length ? { recipeIds: item.recipeIds } : {}),
        })),
        chalkboardItemIds: Array.from(selectedChalkboardItems),
        targetServings,
        ...householdArg,
      });
      toast.success("Shopping list created!");
      // Replace so Back/Cancel skip the hub/recipe-selection URL and return to the
      // page the user was on before opening shopping list (see navigateBackOr).
      router.replace(ROUTES.shoppingListWithId(listId));
    } catch (error) {
      console.error("Failed to create shopping list:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create shopping list",
      );
    }
  };

  const handleConfirm = async () => {
    if (!displayList) return;

    if (displayList.status === "active") {
      setShowDoneDialog(true);
      return;
    }

    // Draft lists: finalisation (and optional pantry trim) runs inside ShoppingList.
    if (selectedChalkboardItems.size > 0) {
      toast.success(
        `Shopping list confirmed! ${selectedChalkboardItems.size} chalkboard item${
          selectedChalkboardItems.size > 1 ? "s" : ""
        } cleared.`,
      );
    } else {
      toast.success("Shopping list confirmed!");
    }
  };

  const handleDoneShopping = async () => {
    if (!displayList) return;

    try {
      await completeShoppingList({ listId: displayList._id });
      setShowDoneDialog(false);
      setSelectedRecipeIds(new Set());
      setSelectedChalkboardItems(new Set());
      toast.success("Shopping complete! Happy cooking!");
      router.push(ROUTES.SHOPPING_LIST);
    } catch (error) {
      console.error("Failed to complete shopping list:", error);
      toast.error("Failed to complete shopping");
    }
  };

  const handleEditList = async () => {
    if (!displayList) return;

    try {
      await unfinaliseShoppingList({ listId: displayList._id });
    } catch (error) {
      console.error("Failed to edit shopping list:", error);
      toast.error("Failed to edit shopping list");
    }
  };

  const handleBack = async () => {
    if (!displayList) return;

    // If it's a draft list, delete it so user can start fresh
    if (displayList.status === "draft") {
      try {
        await deleteShoppingList({ listId: displayList._id });
        toast.success("Shopping list cancelled");
      } catch (error) {
        console.error("Failed to delete shopping list:", error);
        toast.error("Failed to cancel shopping list");
      }
    }

    navigateBackOr(router, ROUTES.SHOPPING_LIST);
    setSelectedRecipeIds(new Set());
    setSelectedChalkboardItems(new Set());
  };

  // Only auto-show list view when we have listId in URL (deep link to a list)
  useEffect(() => {
    if (listIdFromUrl && listFromUrl === null) {
      router.replace(ROUTES.SHOPPING_LIST);
      return;
    }
    if (listIdFromUrl && displayList) {
      setSelectedChalkboardItems(
        displayList.chalkboardItemIds.length > 0
          ? new Set(displayList.chalkboardItemIds)
          : new Set(),
      );
    }
  }, [displayList, listIdFromUrl, listFromUrl, router]);

  const isLoading = listIdFromUrl
    ? listFromUrl === undefined
    : accessibleLists === undefined;
  const showListView = Boolean(listIdFromUrl && displayList);
  const showListPicker =
    !listIdFromUrl &&
    accessibleLists !== undefined &&
    accessibleLists.length >= 1 &&
    !showRecipeSelection;

  return (
    <>
      <div className="bg-background">
        <div className="container mx-auto px-4 py-8">
          {isLoading ? (
            <LoadingState />
          ) : showListView && displayList ? (
            /* Shopping List View (specific list from URL) */
            <div className="space-y-4">
              {accessibleLists && accessibleLists.length > 1 && (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-muted-foreground shrink-0">
                    List:
                  </label>
                  <Select
                    value={displayList._id}
                    onValueChange={(id) =>
                      router.push(ROUTES.shoppingListWithId(id))
                    }
                  >
                    <SelectTrigger className="w-[220px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {accessibleLists.map((list) => (
                        <SelectItem key={list._id} value={list._id}>
                          {list.status === "draft" ? "Draft" : "Active"} ·{" "}
                          {new Date(list._creationTime).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <ShoppingList
                shoppingList={displayList}
                sharingHouseholds={households ?? []}
                onConfirm={handleConfirm}
                onDone={() => setShowDoneDialog(true)}
                onBack={handleBack}
                onEdit={handleEditList}
                setSelectedChalkboardItems={setSelectedChalkboardItems}
              />
            </div>
          ) : showListPicker ? (
            /* List Picker: choose a list or create new */
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-2">
                    Your shopping lists
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Open a list or create a new one from your recipes
                  </p>
                </div>
                <LimitIndicator
                  current={allActiveShoppingLists?.length ?? 0}
                  max={subscription?.maxActiveShoppingLists ?? 0}
                  label="your active lists"
                />
              </div>
              <div className="grid gap-3 mb-8">
                {accessibleLists?.map((list) => (
                  <Link
                    key={list._id}
                    href={ROUTES.shoppingListWithId(list._id)}
                    className="block"
                  >
                    <Card className="transition-colors hover:bg-muted/50">
                      <CardContent className="flex flex-row items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <ListChecks className="size-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {list.status === "draft" ? "Draft" : "Active"}{" "}
                              list
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(list._creationTime).toLocaleDateString(
                                undefined,
                                {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                  year:
                                    new Date(
                                      list._creationTime,
                                    ).getFullYear() !== new Date().getFullYear()
                                      ? "numeric"
                                      : undefined,
                                },
                              )}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="size-5 text-muted-foreground shrink-0" />
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              <Button
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => setShowRecipeSelection(true)}
              >
                <Plus className="size-5 mr-2" />
                Create new shopping list
              </Button>
            </div>
          ) : (
            /* Recipe Selection View (no lists yet, or "Create new" from picker) */
            <>
              <div className="mb-8">
                {showRecipeSelection && (accessibleLists?.length ?? 0) >= 1 && (
                  <Button
                    variant="ghost"
                    className="mb-4 -ml-2"
                    onClick={() => setShowRecipeSelection(false)}
                  >
                    <ChevronLeft className="size-4 mr-1" />
                    Back to my lists
                  </Button>
                )}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-4xl font-bold text-foreground mb-2">
                      Create Shopping List
                    </h1>
                    <p className="text-muted-foreground text-lg">
                      Select recipes to generate your shopping list
                    </p>
                  </div>
                  <LimitIndicator
                    current={allActiveShoppingLists?.length ?? 0}
                    max={subscription?.maxActiveShoppingLists ?? 0}
                    label="your active lists"
                  />
                </div>

                {/* Info Banner */}
                <Card className="bg-primary/5 border-primary/20 mb-6">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="size-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm mb-1">
                          Smart Ingredient Combining
                        </p>
                        <p className="text-sm text-muted-foreground">
                          When you select multiple recipes, ingredients that
                          appear across different recipes will be automatically
                          combined and totaled. For example, if two recipes both
                          require onions, you&apos;ll see a single combined
                          amount on your shopping list.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <RecipeSourceSwitcher
                    value={tab}
                    onValueChange={setTab}
                    compact
                  />

                  <Accordion type="single" collapsible>
                    <AccordionItem
                      value="filters"
                      className="rounded-xl border px-4"
                    >
                      <AccordionTrigger className="py-3 text-sm hover:no-underline">
                        <span className="inline-flex items-center gap-2">
                          <SlidersHorizontal className="size-4 text-muted-foreground" />
                          Search and filters
                          {hasActiveFilters(activeFilters) ? (
                            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                              Active
                            </span>
                          ) : null}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 pt-1">
                        <div className="space-y-3">
                          <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              placeholder="Search by title or description"
                              value={activeFilters.searchQuery}
                              onChange={(e) =>
                                setActiveFilters((prev) => ({
                                  ...prev,
                                  searchQuery: e.target.value,
                                }))
                              }
                              className="pl-9"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <SlidersHorizontal className="size-3.5" />
                              Core filters
                            </div>
                            {hasActiveFilters(activeFilters) && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                onClick={clearActiveFilters}
                              >
                                <X className="size-3.5" />
                                Clear
                              </Button>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {RECIPE_QUICK_FILTERS.map((filter) => {
                              const isActive =
                                activeFilters.selectedQuickFilters.includes(
                                  filter.key,
                                );
                              return (
                                <Button
                                  key={filter.key}
                                  type="button"
                                  size="sm"
                                  variant={isActive ? "default" : "outline"}
                                  className="h-8 rounded-full px-3 text-xs"
                                  aria-pressed={isActive}
                                  onClick={() =>
                                    setActiveFilters((prev) => {
                                      if (
                                        prev.selectedQuickFilters.includes(
                                          filter.key,
                                        )
                                      ) {
                                        return {
                                          ...prev,
                                          selectedQuickFilters:
                                            prev.selectedQuickFilters.filter(
                                              (key) => key !== filter.key,
                                            ),
                                        };
                                      }
                                      return {
                                        ...prev,
                                        selectedQuickFilters: [
                                          ...prev.selectedQuickFilters,
                                          filter.key,
                                        ],
                                      };
                                    })
                                  }
                                >
                                  {filter.label}
                                </Button>
                              );
                            })}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Select
                              value={activeFilters.selectedProtein}
                              onValueChange={(value) =>
                                setActiveFilters((prev) => ({
                                  ...prev,
                                  selectedProtein: value,
                                }))
                              }
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Protein" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">
                                  All proteins
                                </SelectItem>
                                {PRIMARY_PROTEINS.filter(
                                  (protein) =>
                                    protein !== "none" && protein !== "other",
                                ).map((protein) => (
                                  <SelectItem key={protein} value={protein}>
                                    {titleCase(protein)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={activeFilters.selectedCategory}
                              onValueChange={(value) =>
                                setActiveFilters((prev) => ({
                                  ...prev,
                                  selectedCategory: value,
                                }))
                              }
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">
                                  All categories
                                </SelectItem>
                                {RECIPE_CATEGORIES.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {titleCase(category)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={activeFilters.selectedDuration}
                              onValueChange={(value) =>
                                setActiveFilters((prev) => ({
                                  ...prev,
                                  selectedDuration: value,
                                }))
                              }
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Duration" />
                              </SelectTrigger>
                              <SelectContent>
                                {DURATION_OPTIONS.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={activeFilters.selectedComplexity}
                              onValueChange={(value) =>
                                setActiveFilters((prev) => ({
                                  ...prev,
                                  selectedComplexity: value,
                                }))
                              }
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Complexity" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">
                                  Any complexity
                                </SelectItem>
                                {COMPLEXITY_TIERS.map((tier) => (
                                  <SelectItem key={tier} value={tier}>
                                    {titleCase(tier)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                {/* Selected Recipes Summary */}
                <SelectedRecipesList recipes={selectedRecipes} />
              </div>

              {/* Recipe List */}
              {(tab === TAB_MY_RECIPES &&
                (isUserRecipesInitialLoading ||
                  householdRecipes === undefined)) ||
              (tab === TAB_DISCOVER && isSystemRecipesInitialLoading) ||
              (tab === TAB_ALL &&
                (isUserRecipesInitialLoading ||
                  isSystemRecipesInitialLoading ||
                  householdRecipes === undefined)) ? (
                <LoadingState />
              ) : activeFilteredRecipes.length === 0 ? (
                <div className="text-center py-16">
                  <div className="size-24 bg-muted rounded-full flex items-center justify-center mb-6 mx-auto">
                    <ChefHat className="size-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {activeBaseRecipes.length === 0
                      ? "No recipes yet"
                      : "No recipes match your filters"}
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {activeBaseRecipes.length === 0 ? (
                      <>
                        Start by creating some recipes, then come back here to
                        generate your shopping list.
                      </>
                    ) : (
                      <>Try adjusting your filters to find recipes.</>
                    )}
                  </p>
                  {activeBaseRecipes.length === 0 && (
                    <Button asChild size="lg">
                      <Link href={ROUTES.MY_RECIPES}>Go to My Recipes</Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {activeFilteredRecipes.map((recipe) => (
                    <RecipeSelectionCard
                      key={recipe._id}
                      recipe={recipe}
                      isSelected={selectedRecipeIds.has(recipe._id)}
                      onToggle={handleToggleRecipe}
                    />
                  ))}
                </div>
              )}
              <RecipeLoadMore
                canLoadMore={canLoadMoreActiveTab}
                loadingMore={isLoadingMoreActiveTab}
                onLoadMore={handleLoadMore}
                className="mt-6 mb-20"
              />

              {/* Generate Button */}
              {selectedRecipeIds.size > 0 && (
                <div className="sticky bottom-nav z-10 mt-8 space-y-3 pt-2 pb-1">
                  {households && households.length > 1 ? (
                    <div className="space-y-2">
                      <Label htmlFor="recipe-list-household">
                        Share new list with household
                      </Label>
                      <Select
                        value={
                          recipeListHouseholdId || households[0]?._id || ""
                        }
                        onValueChange={(v) =>
                          setRecipeListHouseholdId(v as Id<"households">)
                        }
                      >
                        <SelectTrigger
                          id="recipe-list-household"
                          className="w-full"
                        >
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
                  <Button
                    size="lg"
                    className="w-full shadow-xl"
                    onClick={handleGenerateList}
                    disabled={households === undefined}
                  >
                    <ShoppingCart className="size-5 mr-2" />
                    Create Shopping List ({selectedRecipeIds.size}{" "}
                    {selectedRecipeIds.size === 1 ? "recipe" : "recipes"}) ·{" "}
                    {itemsToCreate.length} items
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <AlertDialog open={showDoneDialog} onOpenChange={setShowDoneDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Shopping?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your shopping list and return you to the recipe
              selection. Are you sure you&apos;re done shopping?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDoneShopping}>
              Yes, I&apos;m Done
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function RecipeSelectionCard({
  recipe,
  isSelected,
  onToggle,
}: {
  recipe: Recipe;
  isSelected: boolean;
  onToggle: (recipeId: Id<"recipes">) => void;
}) {
  const totalTime =
    recipe.totalTimeMinutes ?? (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
  const categoryLabel = titleCase(recipe.category);
  const categoryColor =
    CATEGORY_COLORS[recipe.category as keyof typeof CATEGORY_COLORS] ||
    CATEGORY_COLORS.main;
  const isHouseholdRecipe =
    "householdId" in recipe && recipe.householdId !== null;
  const isDiscoverRecipe = recipe.selectionSource === "discover";

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-lg pt-0 cursor-pointer",
        isSelected && "ring-2 ring-primary shadow-xl border-primary",
      )}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={() => onToggle(recipe._id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle(recipe._id);
        }
      }}
    >
      <div className="relative aspect-16/10 w-full overflow-hidden bg-muted">
        {recipe.image ? (
          <Image
            src={recipe.image}
            alt={recipe.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ChefHat className="size-10 text-muted-foreground" />
          </div>
        )}
        {isSelected && (
          <div className="absolute right-2 top-2 rounded-full bg-primary text-primary-foreground p-1 shadow">
            <Check className="size-4" />
          </div>
        )}
      </div>

      <CardContent className="p-3">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h3 className="line-clamp-2 font-semibold leading-tight group-hover:text-primary transition-colors">
            {recipe.title}
          </h3>
          {isHouseholdRecipe && (
            <Badge variant="outline" className="shrink-0">
              <Home className="size-3 mr-1" />
              Household
            </Badge>
          )}
          {isDiscoverRecipe && (
            <Badge variant="outline" className="shrink-0">
              Discover
            </Badge>
          )}
        </div>
        <div className="mb-2 flex items-center justify-between">
          <Badge
            variant="secondary"
            className={cn(categoryColor, "border-0 shrink-0")}
          >
            {categoryLabel}
          </Badge>
        </div>
        {recipe.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground mb-2">
            {recipe.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {totalTime > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {totalTime} min
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            Serves {recipe.serves}
          </span>
          <span className="flex items-center gap-1">
            <ListChecks className="size-3.5 text-primary" />
            {(recipe.ingredients ?? []).length} ingredients
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={index} className="p-4">
          <div className="flex gap-4">
            <Skeleton className="size-5 rounded" />
            <Skeleton className="h-20 w-20 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function SelectedRecipesList({ recipes }: { recipes: Recipe[] }) {
  if (recipes.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="size-5 text-primary" />
        <h3 className="font-semibold">Selected Recipes ({recipes.length})</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {recipes.map((recipe) => (
          <Badge key={recipe._id} variant="secondary" className="px-3 py-1">
            {recipe.title}
          </Badge>
        ))}
      </div>
    </div>
  );
}

type RecipeIngredient = NonNullable<Recipe["ingredients"]>[number];

function getAggregationKey(ingredient: RecipeIngredient): string {
  if (ingredient?.ingredientId) {
    return ingredient.ingredientId;
  }
  return normaliseNameForGrouping(ingredient?.name ?? "") || "unnamed";
}

type AmountEntry = { amount: number | string | null; unit?: string };

const buildShoppingListItems = (
  recipes: Recipe[],
  targetServings: number,
): Array<{
  name: string;
  unit?: string;
  preparation?: string | null;
  amount: number | string | null;
  ingredientId?: Id<"ingredients">;
  addedFromChalkboard?: boolean;
  amountEntries: AmountEntry[];
  recipeIds: Id<"recipes">[];
}> => {
  const combined = new Map<
    string,
    {
      name: string;
      unit?: string;
      preparation?: string | null;
      amount: number | string | null;
      ingredientId?: Id<"ingredients">;
      amountEntries: AmountEntry[];
      recipeIds: Set<Id<"recipes">>;
    }
  >();

  recipes.forEach((recipe) => {
    const servingScale =
      recipe.serves && recipe.serves > 0 ? targetServings / recipe.serves : 1;
    recipe.ingredients?.forEach((ingredient) => {
      if (!ingredient?.name) return;

      const key = getAggregationKey(ingredient);
      const storedAmount = scaleAmountForServings(
        ingredient.amount,
        servingScale,
        { ingredientName: ingredient.name, unit: ingredient.unit },
      );
      const hasAmount = storedAmount != null;
      const hasUnit = Boolean(ingredient.unit?.trim());
      const entry: AmountEntry = {
        amount: storedAmount,
        unit: ingredient.unit,
      };
      const existing = combined.get(key);
      if (!existing) {
        combined.set(key, {
          name: ingredient.name,
          unit: ingredient.unit,
          preparation: ingredient.preparation,
          amount: storedAmount,
          ingredientId: ingredient.ingredientId,
          amountEntries: hasAmount || hasUnit ? [entry] : [],
          recipeIds: new Set([recipe._id]),
        });
        return;
      }
      existing.recipeIds.add(recipe._id);
      if (hasAmount || hasUnit) {
        const result = combineAmounts(
          existing.amount,
          existing.unit,
          storedAmount,
          ingredient.unit,
        );
        const merged =
          result.amount != null &&
          (typeof result.amount !== "string" || !result.amount.includes(" + "));
        if (merged) {
          existing.amount = result.amount;
          existing.unit = result.unit;
          existing.amountEntries = [
            { amount: result.amount, unit: result.unit },
          ];
        } else {
          existing.amountEntries.push(entry);
          existing.amount = result.amount;
          existing.unit = result.unit;
        }
      }
    });
  });

  return Array.from(combined.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item) => ({
      name: item.name,
      amount: item.amount,
      unit: item.unit,
      preparation: item.preparation,
      ingredientId: item.ingredientId,
      amountEntries: item.amountEntries,
      recipeIds: Array.from(item.recipeIds),
    }));
};
