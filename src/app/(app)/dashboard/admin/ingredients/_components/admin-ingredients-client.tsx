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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { INGREDIENT_FOOD_GROUPS } from "convex/lib/ingredientFoodGroups";
import { INGREDIENT_FOOD_SUB_GROUPS } from "convex/lib/ingredientFoodSubGroups";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Doc, Id } from "convex/_generated/dataModel";
import { api } from "convex/_generated/api";
import { ConvexError } from "convex/values";
import { useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  ArrowDownAZ,
  ArrowUpAZ,
  ExternalLink,
  Loader2,
  Link2,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCallback, useEffect, useMemo, useState } from "react";

type FormState = {
  name: string;
  displayName: string;
  foodGroup: string;
  foodSubGroup: string;
  externalId: string;
  aliases: string;
};

const emptyForm: FormState = {
  name: "",
  displayName: "",
  foodGroup: "",
  foodSubGroup: "",
  externalId: "",
  aliases: "",
};

function formFromDoc(doc: Doc<"ingredients">): FormState {
  return {
    name: doc.name,
    displayName: doc.displayName ?? "",
    foodGroup: doc.foodGroup ?? "",
    foodSubGroup: doc.foodSubGroup ?? "",
    externalId: doc.externalId ?? "",
    aliases: (doc.aliases ?? []).join(", "),
  };
}

