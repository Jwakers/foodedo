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
  Loader2,
  Link2,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCallback, useEffect, useState } from "react";

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

  const INGREDIENTS_PAGE_SIZE = 10;

  const isSuperUser = user?.isSuperUser === true;

  const filteredIngredients = (ingredients ?? []).filter((ing) => {
    if (!ingredientSearch.trim()) return true;
    const q = ingredientSearch.trim().toLowerCase();
    const name = (ing.name ?? "").toLowerCase();
    const displayName = (ing.displayName ?? "").toLowerCase();
    const foodGroup = (ing.foodGroup ?? "").toLowerCase();
    const aliases = (ing.aliases ?? []).join(" ").toLowerCase();
    return (
      name.includes(q) ||
      displayName.includes(q) ||
      foodGroup.includes(q) ||
      aliases.includes(q)
    );
  });
  const displayedIngredients = filteredIngredients.slice(0, ingredientsVisible);
  const hasMore = filteredIngredients.length > ingredientsVisible;

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
      if (editingId) {
        await updateMutation({
          id: editingId,
          name: form.name.trim() || undefined,
          displayName: form.displayName.trim() || null,
          foodGroup: form.foodGroup.trim() || null,
          foodSubGroup: form.foodSubGroup.trim() || null,
          externalId: form.externalId.trim() || null,
          aliases: form.aliases
            ? form.aliases
                .split(/[\n,]+/)
                .map((s) => s.trim())
                .filter(Boolean)
            : undefined,
        });
      } else {
        await createMutation({
          name: form.name.trim(),
          displayName: form.displayName.trim() || undefined,
          foodGroup: form.foodGroup.trim() || undefined,
          foodSubGroup: form.foodSubGroup.trim() || undefined,
          externalId: form.externalId.trim() || undefined,
          aliases: form.aliases
            ? form.aliases
                .split(/[\n,]+/)
                .map((s) => s.trim())
                .filter(Boolean)
            : undefined,
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
    <div className="container max-w-4xl space-y-8 px-4 py-6">
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name, display name, food group, or alias…"
                  value={ingredientSearch}
                  onChange={(e) => {
                    setIngredientSearch(e.target.value);
                    setIngredientsVisible(INGREDIENTS_PAGE_SIZE);
                  }}
                  className="pl-9"
                  aria-label="Search ingredients"
                />
              </div>
              <p className="text-muted-foreground text-xs">
                {ingredientSearch.trim()
                  ? `Showing ${displayedIngredients.length} of ${filteredIngredients.length} matching`
                  : `Showing ${displayedIngredients.length} of ${ingredients.length}`}
              </p>
              {filteredIngredients.length === 0 ? (
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
                  Show more ({Math.min(INGREDIENTS_PAGE_SIZE, filteredIngredients.length - ingredientsVisible)} more)
                </Button>
              )}
              </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-600 dark:text-amber-500" />
            Broken or unlinked references
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Recipe or shopping list lines that have no linked ingredient or
            point to a deleted ingredient.
          </p>
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
                      <h3 className="font-medium text-sm mb-2">
                        Recipe ingredients ({brokenRefs.recipeRefs.length})
                      </h3>
                      <ul className="space-y-1.5 text-sm">
                        {brokenRefs.recipeRefs.map((ref, i) => (
                          <li
                            key={`${ref.recipeId}-${ref.ingredientIndex}-${i}`}
                            className={cn(
                              "rounded px-3 py-2 border flex flex-wrap items-center justify-between gap-2",
                              ref.status === "broken"
                                ? "border-amber-500/50 bg-amber-500/5"
                                : "border-border bg-muted/30"
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
                            <div className="flex gap-1 shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => openCreateWithPrefill(ref.lineName)}
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
                    </div>
                  )}
                  {brokenRefs.shoppingRefs.length > 0 && (
                    <div>
                      <h3 className="font-medium text-sm mb-2">
                        Shopping list items ({brokenRefs.shoppingRefs.length})
                      </h3>
                      <ul className="space-y-1.5 text-sm">
                        {brokenRefs.shoppingRefs.map((ref, i) => (
                          <li
                            key={`${ref.itemId}-${i}`}
                            className={cn(
                              "rounded px-3 py-2 border flex flex-wrap items-center justify-between gap-2",
                              ref.status === "broken"
                                ? "border-amber-500/50 bg-amber-500/5"
                                : "border-border bg-muted/30"
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
                            <div className="flex gap-1 shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => openCreateWithPrefill(ref.lineName)}
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
