"use client";

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
import { Search } from "lucide-react";
import { LeftoverIngredientsFilter } from "./leftover-ingredients-filter";
import { RecipeQuickFilters } from "./recipe-quick-filters";
import { useRecipeListing } from "./recipe-listing-context";

const DURATION_OPTIONS = [
  { value: "all", label: "Any duration" },
  { value: "under-30", label: "Under 30 min" },
  { value: "30-60", label: "30–60 min" },
  { value: "60-plus", label: "60+ min" },
] as const;

export function RecipeFilters() {
  const {
    filterState,
    setSearchQuery,
    setSelectedCategory,
    setSelectedProtein,
    setSelectedDuration,
    setSelectedComplexity,
  } = useRecipeListing();

  return (
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
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
            aria-hidden
          />
          <Input
            id="recipe-search"
            placeholder="Search recipes..."
            value={filterState.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-4">
        <RecipeQuickFilters />
        <div className="space-y-2">
          <span className="text-sm font-medium text-foreground">Filter</span>
          <p className="text-sm text-muted-foreground">
            Narrow results by category, protein, time, complexity, or matching
            ingredients (below).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={filterState.selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-[160px]">
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
            value={filterState.selectedProtein}
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
            value={filterState.selectedDuration}
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
            value={filterState.selectedComplexity}
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
        </div>

        <LeftoverIngredientsFilter />
      </div>
    </div>
  );
}
