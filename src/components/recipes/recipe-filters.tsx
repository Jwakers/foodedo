"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, titleCase } from "@/lib/utils";
import {
  COMPLEXITY_TIERS,
  PRIMARY_PROTEINS,
  RECIPE_CATEGORIES,
} from "convex/lib/constants";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  isDefaultRecipeFilterState,
  type RecipeCoreFilterState,
} from "./recipe-filter-utils";
import { RECIPE_QUICK_FILTERS } from "./quick-filters";
import { LeftoverIngredientsFilter } from "./leftover-ingredients-filter";
import { useRecipeListing } from "./recipe-listing-context";

const DURATION_OPTIONS = [
  { value: "all", label: "Any duration" },
  { value: "under-30", label: "Under 30 min" },
  { value: "30-60", label: "30–60 min" },
  { value: "60-plus", label: "60+ min" },
] as const;

type RecipeFilterControlsProps = {
  filterState: RecipeCoreFilterState;
  onSearchQueryChange: (value: string) => void;
  onSelectedCategoryChange: (value: string) => void;
  onSelectedProteinChange: (value: string) => void;
  onSelectedDurationChange: (value: string) => void;
  onSelectedComplexityChange: (value: string) => void;
  onToggleQuickFilter: (key: (typeof RECIPE_QUICK_FILTERS)[number]["key"]) => void;
  onClearFilters?: () => void;
  compact?: boolean;
  searchDescription?: string;
  searchPlaceholder?: string;
  extraContent?: ReactNode;
};

export function RecipeFilterControls({
  filterState,
  onSearchQueryChange,
  onSelectedCategoryChange,
  onSelectedProteinChange,
  onSelectedDurationChange,
  onSelectedComplexityChange,
  onToggleQuickFilter,
  onClearFilters,
  compact = false,
  searchDescription = "Find recipes by name, description, or ingredient.",
  searchPlaceholder = "Search recipes...",
  extraContent,
}: RecipeFilterControlsProps) {
  const hasActiveFilters = !isDefaultRecipeFilterState(filterState);

  return (
    <div className={cn("space-y-4", compact ? "text-sm" : "space-y-6")}>
      <div className="space-y-2">
        <label htmlFor="recipe-search" className="text-sm font-medium text-foreground">
          Search
        </label>
        <p className="text-sm text-muted-foreground">{searchDescription}</p>
        <div className={cn("relative", compact ? "max-w-full" : "max-w-md")}>
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
            aria-hidden
          />
          <Input
            id="recipe-search"
            placeholder={searchPlaceholder}
            value={filterState.searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            className={cn("pl-10", compact && "h-9")}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <SlidersHorizontal className="size-3.5" />
            Core filters
          </div>
          {hasActiveFilters && onClearFilters ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={onClearFilters}
            >
              <X className="size-3.5" />
              Clear
            </Button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {RECIPE_QUICK_FILTERS.map((quickFilter) => {
            const isActive = filterState.selectedQuickFilters.includes(quickFilter.key);
            return (
              <Button
                key={quickFilter.key}
                type="button"
                size="sm"
                variant={isActive ? "default" : "outline"}
                className="h-8 rounded-full px-3 text-xs"
                aria-pressed={isActive}
                onClick={() => onToggleQuickFilter(quickFilter.key)}
              >
                {quickFilter.label}
              </Button>
            );
          })}
        </div>

        <div className={cn(compact ? "grid grid-cols-2 gap-2" : "flex flex-wrap items-center gap-2")}>
          <Select value={filterState.selectedCategory} onValueChange={onSelectedCategoryChange}>
            <SelectTrigger className={compact ? "h-8" : "w-[160px]"}>
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

          <Select value={filterState.selectedProtein} onValueChange={onSelectedProteinChange}>
            <SelectTrigger className={compact ? "h-8" : "w-[160px]"}>
              <SelectValue placeholder="Protein" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All proteins</SelectItem>
              {PRIMARY_PROTEINS.filter((protein) => protein !== "other" && protein !== "none").map(
                (protein) => (
                  <SelectItem key={protein} value={protein}>
                    {titleCase(protein)}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>

          <Select value={filterState.selectedDuration} onValueChange={onSelectedDurationChange}>
            <SelectTrigger className={compact ? "h-8" : "w-[160px]"}>
              <SelectValue placeholder="Duration" />
            </SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((durationOption) => (
                <SelectItem key={durationOption.value} value={durationOption.value}>
                  {durationOption.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterState.selectedComplexity}
            onValueChange={onSelectedComplexityChange}
          >
            <SelectTrigger className={compact ? "h-8" : "w-[160px]"}>
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

        {extraContent}
      </div>
    </div>
  );
}

type RecipeFilterAccordionProps = {
  children: ReactNode;
  hasActiveFilters: boolean;
  onClearFilters?: () => void;
  className?: string;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
};

export function RecipeFilterAccordion({
  children,
  hasActiveFilters,
  onClearFilters,
  className,
  expanded,
  onExpandedChange,
}: RecipeFilterAccordionProps) {
  const value = expanded ? "filters" : "";
  const onValueChange = (nextValue: string) => {
    onExpandedChange?.(nextValue === "filters");
  };

  return (
    <Accordion
      type="single"
      collapsible
      className={className}
      {...(expanded === undefined
        ? {}
        : {
            value,
            onValueChange,
          })}
    >
      <AccordionItem value="filters" className="rounded-xl border px-4">
        <AccordionTrigger className="py-3 text-sm hover:no-underline">
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-muted-foreground" />
            Search and filters
            {hasActiveFilters ? (
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                Active
              </span>
            ) : null}
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-4 pt-1">
          {children}
          {onClearFilters && hasActiveFilters ? (
            <div className="mt-3 flex justify-end">
              <Button type="button" size="sm" variant="ghost" onClick={onClearFilters}>
                <X className="size-3.5" />
                Clear filters
              </Button>
            </div>
          ) : null}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export function RecipeFilters() {
  const {
    filterState,
    setSearchQuery,
    setSelectedCategory,
    setSelectedProtein,
    setSelectedDuration,
    setSelectedComplexity,
    toggleQuickFilter,
    clearFilters,
    hasActiveFilters,
  } = useRecipeListing();
  const [searchInput, setSearchInput] = useState(filterState.searchQuery);

  useEffect(() => {
    setSearchInput(filterState.searchQuery);
  }, [filterState.searchQuery]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput !== filterState.searchQuery) {
        setSearchQuery(searchInput);
      }
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [filterState.searchQuery, searchInput, setSearchQuery]);

  return (
    <RecipeFilterAccordion
      hasActiveFilters={hasActiveFilters}
      onClearFilters={clearFilters}
    >
      <RecipeFilterControls
        filterState={{ ...filterState, searchQuery: searchInput }}
        onSearchQueryChange={setSearchInput}
        onSelectedCategoryChange={setSelectedCategory}
        onSelectedProteinChange={setSelectedProtein}
        onSelectedDurationChange={setSelectedDuration}
        onSelectedComplexityChange={setSelectedComplexity}
        onToggleQuickFilter={toggleQuickFilter}
        onClearFilters={clearFilters}
        extraContent={<LeftoverIngredientsFilter />}
      />
    </RecipeFilterAccordion>
  );
}