/** Capitalise first letter of each word for pre-filling ingredient name/display name */
function toTitleCase(s: string): string {
  return s
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getErrorMessage(err: unknown, defaultMessage = "Something went wrong."): string {
  if (err instanceof ConvexError) return err.message;
  if (err && typeof err === "object" && "message" in err)
    return String((err as { message: unknown }).message);
  return defaultMessage;
}

type IngredientSortKey = "name" | "foodGroup" | "foodSubGroup" | "externalId";

function sortKeyLabel(key: IngredientSortKey): string {
  switch (key) {
    case "name":
      return "Name";
    case "foodGroup":
      return "Food group";
    case "foodSubGroup":
      return "Food sub-group";
    case "externalId":
      return "External ID";
    default:
      return "Name";
  }
}

function aliasesPreview(aliases: string[] | undefined, maxLen = 48): string {
  if (!aliases?.length) return "—";
  const joined = aliases.join(", ");
  if (joined.length <= maxLen) return joined;
  return `${joined.slice(0, maxLen - 1)}…`;
}

export function AdminIngredientsClient() {
  const router = useRouter();
  const user = useQuery(api.users.current);
  const ingredients = useQuery(
    api.adminIngredients.listForAdmin,
    user?.isSuperUser ? {} : "skip",
  );
  const brokenRefs = useQuery(
    api.adminIngredients.getBrokenOrUnlinkedIngredientReferences,
    user?.isSuperUser ? {} : "skip",
  );
  const createMutation = useMutation(api.adminIngredients.create);
  const updateMutation = useMutation(api.adminIngredients.update);
  const removeMutation = useMutation(api.adminIngredients.remove);
  const addAliasMutation = useMutation(api.adminIngredients.addAlias);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"ingredients"> | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: Id<"ingredients">;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [aliasDialog, setAliasDialog] = useState<{
    alias: string;
    error?: string;
  } | null>(null);
  const [aliasSelectedId, setAliasSelectedId] = useState<Id<"ingredients"> | null>(null);
  const [isAddingAlias, setIsAddingAlias] = useState(false);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [ingredientsVisible, setIngredientsVisible] = useState(10);
  const [ingredientSortKey, setIngredientSortKey] =
    useState<IngredientSortKey>("name");
  const [ingredientSortAsc, setIngredientSortAsc] = useState(true);
  const [refsSearch, setRefsSearch] = useState("");
  const [refsStatusFilter, setRefsStatusFilter] = useState<
    "all" | "broken" | "unlinked"
  >("all");
  const [refsSortMode, setRefsSortMode] = useState<"recipe" | "alphabetical">(
    "recipe",
  );
  const [recipeRefsVisible, setRecipeRefsVisible] = useState(10);
  const [shoppingRefsVisible, setShoppingRefsVisible] = useState(10);

  const INGREDIENTS_PAGE_SIZE = 10;
  const REFS_PAGE_SIZE = 10;

  const isSuperUser = user?.isSuperUser === true;

  const filteredIngredients = useMemo(() => {
    return (ingredients ?? []).filter((ing) => {
      if (!ingredientSearch.trim()) return true;
      const q = ingredientSearch.trim().toLowerCase();
      const name = (ing.name ?? "").toLowerCase();
      const displayName = (ing.displayName ?? "").toLowerCase();
      const foodGroup = (ing.foodGroup ?? "").toLowerCase();
      const foodSubGroup = (ing.foodSubGroup ?? "").toLowerCase();
      const externalId = (ing.externalId ?? "").toLowerCase();
      const aliases = (ing.aliases ?? []).join(" ").toLowerCase();
      return (
        name.includes(q) ||
        displayName.includes(q) ||
        foodGroup.includes(q) ||
        foodSubGroup.includes(q) ||
        externalId.includes(q) ||
        aliases.includes(q)
      );
    });
  }, [ingredients, ingredientSearch]);

  const sortedFilteredIngredients = useMemo(() => {
    const mult = ingredientSortAsc ? 1 : -1;
    const list = [...filteredIngredients];
    list.sort((a, b) => {
      const getVal = (doc: Doc<"ingredients">) => {
        switch (ingredientSortKey) {
          case "name":
            return doc.name ?? "";
          case "foodGroup":
            return doc.foodGroup ?? "";
          case "foodSubGroup":
            return doc.foodSubGroup ?? "";
          case "externalId":
            return doc.externalId ?? "";
          default:
            return doc.name ?? "";
        }
      };
      const av = getVal(a).toLowerCase();
      const bv = getVal(b).toLowerCase();
      const emptyLast = (s: string) => (s === "" ? "\uffff" : s);
      const aKey = emptyLast(av);
      const bKey = emptyLast(bv);
      if (aKey < bKey) return -1 * mult;
      if (aKey > bKey) return 1 * mult;
      return a.name.localeCompare(b.name) * mult;
    });
    return list;
  }, [filteredIngredients, ingredientSortKey, ingredientSortAsc]);

  const filteredRecipeRefs = useMemo(() => {
    let list = brokenRefs?.recipeRefs ?? [];
    if (refsStatusFilter !== "all") {
      list = list.filter((r) => r.status === refsStatusFilter);
    }
    const q = refsSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.lineName.toLowerCase().includes(q) ||
          r.recipeTitle.toLowerCase().includes(q),
      );
    }
    return list;
  }, [brokenRefs, refsSearch, refsStatusFilter]);

  const filteredShoppingRefs = useMemo(() => {
    let list = brokenRefs?.shoppingRefs ?? [];
    if (refsStatusFilter !== "all") {
      list = list.filter((r) => r.status === refsStatusFilter);
    }
    const q = refsSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.lineName.toLowerCase().includes(q) ||
          r.shoppingListId.toLowerCase().includes(q),
      );
    }
    return list;
  }, [brokenRefs, refsSearch, refsStatusFilter]);

  const sortedRecipeRefs = useMemo(() => {
    const list = [...filteredRecipeRefs];
    if (refsSortMode === "alphabetical") {
      list.sort((a, b) => {
        const byLine = a.lineName.localeCompare(b.lineName, undefined, {
          sensitivity: "base",
        });
        if (byLine !== 0) return byLine;
        const byRecipe = a.recipeTitle.localeCompare(b.recipeTitle, undefined, {
          sensitivity: "base",
        });
        if (byRecipe !== 0) return byRecipe;
        return a.ingredientIndex - b.ingredientIndex;
      });
    }
    return list;
  }, [filteredRecipeRefs, refsSortMode]);

  const sortedShoppingRefs = useMemo(() => {
    const list = [...filteredShoppingRefs];
    if (refsSortMode === "alphabetical") {
      list.sort((a, b) => {
        const byLine = a.lineName.localeCompare(b.lineName, undefined, {
          sensitivity: "base",
        });
        if (byLine !== 0) return byLine;
        return a.shoppingListId.localeCompare(b.shoppingListId);
      });
    }
    return list;
  }, [filteredShoppingRefs, refsSortMode]);

  const displayedRecipeRefs = sortedRecipeRefs.slice(0, recipeRefsVisible);
  const displayedShoppingRefs = sortedShoppingRefs.slice(
    0,
    shoppingRefsVisible,
  );
  const hasMoreRecipeRefs =
    sortedRecipeRefs.length > recipeRefsVisible;
  const hasMoreShoppingRefs =
    sortedShoppingRefs.length > shoppingRefsVisible;

  useEffect(() => {
    setRecipeRefsVisible(REFS_PAGE_SIZE);
    setShoppingRefsVisible(REFS_PAGE_SIZE);
  }, [refsSearch, refsStatusFilter, refsSortMode]);

  const displayedIngredients = sortedFilteredIngredients.slice(
    0,
    ingredientsVisible,
  );
  const hasMore =
    sortedFilteredIngredients.length > ingredientsVisible;

  useEffect(() => {
    if (user !== undefined && !user) {
      router.replace(ROUTES.DASHBOARD);
      return;
    }
    if (user && !user.isSuperUser) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [user, router]);

  const openCreate = useCallback(() => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((doc: Doc<"ingredients">) => {
    setEditingId(doc._id);
    setForm(formFromDoc(doc));
    setFormError(null);
    setDialogOpen(true);
  }, []);

  const openCreateWithPrefill = useCallback((name: string) => {
    const capitalised = toTitleCase(name);
    setEditingId(null);
    setForm({
      ...emptyForm,
      name: capitalised,
      displayName: capitalised,
    });
    setFormError(null);
    setDialogOpen(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const name = form.name.trim();
    if (!name) {
      setFormError("Name is required.");
      return;
    }
    setIsSubmitting(true);
    try {
      const parsedAliases = form.aliases
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (editingId) {
        await updateMutation({
          id: editingId,
          name: form.name.trim() || undefined,
          displayName: form.displayName.trim() || null,
          foodGroup: form.foodGroup.trim() || null,
          foodSubGroup: form.foodSubGroup.trim() || null,
          externalId: form.externalId.trim() || null,
          // Always send aliases when editing so clearing the textarea removes all aliases
          // (empty string is falsy; we must not omit the field).
          aliases: parsedAliases,
        });
      } else {
        await createMutation({
          name: form.name.trim(),
          displayName: form.displayName.trim() || undefined,
          foodGroup: form.foodGroup.trim() || undefined,
          foodSubGroup: form.foodSubGroup.trim() || undefined,
          externalId: form.externalId.trim() || undefined,
          aliases: parsedAliases.length > 0 ? parsedAliases : undefined,
        });
      }
      setDialogOpen(false);
    } catch (err: unknown) {
      setFormError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await removeMutation({ id: deleteTarget.id });
      setDeleteTarget(null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to delete ingredient."));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddAlias = async () => {
    if (!aliasDialog || !aliasSelectedId) return;
    setIsAddingAlias(true);
    setAliasDialog((prev) => (prev ? { ...prev, error: undefined } : null));
    try {
      await addAliasMutation({
        ingredientId: aliasSelectedId,
        alias: aliasDialog.alias.trim(),
      });
      setAliasDialog(null);
      setAliasSelectedId(null);
    } catch (err: unknown) {
      setAliasDialog((prev) =>
        prev ? { ...prev, error: getErrorMessage(err, "Failed to add alias.") } : null,
      );
    } finally {
      setIsAddingAlias(false);
    }
  };

  if (user === undefined || !isSuperUser) {
    return (
      <div className="container flex min-h-[50vh] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <ShieldAlert className="size-12 text-muted-foreground" />
          <p className="text-muted-foreground">Checking access…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl space-y-8 px-4 py-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Manage ingredients
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Super user: add, edit, and remove canonical ingredients. Fix broken or
          unlinked references below.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Ingredients</CardTitle>
          <Button onClick={openCreate} size="sm">
            <Plus className="size-4 mr-2" />
            Add new
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {ingredients === undefined ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : ingredients.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">
              No ingredients yet. Add one to get started.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search name, display name, groups, external ID, aliases…"
                    value={ingredientSearch}
                    onChange={(e) => {
                      setIngredientSearch(e.target.value);
                      setIngredientsVisible(INGREDIENTS_PAGE_SIZE);
                    }}
                    className="pl-9"
                    aria-label="Search ingredients"
                  />
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="ing-sort" className="text-muted-foreground whitespace-nowrap text-xs">
                      Sort
                    </Label>
                    <Select
                      value={ingredientSortKey}
                      onValueChange={(v) =>
                        setIngredientSortKey(v as IngredientSortKey)
                      }
                    >
                      <SelectTrigger id="ing-sort" className="h-9 w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          [
                            "name",
                            "foodGroup",
                            "foodSubGroup",
                            "externalId",
                          ] as const
                        ).map((k) => (
                          <SelectItem key={k} value={k}>
                            {sortKeyLabel(k)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 shrink-0"
                    onClick={() => setIngredientSortAsc((a) => !a)}
                    aria-label={
                      ingredientSortAsc
                        ? "Sort ascending; click for descending"
                        : "Sort descending; click for ascending"
                    }
                  >
                    {ingredientSortAsc ? (
                      <ArrowDownAZ className="size-4" />
                    ) : (
                      <ArrowUpAZ className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                {ingredientSearch.trim()
                  ? `Showing ${displayedIngredients.length} of ${sortedFilteredIngredients.length} matching`
                  : `Showing ${displayedIngredients.length} of ${ingredients.length}`}
              </p>
              {sortedFilteredIngredients.length === 0 ? (
                <p className="text-muted-foreground text-sm py-6 text-center">
                  No ingredients match your search. Try a different term or clear the search.
                </p>
              ) : (
              <>
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="h-10 px-4 text-left font-medium">Name</th>
                        <th className="h-10 px-4 text-left font-medium hidden sm:table-cell">
                          Display name
                        </th>
                        <th className="h-10 px-4 text-left font-medium hidden md:table-cell">
                          Food group
                        </th>
                        <th className="h-10 px-4 text-left font-medium hidden md:table-cell">
                          Food sub-group
                        </th>
                        <th className="h-10 px-4 text-left font-medium hidden lg:table-cell">
                          External ID
                        </th>
                        <th className="h-10 px-4 text-left font-medium hidden xl:table-cell max-w-[200px]">
                          Aliases
                        </th>
                        <th className="h-10 w-24 px-4 text-right font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedIngredients.map((ing) => (
                      <tr
                        key={ing._id}
                        className="border-b last:border-0 hover:bg-muted/30"
                      >
                        <td className="px-4 py-3 font-medium">{ing.name}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {ing.displayName ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                          {ing.foodGroup ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                          {ing.foodSubGroup ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell font-mono text-xs">
                          {ing.externalId ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell max-w-[200px]">
                          <span className="text-xs">
                            {(ing.aliases?.length ?? 0) > 0 && (
                              <span className="text-muted-foreground mr-1.5">
                                ({ing.aliases?.length})
                              </span>
                            )}
                            <span className="line-clamp-2 wrap-break-word">
                              {aliasesPreview(ing.aliases)}
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => openEdit(ing)}
                              aria-label={`Edit ${ing.name}`}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive hover:text-destructive"
                              onClick={() =>
                                setDeleteTarget({ id: ing._id, name: ing.name })
                              }
                              aria-label={`Remove ${ing.name}`}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {hasMore && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    setIngredientsVisible((n) => n + INGREDIENTS_PAGE_SIZE)
                  }
                >
                  Show more ({Math.min(INGREDIENTS_PAGE_SIZE, sortedFilteredIngredients.length - ingredientsVisible)} more)
                </Button>
              )}
              </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-600 dark:text-amber-500" />
              Broken or unlinked references
            </CardTitle>
            <p className="text-muted-foreground text-sm mt-1">
              Recipe or shopping list lines that have no linked ingredient or
              point to a deleted ingredient. Search and filter to narrow the list.
            </p>
          </div>
          {brokenRefs !== undefined &&
            (brokenRefs.recipeRefs.length > 0 ||
              brokenRefs.shoppingRefs.length > 0) && (
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:flex-wrap">
                <div className="relative min-w-0 flex-1 lg:min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search line name, recipe title, or list id…"
                    value={refsSearch}
                    onChange={(e) => setRefsSearch(e.target.value)}
                    className="pl-9"
                    aria-label="Search broken or unlinked references"
                  />
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex items-center gap-2 shrink-0">
                    <Label
                      htmlFor="refs-status"
                      className="text-muted-foreground whitespace-nowrap text-xs"
                    >
                      Status
                    </Label>
                    <Select
                      value={refsStatusFilter}
                      onValueChange={(v) =>
                        setRefsStatusFilter(v as typeof refsStatusFilter)
                      }
                    >
                      <SelectTrigger id="refs-status" className="h-9 w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="broken">Broken only</SelectItem>
                        <SelectItem value="unlinked">Unlinked only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Label
                      htmlFor="refs-sort"
                      className="text-muted-foreground whitespace-nowrap text-xs"
                    >
                      Sort
                    </Label>
                    <Select
                      value={refsSortMode}
                      onValueChange={(v) =>
                        setRefsSortMode(v as typeof refsSortMode)
                      }
                    >
                      <SelectTrigger id="refs-sort" className="h-9 w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recipe">By recipe</SelectItem>
                        <SelectItem value="alphabetical">
                          Alphabetical (line name)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
        </CardHeader>
        <CardContent>
          {brokenRefs === undefined ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {brokenRefs.recipeRefs.length === 0 &&
              brokenRefs.shoppingRefs.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No broken or unlinked references.
                </p>
              ) : (
                <>
                  {brokenRefs.recipeRefs.length > 0 && (
                    <div>
                      <h3 className="font-medium text-sm">Recipe ingredients</h3>
                      <p className="text-muted-foreground text-xs mb-2">
                        {sortedRecipeRefs.length === 0
                          ? "No recipe rows in the current filter."
                          : `Showing ${displayedRecipeRefs.length} of ${sortedRecipeRefs.length} matching${sortedRecipeRefs.length !== brokenRefs.recipeRefs.length ? ` (${brokenRefs.recipeRefs.length} total)` : ""}`}
                      </p>
                      {sortedRecipeRefs.length === 0 ? null : (
                        <ul className="space-y-1.5 text-sm">
                          {displayedRecipeRefs.map((ref) => (
                            <li
                              key={`${ref.recipeId}-${ref.ingredientIndex}`}
                              className={cn(
                                "rounded px-3 py-2 border flex flex-wrap items-center justify-between gap-2",
                                ref.status === "broken"
                                  ? "border-amber-500/50 bg-amber-500/5"
                                  : "border-border bg-muted/30",
                              )}
                            >
                              <span>
                                <span className="font-medium">
                                  {ref.lineName}
                                </span>
                                <span className="text-muted-foreground ml-1">
                                  ({ref.recipeTitle})
                                </span>
                                {ref.status === "broken" && (
                                  <span className="ml-2 text-amber-600 dark:text-amber-500 text-xs">
                                    (ingredient deleted)
                                  </span>
                                )}
                                {ref.status === "unlinked" && (
                                  <span className="ml-2 text-muted-foreground text-xs">
                                    (not linked)
                                  </span>
                                )}
                              </span>
                              <div className="flex flex-wrap gap-1 shrink-0 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  asChild
                                >
                                  <Link
                                    href={`${ROUTES.RECIPE}/${ref.recipeId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="size-3.5 mr-1" />
                                    Open recipe
                                  </Link>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() =>
                                    openCreateWithPrefill(ref.lineName)
                                  }
                                >
                                  <Plus className="size-3.5 mr-1" />
                                  Add as ingredient
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    setAliasDialog({ alias: ref.lineName });
                                    setAliasSelectedId(null);
                                  }}
                                >
                                  <Link2 className="size-3.5 mr-1" />
                                  Add as alias
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                      {hasMoreRecipeRefs && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 w-full"
                          onClick={() =>
                            setRecipeRefsVisible(
                              (n) => n + REFS_PAGE_SIZE,
                            )
                          }
                        >
                          Show more (
                          {Math.min(
                            REFS_PAGE_SIZE,
                            sortedRecipeRefs.length - recipeRefsVisible,
                          )}{" "}
                          more)
                        </Button>
                      )}
                    </div>
                  )}
                  {brokenRefs.shoppingRefs.length > 0 && (
                    <div>
                      <h3 className="font-medium text-sm">
                        Shopping list items
                      </h3>
                      <p className="text-muted-foreground text-xs mb-2">
                        {sortedShoppingRefs.length === 0
                          ? "No shopping rows in the current filter."
                          : `Showing ${displayedShoppingRefs.length} of ${sortedShoppingRefs.length} matching${sortedShoppingRefs.length !== brokenRefs.shoppingRefs.length ? ` (${brokenRefs.shoppingRefs.length} total)` : ""}`}
                      </p>
                      {sortedShoppingRefs.length === 0 ? null : (
                        <ul className="space-y-1.5 text-sm">
                          {displayedShoppingRefs.map((ref) => (
                            <li
                              key={ref.itemId}
                              className={cn(
                                "rounded px-3 py-2 border flex flex-wrap items-center justify-between gap-2",
                                ref.status === "broken"
                                  ? "border-amber-500/50 bg-amber-500/5"
                                  : "border-border bg-muted/30",
                              )}
                            >
                              <span>
                                <span className="font-medium">
                                  {ref.lineName}
                                </span>
                                <span className="text-muted-foreground ml-1">
                                  (shopping list)
                                </span>
                                {ref.status === "broken" && (
                                  <span className="ml-2 text-amber-600 dark:text-amber-500 text-xs">
                                    (ingredient deleted)
                                  </span>
                                )}
                                {ref.status === "unlinked" && (
                                  <span className="ml-2 text-muted-foreground text-xs">
                                    (not linked)
                                  </span>
                                )}
                              </span>
                              <div className="flex flex-wrap gap-1 shrink-0 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  asChild
                                >
                                  <Link
                                    href={ROUTES.shoppingListWithId(
                                      ref.shoppingListId,
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="size-3.5 mr-1" />
                                    Open list
                                  </Link>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() =>
                                    openCreateWithPrefill(ref.lineName)
                                  }
                                >
                                  <Plus className="size-3.5 mr-1" />
                                  Add as ingredient
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    setAliasDialog({ alias: ref.lineName });
                                    setAliasSelectedId(null);
                                  }}
                                >
                                  <Link2 className="size-3.5 mr-1" />
                                  Add as alias
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                      {hasMoreShoppingRefs && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 w-full"
                          onClick={() =>
                            setShoppingRefsVisible(
                              (n) => n + REFS_PAGE_SIZE,
                            )
                          }
                        >
                          Show more (
                          {Math.min(
                            REFS_PAGE_SIZE,
                            sortedShoppingRefs.length -
                              shoppingRefsVisible,
                          )}{" "}
                          more)
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit ingredient" : "Add ingredient"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <p
                className="text-destructive text-sm"
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
              >
                {formError}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. Garlic"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, displayName: e.target.value }))
                }
                placeholder="Optional"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="foodGroup">Food group</Label>
                <Select
                  value={form.foodGroup || "__none"}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      foodGroup: value === "__none" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger id="foodGroup" className="w-full">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">None</SelectItem>
                    {INGREDIENT_FOOD_GROUPS.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="foodSubGroup">Food sub-group</Label>
                <Select
                  value={form.foodSubGroup || "__none"}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      foodSubGroup: value === "__none" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger id="foodSubGroup" className="w-full">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">None</SelectItem>
                    {INGREDIENT_FOOD_SUB_GROUPS.map((sub) => (
                      <SelectItem key={sub} value={sub}>
                        {sub}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="externalId">External ID</Label>
              <Input
                id="externalId"
                value={form.externalId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, externalId: e.target.value }))
                }
                placeholder="e.g. FOOD00001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aliases">Aliases (comma or newline separated)</Label>
              <textarea
                id="aliases"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={form.aliases}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, aliases: e.target.value }))
                }
                placeholder="e.g. allium, clove"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                )}
                {editingId ? "Save" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove ingredient</AlertDialogTitle>
            <AlertDialogDescription>
              Remove &quot;{deleteTarget?.name}&quot;? Recipe and shopping list
              links to this ingredient will be cleared. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Remove"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!aliasDialog}
        onOpenChange={(open) => {
          if (!open) {
            setAliasDialog(null);
            setAliasSelectedId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add as alias</DialogTitle>
            <p className="text-muted-foreground text-sm">
              Add this text as an alias to an existing ingredient. You can edit
              it below, then select the ingredient to add it to.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            {aliasDialog?.error && (
              <p className="text-destructive text-sm" role="alert">
                {aliasDialog.error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="alias-text">Alias text</Label>
              <Input
                id="alias-text"
                value={aliasDialog?.alias ?? ""}
                onChange={(e) =>
                  setAliasDialog((prev) =>
                    prev
                      ? { ...prev, alias: e.target.value, error: undefined }
                      : null
                  )
                }
                placeholder="e.g. garlic clove"
                aria-label="Alias text"
              />
            </div>
            <Command
              className="rounded-md border"
              filter={(value, search) => {
                const s = search.toLowerCase();
                if (!s) return 1;
                return value.toLowerCase().includes(s) ? 1 : 0;
              }}
            >
              <CommandInput placeholder="Search ingredients…" />
              <CommandList className="max-h-[220px]">
                <CommandEmpty>No ingredient found.</CommandEmpty>
                <CommandGroup heading="Ingredients">
                  {ingredients?.map((ing) => (
                    <CommandItem
                      key={ing._id}
                      value={`${ing.name} ${ing.displayName ?? ""} ${(ing.aliases ?? []).join(" ")}`}
                      onSelect={() => setAliasSelectedId(ing._id)}
                      className={cn(
                        aliasSelectedId === ing._id && "bg-accent"
                      )}
                    >
                      {ing.name}
                      {ing.displayName && ing.displayName !== ing.name && (
                        <span className="text-muted-foreground ml-1">
                          ({ing.displayName})
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
            {aliasSelectedId && ingredients && (
              <p className="text-muted-foreground text-xs">
                Selected:{" "}
                {ingredients.find((i) => i._id === aliasSelectedId)?.name}
              </p>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAliasDialog(null);
                  setAliasSelectedId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddAlias}
                disabled={
                  !aliasSelectedId ||
                  isAddingAlias ||
                  !(aliasDialog?.alias?.trim() ?? "")
                }
              >
                {isAddingAlias && (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                )}
                Add alias
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
