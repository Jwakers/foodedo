"use client";

/**
 * Meal plan recipe picker modal
 *
 * Used when adding a meal to an empty slot or replacing an existing meal in the
 * plan (set-up stage only). Three sources: "My recipes" (user + household,
 * deduped), "Discover" (system recipes), and "All recipes" (merged + deduped).
 * User picks one recipe; parent runs addEntry or updateEntry and closes.
 */

import { CATEGORY_COLORS } from "@/app/constants";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  applyRecipeCoreFilters,
  initialRecipeCoreFilterState,
  type RecipeCoreFilterState,
} from "@/components/recipes/recipe-filter-utils";
import { RecipeSourceSwitcher } from "@/components/recipes/recipe-source-switcher";
import {
  TAB_ALL,
  TAB_DISCOVER,
  TAB_MY_RECIPES,
  type RecipeListingTab,
} from "@/components/recipes/recipe-listing-context";
import { RECIPE_QUICK_FILTERS } from "@/components/recipes/quick-filters";
import type { RecipeListItem } from "@/components/recipes/types";
import { cn, titleCase } from "@/lib/utils";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import {
  COMPLEXITY_TIERS,
  PRIMARY_PROTEINS,
  RECIPE_CATEGORIES,
} from "convex/lib/constants";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ChefHat, Clock, Search, SlidersHorizontal, Users, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

// -----------------------------------------------------------------------------
// Types (aligned with Convex API return shapes)
// -----------------------------------------------------------------------------

type CurrentPlan = NonNullable<
  FunctionReturnType<typeof api.mealPlans.getMealPlan>
>;
type UserRecipe = FunctionReturnType<
  typeof api.recipes.getAllUserRecipes
>[number];
type HouseholdRecipe = FunctionReturnType<
  typeof api.households.getAllHouseholdRecipes
>[number];
type SystemRecipe = FunctionReturnType<
  typeof api.recipes.getSystemRecipes
>[number];

/** Normalised recipe for list display; source indicates which tab it came from. */
type PickerRecipe = RecipeListItem & {
  source: "user" | "household" | "discover";
};

type MealPlanRecipePickerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "replace";
  replaceEntry?: CurrentPlan["entries"][number];
  onSelect: (recipeId: Id<"recipes">) => void;
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** Merge user + household recipes into one list; user wins on duplicate ids. */
function mergeUserAndHouseholdRecipes(
  userRecipes: UserRecipe[],
  householdRecipes: HouseholdRecipe[],
): PickerRecipe[] {
  const byId = new Map<Id<"recipes">, PickerRecipe>();
  userRecipes.forEach((r) =>
    byId.set(r._id, {
      _id: r._id,
      title: r.title,
      description: r.description ?? null,
      image: r.image ?? null,
      prepTime: r.prepTime ?? 0,
      cookTime: r.cookTime,
      serves: r.serves ?? 1,
      category: r.category,
      primaryProtein: r.primaryProtein ?? null,
      complexityTier: r.complexityTier ?? null,
      totalTimeMinutes: r.totalTimeMinutes ?? null,
      source: "user",
    }),
  );
  householdRecipes.forEach((r) => {
    if (!byId.has(r._id)) {
      byId.set(r._id, {
        _id: r._id,
        title: r.title,
        description: r.description ?? null,
        image: r.image ?? null,
        prepTime: r.prepTime ?? 0,
        cookTime: r.cookTime,
        serves: r.serves ?? 1,
        category: r.category,
        primaryProtein: r.primaryProtein ?? null,
        complexityTier: r.complexityTier ?? null,
        totalTimeMinutes: r.totalTimeMinutes ?? null,
        source: "household",
      });
    }
  });
  return Array.from(byId.values());
}

function mergeRecipeSources(
  first: PickerRecipe[],
  second: PickerRecipe[],
): PickerRecipe[] {
  const byId = new Map<Id<"recipes">, PickerRecipe>();
  for (const recipe of first) {
    byId.set(recipe._id, recipe);
  }
  for (const recipe of second) {
    if (!byId.has(recipe._id)) {
      byId.set(recipe._id, recipe);
    }
  }
  return Array.from(byId.values());
}

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

// -----------------------------------------------------------------------------
// Main modal component
// -----------------------------------------------------------------------------

