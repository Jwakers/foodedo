"use client";

import { CATEGORY_COLORS, ROUTES } from "@/app/constants";
import { LimitIndicator } from "@/components/limit-indicator";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import useSubscription from "@/lib/hooks/use-subscription";
import { normaliseNameForGrouping } from "@/lib/ingredient-grouping";
import { isPantryStaple } from "@/lib/pantry-staples";
import { cn, titleCase } from "@/lib/utils";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
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
  Package,
  Plus,
  Search,
  ShoppingCart,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import ShoppingList from "./shopping-list";

type UserRecipe = FunctionReturnType<
  typeof api.recipes.getAllUserRecipes
>[number];
type HouseholdRecipe = FunctionReturnType<
  typeof api.households.getAllHouseholdRecipes
>[number];
type Recipe = UserRecipe | HouseholdRecipe;

export default function ShoppingListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listIdFromUrl = searchParams.get("listId");

  const userRecipes = useQuery(api.recipes.getAllUserRecipes);
  const householdRecipes = useQuery(api.households.getAllHouseholdRecipes);
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

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<
    Set<Id<"recipes">>
  >(new Set());
  /** When true, show recipe selection to create a new list (from list picker) */
  const [showRecipeSelection, setShowRecipeSelection] = useState(false);

  // Combine user and household recipes into one list
  const allRecipes = useMemo(() => {
    const user = userRecipes || [];
    const household = householdRecipes || [];
    return [...user, ...household];
  }, [userRecipes, householdRecipes]);

  const selectedRecipes = useMemo(
    () => allRecipes.filter((r) => selectedRecipeIds.has(r._id)) || [],
    [allRecipes, selectedRecipeIds],
  );
  const flatIngredients = useMemo(
    () => buildShoppingListItems(selectedRecipes ?? []),
    [selectedRecipes],
  );
  const { mainItems, pantryItems } = useMemo(() => {
    const main: typeof flatIngredients = [];
    const pantry: typeof flatIngredients = [];
    for (const item of flatIngredients) {
      if (isPantryStaple(item.name)) {
        pantry.push(item);
      } else {
        main.push(item);
      }
    }
    return { mainItems: main, pantryItems: pantry };
  }, [flatIngredients]);
  const [selectedPantryKeys, setSelectedPantryKeys] = useState<Set<string>>(
    new Set(),
  );
  useEffect(() => {
    setSelectedPantryKeys((prev) => {
      const validKeys = new Set(pantryItems.map((item) => getItemKey(item)));
      const next = new Set([...prev].filter((k) => validKeys.has(k)));
      if (next.size !== prev.size) return next;
      if ([...next].some((k) => !prev.has(k))) return next;
      if ([...prev].some((k) => !next.has(k))) return next;
      return prev;
    });
  }, [pantryItems]);
  const [showDoneDialog, setShowDoneDialog] = useState(false);
  const [selectedChalkboardItems, setSelectedChalkboardItems] = useState<
    Set<Id<"chalkboardItems">>
  >(new Set());

  // Mutations
  const createShoppingList = useMutation(api.shoppingLists.createShoppingList);
  const finaliseShoppingList = useMutation(
    api.shoppingLists.finaliseShoppingList,
  );
  const completeShoppingList = useMutation(
    api.shoppingLists.completeShoppingList,
  );
  const unfinaliseShoppingList = useMutation(
    api.shoppingLists.unfinaliseShoppingList,
  );
  const deleteShoppingList = useMutation(api.shoppingLists.deleteShoppingList);

  // Filter recipes based on search
  const filteredRecipes = useMemo(
    () =>
      allRecipes.filter((recipe) => {
        const matchesSearch =
          recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          recipe.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
      }),
    [allRecipes, searchQuery],
  );

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

  const itemsToCreate = useMemo(() => {
    const items = [...mainItems];
    for (const item of pantryItems) {
      const key = getItemKey(item);
      if (selectedPantryKeys.has(key)) items.push(item);
    }
    return items;
  }, [mainItems, pantryItems, selectedPantryKeys]);

  const handleGenerateList = async () => {
    if (accessibleLists === undefined) {
      toast.info("Loading your shopping lists…");
      return;
    }

    try {
      const { listId } = await createShoppingList({
        items: itemsToCreate.map((item) => ({
          name: item.name,
          amount: item.amountEntries?.[0]?.amount ?? item.amount ?? null,
          unit: item.amountEntries?.[0]?.unit ?? item.unit,
          preparation: item.preparation,
          ingredientId: item.ingredientId,
          amountEntries: item.amountEntries,
        })),
        chalkboardItemIds: Array.from(selectedChalkboardItems),
      });
      toast.success("Shopping list created!");
      router.push(ROUTES.shoppingListWithId(listId));
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

    // Finalise the shopping list (this will delete chalkboard items)
    try {
      await finaliseShoppingList({ listId: displayList._id });

      if (selectedChalkboardItems.size > 0) {
        toast.success(
          `Shopping list confirmed! ${selectedChalkboardItems.size} chalkboard item${
            selectedChalkboardItems.size > 1 ? "s" : ""
          } cleared.`,
        );
      } else {
        toast.success("Shopping list confirmed!");
      }
    } catch (error) {
      console.error("Failed to finalise shopping list:", error);
      toast.error("Failed to confirm shopping list");
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

    router.push(ROUTES.SHOPPING_LIST);
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
                  label="active lists"
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
                    label="active lists"
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

                {/* Search and Actions */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search recipes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Selected Recipes Summary */}
                <SelectedRecipesList recipes={selectedRecipes} />
              </div>

              {/* Recipe List */}
              {userRecipes === undefined || householdRecipes === undefined ? (
                <LoadingState />
              ) : filteredRecipes.length === 0 ? (
                <div className="text-center py-16">
                  <div className="size-24 bg-muted rounded-full flex items-center justify-center mb-6 mx-auto">
                    <ChefHat className="size-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {allRecipes.length === 0
                      ? "No recipes yet"
                      : "No recipes match your search"}
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {allRecipes.length === 0 ? (
                      <>
                        Start by creating some recipes, then come back here to
                        generate your shopping list.
                      </>
                    ) : (
                      <>Try adjusting your search terms to find recipes.</>
                    )}
                  </p>
                  {allRecipes.length === 0 && (
                    <Button asChild size="lg">
                      <Link href={ROUTES.MY_RECIPES}>Go to My Recipes</Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRecipes.map((recipe) => (
                    <RecipeSelectionCard
                      key={recipe._id}
                      recipe={recipe}
                      isSelected={selectedRecipeIds.has(recipe._id)}
                      onToggle={handleToggleRecipe}
                    />
                  ))}
                </div>
              )}

              {/* Pantry staples section */}
              {selectedRecipeIds.size > 0 && pantryItems.length > 0 && (
                <Card className="mt-8 border-dashed">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <Package className="size-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold mb-1">
                          Do you want to include these pantry staples?
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          These are commonly kept on hand. Leave unchecked if
                          you already have them.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {pantryItems.map((item) => {
                        const key = getItemKey(item);
                        const checked = selectedPantryKeys.has(key);
                        return (
                          <label
                            key={key}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors",
                              checked
                                ? "bg-primary/10 border-primary/30"
                                : "hover:bg-muted/50 border-border",
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(c) => {
                                setSelectedPantryKeys((prev) => {
                                  const next = new Set(prev);
                                  if (c) next.add(key);
                                  else next.delete(key);
                                  return next;
                                });
                              }}
                            />
                            <span className="text-sm font-medium">
                              {item.name}
                              {item.amountEntries &&
                                item.amountEntries.length > 0 && (
                                  <span className="text-muted-foreground font-normal ml-1">
                                    (
                                    {item.amountEntries
                                      .map((e) =>
                                        `${e.amount ?? ""} ${e.unit ?? ""}`.trim(),
                                      )
                                      .filter(Boolean)
                                      .join(", ")}
                                    )
                                  </span>
                                )}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Generate Button */}
              {selectedRecipeIds.size > 0 && (
                <div className="sticky bottom-nav z-10 mt-8 bg-background pt-2 pb-1">
                  <Button
                    size="lg"
                    className="w-full shadow-lg"
                    onClick={handleGenerateList}
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
  const totalTime = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
  const categoryLabel = titleCase(recipe.category);
  const categoryColor =
    CATEGORY_COLORS[recipe.category as keyof typeof CATEGORY_COLORS] ||
    CATEGORY_COLORS.main;
  const ingredientCount = recipe.ingredients?.length || 0;
  const isHouseholdRecipe =
    "householdId" in recipe && recipe.householdId !== null;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-lg",
        isSelected && "ring-2 ring-primary shadow-xl",
      )}
    >
      <div className="flex flex-col">
        {/* Main content area - clickable for selection */}
        <div
          className="flex gap-4 p-4 cursor-pointer"
          onClick={() => onToggle(recipe._id)}
        >
          {/* Recipe Image */}
          <div
            className={cn(
              "relative size-24 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-primary/20 to-primary/5 transition-all duration-300",
              isSelected && "ring-2 ring-primary/50",
            )}
          >
            {recipe.image && (
              <Image
                src={recipe.image}
                alt={recipe.title}
                fill
                sizes="96px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                unoptimized
              />
            )}
            {!recipe.image && (
              <div className="flex items-center justify-center h-full w-full">
                <ChefHat className="size-10 text-muted-foreground" />
              </div>
            )}
            {isSelected && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <div className="bg-primary text-primary-foreground rounded-full p-1">
                  <Check className="size-4" />
                </div>
              </div>
            )}
          </div>

          {/* Recipe Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                    {recipe.title}
                  </h3>
                  {isHouseholdRecipe && (
                    <Badge variant="outline" className="shrink-0">
                      <Home className="h-3 w-3 mr-1" />
                      Household
                    </Badge>
                  )}
                </div>
              </div>
              <Badge
                variant="secondary"
                className={cn(categoryColor, "border-0 shrink-0")}
              >
                {categoryLabel}
              </Badge>
            </div>

            {recipe.description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                {recipe.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="size-4" />
                <span className="font-medium">{totalTime}min</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="size-4" />
                <span className="font-medium">{recipe.serves}</span>
              </div>
              <div className="flex items-center gap-1">
                <ListChecks className="size-4 text-primary" />
                <span className="font-medium text-primary">
                  {ingredientCount} ingredients
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ingredients preview section */}
        <Accordion type="single" collapsible className="border-t">
          <AccordionItem value="ingredients" className="border-0">
            <AccordionTrigger
              className="px-4 py-3 text-xs font-medium hover:no-underline hover:bg-muted/50 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Preview Ingredients
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0">
              <div className="space-y-1.5 bg-muted/30 p-3 rounded-md">
                {recipe.ingredients && recipe.ingredients.length > 0 ? (
                  recipe.ingredients.map((ingredient, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                      {ingredient.amount !== undefined && (
                        <span className="font-medium">{ingredient.amount}</span>
                      )}
                      {ingredient.unit && (
                        <span className="text-muted-foreground">
                          {ingredient.unit}
                        </span>
                      )}
                      <span>{ingredient.name}</span>
                      {ingredient.preparation && (
                        <span className="text-muted-foreground text-xs">
                          ({ingredient.preparation})
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No ingredients listed
                  </p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
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

function getItemKey(item: {
  name: string;
  ingredientId?: Id<"ingredients">;
}): string {
  return (
    item.ingredientId ?? (normaliseNameForGrouping(item.name) || "unnamed")
  );
}

type AmountEntry = { amount: number | string | null; unit?: string };

const buildShoppingListItems = (
  recipes: Recipe[],
): Array<{
  name: string;
  unit?: string;
  preparation?: string;
  amount: number | string | null;
  ingredientId?: Id<"ingredients">;
  amountEntries: AmountEntry[];
}> => {
  const combined = new Map<
    string,
    {
      name: string;
      unit?: string;
      preparation?: string;
      amount: number | string | null;
      ingredientId?: Id<"ingredients">;
      amountEntries: AmountEntry[];
    }
  >();

  recipes.forEach((recipe) => {
    recipe.ingredients?.forEach((ingredient) => {
      if (!ingredient?.name) return;

      const key = getAggregationKey(ingredient);
      const rawAmount = ingredient.amount;
      let storedAmount: number | string | null = null;
      if (rawAmount === undefined || rawAmount === null) {
        storedAmount = null;
      } else if (typeof rawAmount === "number") {
        storedAmount = Number.isFinite(rawAmount) ? rawAmount : null;
      } else {
        const str = String(rawAmount).trim();
        if (str === "") {
          storedAmount = null;
        } else {
          const num = Number(str);
          storedAmount = Number.isFinite(num) ? num : str;
        }
      }
      const hasAmount = storedAmount != null;
      const hasUnit = Boolean(ingredient.unit?.trim());
      if (!hasAmount && !hasUnit) return;

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
          amountEntries: [entry],
        });
        return;
      }
      existing.amountEntries.push(entry);
    });
  });

  return Array.from(combined.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item) => ({
      ...item,
      amount: item.amountEntries[0]?.amount ?? null,
      unit: item.amountEntries[0]?.unit,
    }));
};
