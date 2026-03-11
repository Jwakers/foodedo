"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { titleCase } from "@/lib/utils";
import {
  COMPLEXITY_TIERS,
  PRIMARY_PROTEINS,
  RECIPE_CATEGORIES,
} from "convex/lib/constants";
import { Check, Search, X } from "lucide-react";
import { ReactNode, useState } from "react";
import { LoadingState, RecipeCard, type RecipeListItem } from "./recipe-card";

const DURATION_OPTIONS = [
  { value: "all", label: "Any duration" },
  { value: "under-30", label: "Under 30 min" },
  { value: "30-60", label: "30–60 min" },
  { value: "60-plus", label: "60+ min" },
] as const;

function getRecipeTotalMinutes(recipe: RecipeListItem): number {
  if (recipe.totalTimeMinutes != null && recipe.totalTimeMinutes > 0) {
    return recipe.totalTimeMinutes;
  }
  return (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
}

function matchesDuration(recipe: RecipeListItem, duration: string): boolean {
  if (duration === "all") return true;
  const total = getRecipeTotalMinutes(recipe);
  switch (duration) {
    case "under-30":
      return total > 0 && total < 30;
    case "30-60":
      return total >= 30 && total <= 60;
    case "60-plus":
      return total > 60;
    default:
      return true;
  }
}

type RecipeListGridProps = {
  recipes: RecipeListItem[] | undefined;
  title: string;
  subtitle?: ReactNode;
  emptyState?: ReactNode;
  headerActions?: ReactNode;
  footer?: ReactNode;
  stats?: ReactNode;
  showMealPlanEligibleKey?: boolean;
  /** When "discover", show protein / duration / complexity filters instead of category. Default "category". */
  filterVariant?: "category" | "discover";
};

export function RecipeListGrid({
  recipes,
  title,
  subtitle,
  emptyState,
  headerActions,
  footer,
  stats,
  showMealPlanEligibleKey = false,
  filterVariant = "category",
}: RecipeListGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProtein, setSelectedProtein] = useState<string>("all");
  const [selectedDuration, setSelectedDuration] = useState<string>("all");
  const [selectedComplexity, setSelectedComplexity] = useState<string>("all");

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredRecipes =
    recipes?.filter((recipe) => {
      const matchesSearch =
        recipe.title.toLowerCase().includes(normalizedSearch) ||
        (recipe.description ?? "").toLowerCase().includes(normalizedSearch);

      if (filterVariant === "discover") {
        const matchesProtein =
          selectedProtein === "all" ||
          (recipe.primaryProtein ?? "other") === selectedProtein;
        const matchesDurationFilter = matchesDuration(recipe, selectedDuration);
        const matchesComplexity =
          selectedComplexity === "all" ||
          (recipe.complexityTier ?? "") === selectedComplexity;
        return (
          matchesSearch &&
          matchesProtein &&
          matchesDurationFilter &&
          matchesComplexity
        );
      }

      const matchesCategory =
        selectedCategory === "all" || recipe.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }) ?? [];

  const hasRecipes = recipes && recipes.length > 0;
  const hasFilteredResults = filteredRecipes.length > 0;

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                {title}
              </h1>
              {subtitle && (
                <p className="text-muted-foreground text-lg">{subtitle}</p>
              )}
            </div>
            {headerActions}
          </div>

          {stats}

          {showMealPlanEligibleKey && hasRecipes && (
            <p className="text-xs text-muted-foreground mb-4 flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="inline-flex size-4 items-center justify-center rounded-full bg-primary/90 text-primary-foreground">
                  <Check className="size-2.5" strokeWidth={3} aria-hidden />
                </span>
                <span>Included in meal plan generation</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-flex size-4 items-center justify-center rounded-full border border-dashed border-muted-foreground text-muted-foreground">
                  <X className="size-2.5" strokeWidth={2.5} aria-hidden />
                </span>
                <span>Not included</span>
              </span>
            </p>
          )}

          <div className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="recipe-search"
                className="text-sm font-medium text-foreground"
              >
                Search
              </label>
              <p className="text-sm text-muted-foreground">
                Find recipes by name or description.
              </p>
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" aria-hidden />
                <Input
                  id="recipe-search"
                  placeholder="Search recipes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-foreground">
                Filter
              </span>
              <p className="text-sm text-muted-foreground">
                {filterVariant === "discover"
                  ? "Narrow results by protein, time, or complexity."
                  : "Narrow results by category."}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {filterVariant === "discover" ? (
                  <>
                    <Select
                      value={selectedProtein}
                      onValueChange={setSelectedProtein}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Protein" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All proteins</SelectItem>
                        {PRIMARY_PROTEINS.filter(
                          (p) => p !== "other" && p !== "none"
                        ).map((protein) => (
                          <SelectItem key={protein} value={protein}>
                            {titleCase(protein)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={selectedDuration}
                      onValueChange={setSelectedDuration}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={selectedComplexity}
                      onValueChange={setSelectedComplexity}
                    >
                      <SelectTrigger className="w-[160px]">
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
                  </>
                ) : (
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {RECIPE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {titleCase(category)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>
        </div>

        {recipes === undefined ? (
          <LoadingState />
        ) : !hasFilteredResults ? (
          hasRecipes ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                {filterVariant === "discover"
                  ? "No recipes match your search or filters."
                  : "No recipes match your search or selected category."}
              </p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setSelectedProtein("all");
                  setSelectedDuration("all");
                  setSelectedComplexity("all");
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            (emptyState ?? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No recipes found.</p>
              </div>
            ))
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRecipes.map((recipe) => (
              <RecipeCard key={recipe._id} recipe={recipe} />
            ))}
          </div>
        )}

        {footer}
      </div>
    </div>
  );
}