export function MealPlanRecipePickerModal({
  open,
  onOpenChange,
  mode,
  replaceEntry,
  onSelect,
}: MealPlanRecipePickerModalProps) {
  const [tab, setTab] = useState<RecipeListingTab>(TAB_MY_RECIPES);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [myFilters, setMyFilters] = useState<RecipeCoreFilterState>(
    initialRecipeCoreFilterState,
  );
  const [discoverFilters, setDiscoverFilters] = useState<RecipeCoreFilterState>(
    initialRecipeCoreFilterState,
  );
  const [allFilters, setAllFilters] = useState<RecipeCoreFilterState>(
    initialRecipeCoreFilterState,
  );

  // Load all recipe sources in parallel
  const userRecipes = useQuery(api.recipes.getAllUserRecipes);
  const householdRecipes = useQuery(api.households.getAllHouseholdRecipes);
  const systemRecipes = useQuery(api.recipes.getSystemRecipes);

  // My recipes: user + household merged and deduped (user takes precedence)
  const myRecipesNormalized = useMemo(
    () =>
      mergeUserAndHouseholdRecipes(userRecipes ?? [], householdRecipes ?? []),
    [userRecipes, householdRecipes],
  );

  // Discover: system recipes in the same shape for the list
  const discoverRecipesNormalized = useMemo(
    (): PickerRecipe[] =>
      (systemRecipes ?? []).map((r: SystemRecipe) => ({
        _id: r._id,
        title: r.title,
        description: r.description ?? null,
        image: r.image ?? null,
        prepTime: r.prepTime ?? 0,
        cookTime: r.cookTime,
        serves: r.serves ?? 1,
        category: r.category,
        primaryProtein: r.primaryProtein ?? null,
        complexityTier: r.complexityTier ?? null,
        totalTimeMinutes: r.totalTimeMinutes ?? null,
        source: "discover",
      })),
    [systemRecipes],
  );
  const allRecipesNormalized = useMemo(
    () => mergeRecipeSources(myRecipesNormalized, discoverRecipesNormalized),
    [myRecipesNormalized, discoverRecipesNormalized],
  );

  // Apply per-tab core filtering
  const filteredMy = useMemo(
    () => applyRecipeCoreFilters(myRecipesNormalized, myFilters),
    [myRecipesNormalized, myFilters],
  );
  const filteredDiscover = useMemo(
    () => applyRecipeCoreFilters(discoverRecipesNormalized, discoverFilters),
    [discoverRecipesNormalized, discoverFilters],
  );
  const filteredAll = useMemo(
    () => applyRecipeCoreFilters(allRecipesNormalized, allFilters),
    [allRecipesNormalized, allFilters],
  );

  const activeFilters =
    tab === TAB_MY_RECIPES
      ? myFilters
      : tab === TAB_DISCOVER
        ? discoverFilters
        : allFilters;
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

  const toggleQuickFilter = (
    key: (typeof RECIPE_QUICK_FILTERS)[number]["key"],
  ) => {
    setActiveFilters((prev) => {
      if (prev.selectedQuickFilters.includes(key)) {
        return {
          ...prev,
          selectedQuickFilters: prev.selectedQuickFilters.filter((k) => k !== key),
        };
      }
      return {
        ...prev,
        selectedQuickFilters: [...prev.selectedQuickFilters, key],
      };
    });
  };

  const handleSelect = (recipeId: Id<"recipes">) => {
    onSelect(recipeId);
    // Parent closes modal after addEntry/updateEntry (setPickerState(null))
  };

  const title = mode === "add" ? "Choose recipe" : "Replace meal";
  const description =
    mode === "add"
      ? "Add a meal from your recipes, Discover, or all sources."
      : "Pick a different recipe for this slot.";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex h-[94dvh] flex-col overflow-hidden p-0">
        <DrawerHeader className="px-4 pt-4 text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as RecipeListingTab)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="mt-1 px-4">
            <RecipeSourceSwitcher
              value={tab}
              onValueChange={setTab}
              compact
            />
          </div>
          <Accordion
            type="single"
            collapsible
            className="border-b px-4"
            value={filtersExpanded ? "filters" : ""}
            onValueChange={(value) => setFiltersExpanded(value === "filters")}
          >
            <AccordionItem value="filters" className="border-b-0">
              <AccordionTrigger className="py-2 text-sm hover:no-underline">
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
              <AccordionContent className="pb-3 pt-1">
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
                      const isActive = activeFilters.selectedQuickFilters.includes(
                        filter.key,
                      );
                      return (
                        <Button
                          key={filter.key}
                          type="button"
                          size="sm"
                          variant={isActive ? "default" : "outline"}
                          className={cn("h-8 rounded-full px-3 text-xs")}
                          aria-pressed={isActive}
                          onClick={() => toggleQuickFilter(filter.key)}
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
                        <SelectItem value="all">All proteins</SelectItem>
                        {PRIMARY_PROTEINS.filter(
                          (protein) => protein !== "none" && protein !== "other",
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
                        <SelectItem value="all">All categories</SelectItem>
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
                          <SelectItem key={option.value} value={option.value}>
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
                        <SelectItem value="all">Any complexity</SelectItem>
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

          {/* My recipes: user + household */}
          <TabsContent value={TAB_MY_RECIPES} className="mt-0 min-h-0 flex-1">
            <div
              data-vaul-no-drag
              className="h-full overflow-y-auto overscroll-contain px-4 pb-6 pt-3"
            >
              {userRecipes === undefined || householdRecipes === undefined ? (
                <RecipeListSkeleton />
              ) : filteredMy.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {myRecipesNormalized.length === 0 && !hasActiveFilters(myFilters)
                    ? "No recipes yet. Create or import recipes first."
                    : "No recipes match your filters."}
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredMy.map((recipe) => (
                    <PickerRecipeCard
                      key={recipe._id}
                      recipe={recipe}
                      onSelect={() => handleSelect(recipe._id)}
                      replaceEntryId={replaceEntry?.recipeId}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Discover recipes */}
          <TabsContent value={TAB_DISCOVER} className="mt-0 min-h-0 flex-1">
            <div
              data-vaul-no-drag
              className="h-full overflow-y-auto overscroll-contain px-4 pb-6 pt-3"
            >
              {systemRecipes === undefined ? (
                <RecipeListSkeleton />
              ) : filteredDiscover.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {discoverRecipesNormalized.length === 0 &&
                  !hasActiveFilters(discoverFilters)
                    ? "No Discover recipes available."
                    : "No recipes match your filters."}
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredDiscover.map((recipe) => (
                    <PickerRecipeCard
                      key={recipe._id}
                      recipe={recipe}
                      onSelect={() => handleSelect(recipe._id)}
                      replaceEntryId={replaceEntry?.recipeId}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value={TAB_ALL} className="mt-0 min-h-0 flex-1">
            <div
              data-vaul-no-drag
              className="h-full overflow-y-auto overscroll-contain px-4 pb-6 pt-3"
            >
              {userRecipes === undefined ||
              householdRecipes === undefined ||
              systemRecipes === undefined ? (
                <RecipeListSkeleton />
              ) : filteredAll.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {allRecipesNormalized.length === 0 && !hasActiveFilters(allFilters)
                    ? "No recipes available yet."
                    : "No recipes match your filters."}
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredAll.map((recipe) => (
                    <PickerRecipeCard
                      key={recipe._id}
                      recipe={recipe}
                      onSelect={() => handleSelect(recipe._id)}
                      replaceEntryId={replaceEntry?.recipeId}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DrawerContent>
    </Drawer>
  );
}

/** Card recipe item in the picker grid; click to select. */
function PickerRecipeCard({
  recipe,
  onSelect,
  replaceEntryId,
}: {
  recipe: PickerRecipe;
  onSelect: () => void;
  replaceEntryId?: Id<"recipes">;
}) {
  const totalTime =
    recipe.totalTimeMinutes ?? (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
  const categoryLabel = titleCase(recipe.category);
  const categoryColor =
    CATEGORY_COLORS[recipe.category as keyof typeof CATEGORY_COLORS] ?? "";
  const isCurrentSlot = replaceEntryId === recipe._id;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-xl border bg-card text-left transition-colors hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "touch-manipulation",
        isCurrentSlot && "border-primary/70 ring-2 ring-primary",
      )}
      aria-label={`Choose ${recipe.title}`}
    >
      <div className="relative aspect-16/10 w-full overflow-hidden bg-muted">
        {recipe.image ? (
          <Image
            src={recipe.image}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover pointer-events-none"
            unoptimized
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ChefHat className="size-10 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex w-full flex-1 flex-col gap-2 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="min-w-0 font-medium leading-tight line-clamp-2">
            {recipe.title}
          </span>
          {recipe.source === "household" && (
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              Household
            </span>
          )}
          {recipe.source === "discover" && (
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              Discover
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span
            className={cn(
              "rounded px-1.5 py-0.5 font-medium",
              categoryColor || "bg-muted",
            )}
          >
            {categoryLabel}
          </span>
          {totalTime > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {totalTime} min
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="size-3" />
            Serves {recipe.serves}
          </span>
        </div>
        {recipe.description ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {recipe.description}
          </p>
        ) : null}
      </div>
    </button>
  );
}

/** Placeholder while recipe lists are loading. */
function RecipeListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border">
          <div className="aspect-16/10 w-full bg-muted animate-pulse" />
          <div className="space-y-2 p-3">
            <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-3 w-full rounded bg-muted animate-pulse" />
            <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
