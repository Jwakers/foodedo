"use client";

/**
 * Meal plan recipe picker modal
 *
 * Used when adding a meal to an empty slot or replacing an existing meal in the
 * plan (set-up stage only). Two tabs: "My recipes" (user + household, deduped)
 * and "Discover" (system recipes). User picks one recipe; parent runs addEntry
 * or updateEntry and closes the modal.
 */

import { CATEGORY_COLORS } from "@/app/constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, titleCase } from "@/lib/utils";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import { useQuery } from "convex/react";
import { ChefHat, Clock, Search, Users } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

// -----------------------------------------------------------------------------
// Types (aligned with Convex API return shapes)
// -----------------------------------------------------------------------------

type CurrentPlan = NonNullable<
  FunctionReturnType<typeof api.mealPlans.getCurrentMealPlan>
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
type PickerRecipe = {
  _id: Id<"recipes">;
  title: string;
  description?: string | null;
  image: string | null;
  prepTime: number;
  cookTime?: number | null;
  serves: number;
  category: string;
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
// Helpers: merge and filter (keeps main component readable)
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
        source: "household",
      });
    }
  });
  return Array.from(byId.values());
}

/** Filter recipes by search query (title and description). Empty query = no filter. */
function filterRecipesBySearch(
  recipes: PickerRecipe[],
  searchQuery: string,
): PickerRecipe[] {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return recipes;
  return recipes.filter(
    (r) =>
      r.title.toLowerCase().includes(q) ||
      (r.description ?? "").toLowerCase().includes(q),
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
  const [searchMy, setSearchMy] = useState("");
  const [searchDiscover, setSearchDiscover] = useState("");

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
        source: "discover",
      })),
    [systemRecipes],
  );

  // Apply per-tab search (each tab has its own search state)
  const filteredMy = useMemo(
    () => filterRecipesBySearch(myRecipesNormalized, searchMy),
    [myRecipesNormalized, searchMy],
  );
  const filteredDiscover = useMemo(
    () => filterRecipesBySearch(discoverRecipesNormalized, searchDiscover),
    [discoverRecipesNormalized, searchDiscover],
  );

  const handleSelect = (recipeId: Id<"recipes">) => {
    onSelect(recipeId);
    // Parent closes modal after addEntry/updateEntry (setPickerState(null))
  };

  const title = mode === "add" ? "Choose recipe" : "Replace meal";
  const description =
    mode === "add"
      ? "Add a meal from your recipes or Discover."
      : "Pick a different recipe for this slot.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] max-w-lg flex-col p-0">
        <DialogHeader className="shrink-0 px-6 pt-6">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="my" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="mx-6 mt-2 shrink-0">
            <TabsTrigger value="my">My recipes</TabsTrigger>
            <TabsTrigger value="discover">Discover</TabsTrigger>
          </TabsList>
          {/* My recipes: user + household, with search; show skeleton while loading */}
          <TabsContent value="my" className="mt-0 flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 px-6 py-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchMy}
                  onChange={(e) => setSearchMy(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
              {userRecipes === undefined || householdRecipes === undefined ? (
                <RecipeListSkeleton />
              ) : filteredMy.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {/* No recipes at all vs no search matches */}
                  {myRecipesNormalized.length === 0
                    ? "No recipes yet. Create or import recipes first."
                    : "No recipes match your search."}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredMy.map((recipe) => (
                    <PickerRecipeRow
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
          {/* Discover: system recipes, with search */}
          <TabsContent
            value="discover"
            className="mt-0 flex min-h-0 flex-1 flex-col"
          >
            <div className="shrink-0 px-6 py-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchDiscover}
                  onChange={(e) => setSearchDiscover(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
              {systemRecipes === undefined ? (
                <RecipeListSkeleton />
              ) : filteredDiscover.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {discoverRecipesNormalized.length === 0
                    ? "No Discover recipes available."
                    : "No recipes match your search."}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredDiscover.map((recipe) => (
                    <PickerRecipeRow
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
      </DialogContent>
    </Dialog>
  );
}

/** Single recipe row in the picker list; click to select. Highlights if this recipe is the one currently in the slot (replace mode). */
function PickerRecipeRow({
  recipe,
  onSelect,
  replaceEntryId,
}: {
  recipe: PickerRecipe;
  onSelect: () => void;
  replaceEntryId?: Id<"recipes">;
}) {
  const totalTime = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
  const categoryLabel = titleCase(recipe.category);
  const categoryColor =
    CATEGORY_COLORS[recipe.category as keyof typeof CATEGORY_COLORS] ?? "";
  const isCurrentSlot = replaceEntryId === recipe._id;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isCurrentSlot && "ring-2 ring-primary",
      )}
      aria-label={`Choose ${recipe.title}`}
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">
        {recipe.image ? (
          <Image
            src={recipe.image}
            alt=""
            fill
            sizes="64px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ChefHat className="size-8 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium leading-tight line-clamp-2">
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
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
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
      </div>
    </button>
  );
}

/** Placeholder while recipe lists are loading. */
function RecipeListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
          <div className="size-16 shrink-0 rounded-md bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
