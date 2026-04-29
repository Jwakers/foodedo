import { ServingsStepper } from "@/components/servings-stepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import useShare from "@/lib/hooks/use-share";
import { isPantryStaple } from "@/lib/pantry-staples";
import {
  AISLE_ORDER,
  getAisleForFoodGroupAndSubGroup,
} from "@/lib/shopping-list-aisles";
import { cn } from "@/lib/utils";
import { api } from "convex/_generated/api";
import type { Doc, Id } from "convex/_generated/dataModel";
import {
  canUseServingControl,
  TARGET_SERVINGS_MAX,
  TARGET_SERVINGS_MIN,
} from "convex/lib/constants";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ConvexError } from "convex/values";
import {
  ArrowLeft,
  Check,
  Clipboard,
  Minus,
  Plus,
  Printer,
  Share2,
  ShoppingCart,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type ShoppingList = NonNullable<
  FunctionReturnType<typeof api.shoppingLists.getActiveShoppingList>
>;

type ShoppingListItem = ShoppingList["items"][number];

/** Same shape as `getAmountLines` / Convex line display — single source for amount rows. */
function normalizedAmountEntries(item: ShoppingListItem) {
  if (item.amountEntries && item.amountEntries.length > 0) {
    return item.amountEntries;
  }
  return [{ amount: item.amount, unit: item.unit }];
}

function amountLinesFromEntries(
  entries: ReturnType<typeof normalizedAmountEntries>,
) {
  return entries
    .map((e) => `${e.amount ?? ""} ${e.unit ?? ""}`.trim())
    .filter(Boolean);
}

function firstAmountEntryForItem(item: ShoppingListItem) {
  const entries = normalizedAmountEntries(item);
  const first = entries[0] ?? { amount: item.amount, unit: item.unit };
  return { first, rest: entries.slice(1) };
}

function weeklyTotalEntriesForLeftoverItem(item: ShoppingListItem) {
  const baseline = item.leftoverBaseline;
  if (baseline?.amountEntries && baseline.amountEntries.length > 0) {
    return baseline.amountEntries;
  }
  if (baseline) {
    return [{ amount: baseline.amount, unit: baseline.unit }];
  }
  return null;
}

function finiteNumberOrNull(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function namesEqual(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function LeftoverNumericAmountInput({
  itemId,
  amount,
  disabled,
  onCommit,
}: {
  itemId: Id<"shoppingListItems">;
  amount: number;
  disabled: boolean;
  onCommit: (itemId: Id<"shoppingListItems">, newAmount: number) => void;
}) {
  const committedByEnterRef = useRef(false);
  const [amountDraft, setAmountDraft] = useState(
    Number.isFinite(amount) ? String(amount) : "",
  );

  useEffect(() => {
    setAmountDraft(Number.isFinite(amount) ? String(amount) : "");
  }, [itemId, amount]);

  const commitDraft = useCallback(() => {
    const next = amountDraft.trim();
    if (next === "") {
      onCommit(itemId, 0);
      return;
    }
    const parsed = Number(next);
    if (!Number.isFinite(parsed)) return;
    onCommit(itemId, Math.max(0, parsed));
  }, [amountDraft, itemId, onCommit]);

  return (
    <Input
      type="number"
      min={0}
      step="any"
      className="h-8 w-28 font-medium tabular-nums"
      value={amountDraft}
      disabled={disabled}
      onChange={(e) => {
        setAmountDraft(e.target.value);
      }}
      onBlur={() => {
        if (committedByEnterRef.current) {
          committedByEnterRef.current = false;
          return;
        }
        commitDraft();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          committedByEnterRef.current = true;
          commitDraft();
          (e.currentTarget as HTMLInputElement).blur();
        }
      }}
    />
  );
}

interface ShoppingListProps {
  shoppingList: ShoppingList;
  /** For in-app sharing controls (owner only); distinct from chalkboard household query below. */
  sharingHouseholds?: { _id: Id<"households">; name: string }[];
  onConfirm: () => void | Promise<void>;
  onBack: () => void;
  onDone: () => void;
  onEdit: () => void;
  setSelectedChalkboardItems: React.Dispatch<
    React.SetStateAction<Set<Id<"chalkboardItems">>>
  >;
}

export default function ShoppingList({
  shoppingList,
  sharingHouseholds = [],
  onConfirm,
  onDone,
  onBack,
  onEdit,
  setSelectedChalkboardItems,
}: ShoppingListProps) {
  const { canShare, copyToClipboard, share } = useShare();
  const [showChalkboardDialog, setShowChalkboardDialog] = useState(false);
  const [includePersonal, setIncludePersonal] = useState(true);
  const [selectedHouseholdIds, setSelectedHouseholdIds] = useState<
    Set<Id<"households">>
  >(new Set());
  /** Draft UI only: which pantry staple lines are included in the trip (not stored on documents). */
  const [pantryIncludedIds, setPantryIncludedIds] = useState<
    Set<Id<"shoppingListItems">>
  >(new Set());
  /** Draft UI only: leftover “already have” lines excluded from this shop trip (removed on confirm). */
  const [leftoverExcludedFromTripIds, setLeftoverExcludedFromTripIds] =
    useState<Set<Id<"shoppingListItems">>>(new Set());
  const [isConfirming, setIsConfirming] = useState(false);
  const [draftTargetServings, setDraftTargetServings] = useState(
    shoppingList.targetServings ?? TARGET_SERVINGS_MIN,
  );
  const [isUpdatingTargetServings, setIsUpdatingTargetServings] =
    useState(false);

  // Mutations
  const toggleItemChecked = useMutation(api.shoppingLists.toggleItemChecked);
  const updateItemAmount = useMutation(api.shoppingLists.updateItemAmount);
  const removeItem = useMutation(api.shoppingLists.removeItem);
  const addChalkboardItems = useMutation(api.shoppingLists.addChalkboardItems);
  const trimDraftItemsAndFinaliseShoppingList = useMutation(
    api.shoppingLists.trimDraftItemsAndFinaliseShoppingList,
  );
  const updateDraftShoppingListTargetServings = useMutation(
    api.shoppingLists.updateDraftShoppingListTargetServings,
  );
  const updateMealPlanLeftoverShoppingItem = useMutation(
    api.shoppingLists.updateMealPlanLeftoverShoppingItem,
  );
  const updateShoppingListSharing = useMutation(
    api.shoppingLists.updateShoppingListSharing,
  );

  const isFinalised = shoppingList.status === "active";
  const isOwner = shoppingList.isOwner === true;
  /** Authoritative value from server (Convex subscription). */
  const authoritativeSharingValue = useMemo(() => {
    if (shoppingList.householdId) {
      return `household:${shoppingList.householdId}`;
    }
    if (shoppingList.isPrivate === true) return "private";
    return "owner_only";
  }, [shoppingList.householdId, shoppingList.isPrivate]);

  const [pendingSharingValue, setPendingSharingValue] = useState<string | null>(
    null,
  );
  const [sharingMutationPending, setSharingMutationPending] = useState(false);

  useEffect(() => {
    setPendingSharingValue(null);
  }, [authoritativeSharingValue, shoppingList._id]);

  const sharingSelectValue = pendingSharingValue ?? authoritativeSharingValue;
  const ingredientIds = useMemo(
    () =>
      shoppingList.items
        .map((i) => i.ingredientId)
        .filter((id): id is Id<"ingredients"> => id != null),
    [shoppingList.items],
  );
  const ingredientsMap = useQuery(
    api.ingredients.getByIds,
    ingredientIds.length > 0 ? { ids: ingredientIds } : "skip",
  );
  const currentUser = useQuery(api.users.current);
  const canControlServings = canUseServingControl(
    currentUser?.subscriptionTier,
  );
  const isDev =
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_SHOW_RECIPE_LINKS === "true";
  /** Canonical name from ingredients table when resolved; otherwise original from recipe. */
  const getDisplayName = (item: (typeof shoppingList.items)[number]) => {
    if (item.ingredientId && ingredientsMap?.[item.ingredientId]) {
      const ing = ingredientsMap[item.ingredientId];
      return ing.displayName ?? ing.name ?? item.name;
    }
    return item.name;
  };
  /** Stable key for de-duplication (chalkboard vs list); uses canonical ingredient name when resolved. */
  const getCanonicalKey = (item: (typeof shoppingList.items)[number]) => {
    if (item.ingredientId && ingredientsMap?.[item.ingredientId]) {
      const ing = ingredientsMap[item.ingredientId];
      return (ing.name ?? ing.displayName ?? item.name).trim().toLowerCase();
    }
    return (item.name ?? "").trim().toLowerCase();
  };
  /** Original ingredient name from the recipe (for dev-mode brackets). */
  const getOriginalRecipeName = (item: (typeof shoppingList.items)[number]) =>
    item.name;
  const getCategory = (item: (typeof shoppingList.items)[number]) => {
    const ing = item.ingredientId
      ? ingredientsMap?.[item.ingredientId]
      : undefined;
    const foodGroup = ing?.foodGroup ?? undefined;
    const foodSubGroup = ing?.foodSubGroup ?? undefined;
    return getAisleForFoodGroupAndSubGroup(foodGroup, foodSubGroup);
  };
  const getAmountLines = (item: (typeof shoppingList.items)[number]) =>
    amountLinesFromEntries(normalizedAmountEntries(item));
  const renderChalkboardBadge = (
    item: ShoppingListItem,
    options?: { className?: string },
  ) =>
    item.addedFromChalkboard ? (
      <Badge
        variant="secondary"
        className={cn("text-[10px] leading-4", options?.className)}
      >
        Chalkboard item
      </Badge>
    ) : null;
  const { mainShoppingItems, pantryStapleItems, mealPlanLeftoverItems } =
    useMemo(() => {
      const staple = (item: ShoppingListItem) =>
        !item.addedFromChalkboard && isPantryStaple(getCanonicalKey(item));
      const main: ShoppingListItem[] = [];
      const pantry: ShoppingListItem[] = [];
      const leftover: ShoppingListItem[] = [];
      for (const item of shoppingList.items) {
        if (item.mealPlanLeftoverIngredientId) {
          leftover.push(item);
          continue;
        }
        (staple(item) ? pantry : main).push(item);
      }
      const cmp = (a: ShoppingListItem, b: ShoppingListItem) =>
        getDisplayName(a).localeCompare(getDisplayName(b), undefined, {
          sensitivity: "base",
        });
      main.sort(cmp);
      pantry.sort(cmp);
      leftover.sort(cmp);
      return {
        mainShoppingItems: main,
        pantryStapleItems: pantry,
        mealPlanLeftoverItems: leftover,
      };
    }, [shoppingList.items, ingredientsMap]);

  const ingredientsByCategory = useMemo(() => {
    const cmp = (a: ShoppingListItem, b: ShoppingListItem) =>
      getDisplayName(a).localeCompare(getDisplayName(b), undefined, {
        sensitivity: "base",
      });
    const source = isFinalised
      ? [...shoppingList.items].sort(cmp)
      : mainShoppingItems;
    const groups = new Map<string, ShoppingListItem[]>();
    for (const item of source) {
      const cat = getCategory(item);
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(item);
    }
    const orderIdx = (cat: string) => {
      const i = AISLE_ORDER.indexOf(cat as (typeof AISLE_ORDER)[number]);
      return i >= 0 ? i : AISLE_ORDER.length;
    };
    const sortedCategories = [...groups.keys()].sort(
      (a, b) => orderIdx(a) - orderIdx(b),
    );
    return sortedCategories.map((cat) => ({
      category: cat,
      items: groups.get(cat)!,
    }));
  }, [isFinalised, mainShoppingItems, shoppingList.items, ingredientsMap]);

  const pantryIdsKey = useMemo(
    () => pantryStapleItems.map((i) => i._id).join(","),
    [pantryStapleItems],
  );
  useEffect(() => {
    const validIds = new Set(
      pantryIdsKey
        ? (pantryIdsKey.split(",") as Id<"shoppingListItems">[])
        : [],
    );
    setPantryIncludedIds((prev) => {
      const next = new Set<Id<"shoppingListItems">>();
      for (const id of prev) {
        if (validIds.has(id)) next.add(id);
      }
      return next;
    });
  }, [pantryIdsKey]);

  const leftoverIdsKey = useMemo(
    () => mealPlanLeftoverItems.map((i) => i._id).join(","),
    [mealPlanLeftoverItems],
  );
  useEffect(() => {
    const validIds = new Set(
      leftoverIdsKey
        ? (leftoverIdsKey.split(",") as Id<"shoppingListItems">[])
        : [],
    );
    setLeftoverExcludedFromTripIds((prev) => {
      const next = new Set<Id<"shoppingListItems">>();
      for (const id of prev) {
        if (validIds.has(id)) next.add(id);
      }
      return next;
    });
  }, [leftoverIdsKey]);

  const prevFinalisedRef = useRef(isFinalised);
  useEffect(() => {
    if (!isFinalised && prevFinalisedRef.current === true) {
      if (pantryIdsKey) {
        setPantryIncludedIds(
          new Set(pantryIdsKey.split(",") as Id<"shoppingListItems">[]),
        );
      }
      if (leftoverIdsKey) {
        setLeftoverExcludedFromTripIds(new Set());
      }
    }
    prevFinalisedRef.current = isFinalised;
  }, [isFinalised, pantryIdsKey, leftoverIdsKey]);

  const leftoverTripCount = mealPlanLeftoverItems.filter(
    (i) => !leftoverExcludedFromTripIds.has(i._id),
  ).length;
  const draftTripItemCount =
    mainShoppingItems.length + pantryIncludedIds.size + leftoverTripCount;

  // Get chalkboard data
  const households = useQuery(api.households.getUserHouseholds);
  const personalChalkboard = useQuery(api.chalkboard.getPersonalChalkboard);
  const allHouseholdChalkboards = useQuery(
    api.chalkboard.getAllHouseholdChalkboards,
  );

  // Auto-select all households by default
  useEffect(() => {
    if (
      households &&
      households.length > 0 &&
      selectedHouseholdIds.size === 0
    ) {
      setSelectedHouseholdIds(new Set(households.map((h) => h._id)));
    }
  }, [households, selectedHouseholdIds]);

  const toggleHousehold = (householdId: Id<"households">) => {
    setSelectedHouseholdIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(householdId)) {
        newSet.delete(householdId);
      } else {
        newSet.add(householdId);
      }
      return newSet;
    });
  };

  // Calculate available items (excluding those already added to shopping list)
  const getAvailableChalkboardCount = () => {
    let count = 0;

    // Count personal items not yet added
    if (personalChalkboard) {
      count += personalChalkboard.filter(
        (item) =>
          !shoppingList.items.some((ing) =>
            namesEqual(getCanonicalKey(ing), item.text),
          ),
      ).length;
    }

    // Count household items not yet added
    if (allHouseholdChalkboards) {
      Object.values(allHouseholdChalkboards).forEach((items) => {
        count += items.filter(
          (item) =>
            !shoppingList.items.some((ing) =>
              namesEqual(getCanonicalKey(ing), item.text),
            ),
        ).length;
      });
    }

    return count;
  };

  const availableChalkboardItemsCount = getAvailableChalkboardCount();

  const commitItemAmount = useCallback(
    async (itemId: Id<"shoppingListItems">, amount: number | string | null) => {
      try {
        await updateItemAmount({ itemId, amount });
      } catch (error) {
        console.error("Failed to update amount:", error);
        toast.error("Failed to update amount");
      }
    },
    [updateItemAmount],
  );

  const handleAmountChange = (
    itemId: Id<"shoppingListItems">,
    newAmount: number,
  ) => {
    void commitItemAmount(itemId, Math.max(0, newAmount));
  };

  const applyLeftoverPreset = useCallback(
    async (item: ShoppingListItem, scale: number) => {
      if (
        item.mealPlanLeftoverIngredientId !== undefined &&
        item.leftoverBaseline !== undefined
      ) {
        try {
          if (scale >= 1) {
            await updateMealPlanLeftoverShoppingItem({
              itemId: item._id,
              mode: "full",
            });
          } else {
            await updateMealPlanLeftoverShoppingItem({
              itemId: item._id,
              mode: "reduced",
              reducedScale: Math.max(0, scale),
            });
          }
        } catch (error) {
          console.error("Failed to apply leftover preset:", error);
          toast.error("Failed to update amount");
        }
        return;
      }
      const current = finiteNumberOrNull(item.amount) ?? 0;
      void commitItemAmount(item._id, Math.max(0, current * scale));
    },
    [commitItemAmount, updateMealPlanLeftoverShoppingItem],
  );

  const applyManualLeftoverAmount = useCallback(
    async (
      item: ShoppingListItem,
      nextAmount: number | string | null,
      baselineAmount: number | null,
    ) => {
      const fallbackToDirectAmount = async () => {
        await commitItemAmount(item._id, nextAmount);
      };

      if (
        item.mealPlanLeftoverIngredientId === undefined ||
        item.leftoverBaseline === undefined
      ) {
        await fallbackToDirectAmount();
        return;
      }

      const numericNext = finiteNumberOrNull(nextAmount);
      if (numericNext == null) {
        await fallbackToDirectAmount();
        return;
      }

      try {
        if (baselineAmount != null && baselineAmount > 0) {
          const scale = Math.max(0, numericNext / baselineAmount);
          if (Math.abs(scale - 1) < 1e-6) {
            await updateMealPlanLeftoverShoppingItem({
              itemId: item._id,
              mode: "full",
            });
          } else {
            await updateMealPlanLeftoverShoppingItem({
              itemId: item._id,
              mode: "reduced",
              reducedScale: scale,
            });
          }
          return;
        }

        if (baselineAmount === 0 && numericNext === 0) {
          await updateMealPlanLeftoverShoppingItem({
            itemId: item._id,
            mode: "reduced",
            reducedScale: 0,
          });
          return;
        }

        await fallbackToDirectAmount();
      } catch (error) {
        console.error("Failed to apply leftover manual amount:", error);
        toast.error("Failed to update amount");
      }
    },
    [commitItemAmount, updateMealPlanLeftoverShoppingItem],
  );

  const handleRemoveItem = async (itemId: Id<"shoppingListItems">) => {
    try {
      await removeItem({ itemId });
    } catch (error) {
      console.error("Failed to remove item:", error);
      toast.error("Failed to remove item");
    }
  };

  const handleCheckItem = async (itemId: Id<"shoppingListItems">) => {
    try {
      await toggleItemChecked({ itemId });
    } catch (error) {
      console.error("Failed to check item:", error);
      toast.error("Failed to update item");
    }
  };

  const handlePantryAddAll = () => {
    setPantryIncludedIds(new Set(pantryStapleItems.map((i) => i._id)));
  };

  const handlePantryClearSelection = () => {
    setPantryIncludedIds(new Set());
  };

  const handleConfirmWithPantryTrim = async () => {
    if (isConfirming) return;
    const toRemove = [
      ...pantryStapleItems.filter((i) => !pantryIncludedIds.has(i._id)),
      ...mealPlanLeftoverItems.filter((i) =>
        leftoverExcludedFromTripIds.has(i._id),
      ),
    ];
    setIsConfirming(true);
    try {
      await trimDraftItemsAndFinaliseShoppingList({
        listId: shoppingList._id,
        itemIdsToRemove: toRemove.map((item) => item._id),
      });
      await Promise.resolve(onConfirm());
    } catch (error) {
      console.error("Failed to confirm shopping list:", error);
      const message =
        error instanceof ConvexError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to confirm shopping list";
      toast.error(message);
    } finally {
      setIsConfirming(false);
    }
  };

  useEffect(() => {
    setDraftTargetServings(shoppingList.targetServings ?? TARGET_SERVINGS_MIN);
  }, [shoppingList._id, shoppingList.targetServings]);

  const applyDraftTargetServings = useCallback(
    async (nextValue: number) => {
      const previousValue = draftTargetServings;
      const clamped = Math.max(
        TARGET_SERVINGS_MIN,
        Math.min(TARGET_SERVINGS_MAX, Math.round(nextValue)),
      );
      setDraftTargetServings(clamped);
      setIsUpdatingTargetServings(true);
      try {
        await updateDraftShoppingListTargetServings({
          listId: shoppingList._id,
          targetServings: clamped,
        });
      } catch (error) {
        setDraftTargetServings(previousValue);
        toast.error(
          error instanceof Error ? error.message : "Failed to update servings",
        );
      } finally {
        setIsUpdatingTargetServings(false);
      }
    },
    [
      draftTargetServings,
      shoppingList._id,
      updateDraftShoppingListTargetServings,
    ],
  );

  const handleAddFromChalkboard = async () => {
    const itemsToAdd: Array<{
      chalkboardItemId: Id<"chalkboardItems">;
      name: string;
    }> = [];

    // Add personal chalkboard items if enabled
    if (
      includePersonal &&
      personalChalkboard &&
      personalChalkboard.length > 0
    ) {
      personalChalkboard.forEach((item) => {
        // Only add if not already in shopping list
        const alreadyAdded = shoppingList.items.some((ing) =>
          namesEqual(getCanonicalKey(ing), item.text),
        );
        if (!alreadyAdded) {
          itemsToAdd.push({
            chalkboardItemId: item._id,
            name: item.text,
          });
        }
      });
    }

    // Add household chalkboard items for selected households
    if (allHouseholdChalkboards) {
      selectedHouseholdIds.forEach((householdId) => {
        const householdItems = allHouseholdChalkboards[householdId];
        if (householdItems && householdItems.length > 0) {
          householdItems.forEach((item) => {
            // Only add if not already in shopping list
            const alreadyAdded = shoppingList.items.some((ing) =>
              namesEqual(getCanonicalKey(ing), item.text),
            );
            if (!alreadyAdded) {
              itemsToAdd.push({
                chalkboardItemId: item._id as Id<"chalkboardItems">,
                name: item.text,
              });
            }
          });
        }
      });
    }

    if (itemsToAdd.length === 0) {
      toast.info("All items have already been added to your shopping list");
      setShowChalkboardDialog(false);
      return;
    }

    try {
      // Add to shopping list in database
      await addChalkboardItems({
        listId: shoppingList._id,
        items: itemsToAdd,
      });

      // Track which items to delete later
      setSelectedChalkboardItems((prev) => {
        const next = new Set(prev);
        itemsToAdd.forEach((item) => next.add(item.chalkboardItemId));
        return next;
      });

      // Close dialog
      setShowChalkboardDialog(false);

      toast.success(
        `Added ${itemsToAdd.length} item${itemsToAdd.length > 1 ? "s" : ""} from chalkboard`,
      );
    } catch (error) {
      console.error("Failed to add chalkboard items:", error);
      toast.error("Failed to add items from chalkboard");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const formatShareLine = (item: ShoppingListItem) => {
      const checked = item.checked ? "✓ " : "";
      const amtLines = getAmountLines(item);
      const amtStr = amtLines.length > 0 ? amtLines.join(", ") + " " : "";
      const showOriginalInDev =
        isDev && item.ingredientId && ingredientsMap?.[item.ingredientId];
      const nameStr =
        getDisplayName(item) +
        (showOriginalInDev ? ` (${getOriginalRecipeName(item)})` : "");
      return `${checked}• ${amtStr}${nameStr}`;
    };
    const lines = ingredientsByCategory.flatMap(({ category, items }) => [
      category,
      ...items.map((item) => formatShareLine(item)),
      "",
    ]);
    const listText = `Shopping List - ${new Date().toLocaleDateString()}\n\n${lines.join("\n")}`;

    // Check if Web Share API is available (primarily mobile)
    if (canShare) {
      await share("Shopping List", listText);
      toast.success("Shopping list shared successfully!");
    } else {
      // Fallback to clipboard
      await copyToClipboard(listText);
    }
  };

  return (
    <>
      {/* Print-only section */}
      <div className="hidden print:block">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-2">Shopping List</h1>
          <div className="space-y-4">
            {ingredientsByCategory.map(({ category, items }) => (
              <div key={category}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {category}
                </h2>
                <div className="space-y-1">
                  {items.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-start gap-3 py-2 border-b"
                    >
                      <div className="size-5 border-2 rounded shrink-0 mt-0.5">
                        {item.checked && (
                          <div className="size-full flex items-center justify-center">
                            ✓
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <span className={cn(item.checked && "line-through")}>
                          {getDisplayName(item)}
                          {isDev &&
                            item.ingredientId &&
                            ingredientsMap?.[item.ingredientId] && (
                              <> ({getOriginalRecipeName(item)})</>
                            )}
                        </span>
                        {renderChalkboardBadge(item, { className: "ml-2" })}
                        {getAmountLines(item).length > 0 && (
                          <span className="ml-2">
                            {getAmountLines(item).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {!isFinalised && mealPlanLeftoverItems.length > 0 ? (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Already have (meal plan)
                </h2>
                <div className="space-y-1">
                  {mealPlanLeftoverItems.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-start gap-3 py-2 border-b"
                    >
                      <div className="size-5 border-2 rounded shrink-0 mt-0.5">
                        {item.checked && (
                          <div className="size-full flex items-center justify-center">
                            ✓
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <span className={cn(item.checked && "line-through")}>
                          {getDisplayName(item)}
                        </span>
                        {renderChalkboardBadge(item, { className: "ml-2" })}
                        {getAmountLines(item).length > 0 && (
                          <span className="ml-2">
                            {getAmountLines(item).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {!isFinalised && pantryStapleItems.length > 0 ? (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Pantry staples
                </h2>
                <div className="space-y-1">
                  {pantryStapleItems.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-start gap-3 py-2 border-b"
                    >
                      <div className="size-5 border-2 rounded shrink-0 mt-0.5">
                        {item.checked && (
                          <div className="size-full flex items-center justify-center">
                            ✓
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <span className={cn(item.checked && "line-through")}>
                          {getDisplayName(item)}
                          {isDev &&
                            item.ingredientId &&
                            ingredientsMap?.[item.ingredientId] && (
                              <> ({getOriginalRecipeName(item)})</>
                            )}
                        </span>
                        {renderChalkboardBadge(item, { className: "ml-2" })}
                        {getAmountLines(item).length > 0 && (
                          <span className="ml-2">
                            {getAmountLines(item).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <p className="text-sm mt-8">
            Total items: {shoppingList.items.length}
          </p>
        </div>
      </div>

      {/* Screen view */}
      <div className="space-y-6 print:hidden">
        {/* Back/Edit Button */}
        {!isFinalised ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2 -ml-2"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="gap-2 -ml-2"
          >
            <ArrowLeft className="size-4" />
            Edit Shopping List
          </Button>
        )}

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="size-5 text-primary" />
                <h3 className="text-xl font-bold">
                  {isFinalised ? "Your Shopping List" : "Review Shopping List"}
                </h3>
              </div>
              <Badge variant="outline" className="text-sm">
                {isFinalised
                  ? `${shoppingList.items.length} items`
                  : `${draftTripItemCount} for this shop`}
              </Badge>
            </div>

            {isOwner ? (
              <div className="mb-6 space-y-2 rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Users className="size-4 shrink-0 text-muted-foreground" />
                  Who can see this list in the app?
                </div>
                <Select
                  value={sharingSelectValue}
                  onValueChange={async (v) => {
                    setPendingSharingValue(v);
                    setSharingMutationPending(true);
                    try {
                      if (v === "private") {
                        await updateShoppingListSharing({
                          listId: shoppingList._id,
                          visibility: "private",
                        });
                        toast.success("Only you can open this list in the app");
                        return;
                      }
                      if (v === "owner_only") {
                        await updateShoppingListSharing({
                          listId: shoppingList._id,
                          visibility: "owner_only",
                        });
                        toast.success(
                          "Household sharing removed from this list",
                        );
                        return;
                      }
                      const prefix = "household:";
                      if (!v.startsWith(prefix)) return;
                      const hid = v.slice(prefix.length) as Id<"households">;
                      await updateShoppingListSharing({
                        listId: shoppingList._id,
                        visibility: "household",
                        householdId: hid,
                      });
                      toast.success("List shared with your household");
                    } catch (err) {
                      setPendingSharingValue(null);
                      toast.error(
                        err instanceof Error
                          ? err.message
                          : "Could not update sharing",
                      );
                    } finally {
                      setSharingMutationPending(false);
                    }
                  }}
                  disabled={sharingMutationPending}
                >
                  <SelectTrigger
                    className="w-full max-w-md"
                    disabled={sharingMutationPending}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="private"
                      disabled={shoppingList.mealPlanId !== undefined}
                    >
                      Only me
                    </SelectItem>
                    <SelectItem value="owner_only">
                      Not shared via household
                    </SelectItem>
                    {sharingHouseholds.map((h) => (
                      <SelectItem key={h._id} value={`household:${h._id}`}>
                        Household: {h.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {shoppingList.mealPlanId ? (
                  <p className="text-xs text-muted-foreground pt-1">
                    Linked to a meal plan: &quot;Only me&quot; isn&apos;t
                    available (the link must stay meaningful for the plan). Use
                    &quot;Not shared via household&quot; to stop household
                    visibility; people who can open the plan may still see this
                    list.
                  </p>
                ) : null}
              </div>
            ) : null}

            {/* Chalkboard section for non-finalized lists */}
            {!isFinalised && availableChalkboardItemsCount > 0 && (
              <div className="sticky top-[env(safe-area-inset-top)] mb-6 z-10 space-y-2">
                {shoppingList.chalkboardItemIds.length > 0 ? (
                  <p className="text-xs text-muted-foreground text-center px-1">
                    Chalkboard picks from when you created this list are already
                    in the list below. Use this to add any remaining chalkboard
                    items.
                  </p>
                ) : null}
                <Button
                  size="lg"
                  className="w-full shadow-lg"
                  onClick={() => setShowChalkboardDialog(true)}
                >
                  <Clipboard className="size-5" />
                  {shoppingList.chalkboardItemIds.length > 0
                    ? "Add more from kitchen chalkboard"
                    : "Add from kitchen chalkboard"}
                  <Badge
                    variant="secondary"
                    className="ml-1 bg-white/20 text-primary-foreground border-0 px-2.5 py-0.5"
                  >
                    {availableChalkboardItemsCount}
                  </Badge>
                </Button>
              </div>
            )}

            {/* Shopping guidance for finalized lists */}
            {isFinalised && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <ShoppingCart className="size-4" />
                  Ready to shop! Here&apos;s how to use your list:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="size-2 rounded-full bg-primary mt-2 shrink-0" />
                    <div>
                      <p className="font-medium">Use in the app</p>
                      <p className="text-muted-foreground">
                        Check off items as you shop. Your progress is saved
                        automatically.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="size-2 rounded-full bg-primary mt-2 shrink-0" />
                    <div>
                      <p className="font-medium">Print it out</p>
                      <p className="text-muted-foreground">
                        Get a clean, printer-friendly version to take to the
                        store.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="size-2 rounded-full bg-primary mt-2 shrink-0" />
                    <div>
                      <p className="font-medium">Share as text</p>
                      <p className="text-muted-foreground">
                        Send to family, save as a note, or share via text
                        message.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {!isFinalised ? (
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <Label>Servings for this list</Label>
                  <ServingsStepper
                    value={draftTargetServings}
                    onChange={(newValue) => {
                      if (!canControlServings) return;
                      void applyDraftTargetServings(newValue);
                    }}
                    disabled={isUpdatingTargetServings || !canControlServings}
                    min={TARGET_SERVINGS_MIN}
                    max={TARGET_SERVINGS_MAX}
                  />
                </div>
              ) : null}
              {!isFinalised && mealPlanLeftoverItems.length > 0 ? (
                <div
                  className={cn(
                    "space-y-4 rounded-lg border p-4",
                    "border-amber-500/35 bg-amber-500/5",
                  )}
                >
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Already have (from your meal plan)
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Weekly total is shown first for each ingredient. Set how
                      much to buy this trip with quick presets or manual edits.
                    </p>
                  </div>
                  <ul className="space-y-3">
                    {mealPlanLeftoverItems.map((item) => {
                      const excluded = leftoverExcludedFromTripIds.has(
                        item._id,
                      );
                      const { first, rest } = firstAmountEntryForItem(item);
                      const buyUnitLabel = (first.unit ?? "").trim();
                      const weeklyTotalEntries =
                        weeklyTotalEntriesForLeftoverItem(item);
                      const weeklyTotalSummary = weeklyTotalEntries
                        ? amountLinesFromEntries(weeklyTotalEntries)
                        : [];
                      const weeklyTotalFromBaseline = finiteNumberOrNull(
                        item.leftoverBaseline?.amount,
                      );
                      const weeklyTotalFromSingleEntry =
                        weeklyTotalEntries && weeklyTotalEntries.length === 1
                          ? finiteNumberOrNull(weeklyTotalEntries[0]?.amount)
                          : null;
                      const weeklyTotalNumeric =
                        weeklyTotalFromBaseline ?? weeklyTotalFromSingleEntry;
                      const presetBase = weeklyTotalNumeric;
                      const restSummary = rest
                        .map((e) => `${e.amount ?? ""} ${e.unit ?? ""}`.trim())
                        .filter(Boolean);
                      return (
                        <li
                          key={item._id}
                          className={cn(
                            "rounded-lg border p-3 transition-opacity",
                            excluded
                              ? "border-dashed border-border/80 bg-muted/15 opacity-80"
                              : "border-primary/35 bg-primary/5",
                          )}
                        >
                          <div className="flex flex-col gap-3">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <label className="flex cursor-pointer items-start gap-2 min-w-0">
                                <Checkbox
                                  checked={!excluded}
                                  onCheckedChange={(v) => {
                                    setLeftoverExcludedFromTripIds((prev) => {
                                      const next = new Set(prev);
                                      if (v === true) next.delete(item._id);
                                      else next.add(item._id);
                                      return next;
                                    });
                                  }}
                                  className="size-4 mt-0.5 shrink-0"
                                />
                                <span className="text-sm font-medium capitalize leading-snug">
                                  {getDisplayName(item)}
                                  {isDev &&
                                    item.ingredientId &&
                                    ingredientsMap?.[item.ingredientId] && (
                                      <span className="text-muted-foreground font-normal normal-case">
                                        {" "}
                                        ({getOriginalRecipeName(item)})
                                      </span>
                                    )}
                                </span>
                                {renderChalkboardBadge(item)}
                              </label>
                              <p className="text-xs text-muted-foreground shrink-0">
                                Weekly total:{" "}
                                <span className="font-medium text-foreground">
                                  {weeklyTotalEntries &&
                                  weeklyTotalSummary.length > 0
                                    ? weeklyTotalSummary.join(" + ")
                                    : "Unavailable"}
                                </span>
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                Buy this trip:
                              </span>
                              {typeof first.amount === "number" ? (
                                <LeftoverNumericAmountInput
                                  itemId={item._id}
                                  amount={first.amount}
                                  disabled={excluded}
                                  onCommit={(_itemId, newAmount) => {
                                    void applyManualLeftoverAmount(
                                      item,
                                      Math.max(0, newAmount),
                                      presetBase,
                                    );
                                  }}
                                />
                              ) : (
                                <Input
                                  key={`${item._id}-${String(first.amount)}`}
                                  type="text"
                                  className="h-8 min-w-20 max-w-40 font-medium"
                                  defaultValue={
                                    first.amount != null
                                      ? String(first.amount)
                                      : ""
                                  }
                                  disabled={excluded}
                                  onBlur={(e) => {
                                    const v = e.target.value.trim();
                                    void applyManualLeftoverAmount(
                                      item,
                                      v === "" ? 0 : v,
                                      presetBase,
                                    );
                                  }}
                                />
                              )}
                              {buyUnitLabel ? (
                                <span className="text-sm text-muted-foreground shrink-0">
                                  {buyUnitLabel}
                                </span>
                              ) : null}
                              {weeklyTotalEntries && presetBase != null ? (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    disabled={excluded}
                                    onClick={() =>
                                      void applyLeftoverPreset(item, 0)
                                    }
                                  >
                                    0%
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    disabled={excluded}
                                    onClick={() =>
                                      void applyLeftoverPreset(item, 0.5)
                                    }
                                  >
                                    50%
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    disabled={excluded}
                                    onClick={() =>
                                      void applyLeftoverPreset(item, 1)
                                    }
                                  >
                                    100%
                                  </Button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                          {restSummary.length > 0 ? (
                            <p className="text-[11px] text-muted-foreground mt-2 pl-6 sm:pl-0">
                              Extra split amounts on this row:{" "}
                              {restSummary.join(" · ")}
                            </p>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
              {ingredientsByCategory.map(({ category, items }) => (
                <div key={category}>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <ShoppingListScreenItemRow
                        key={item._id}
                        item={item}
                        isFinalised={isFinalised}
                        isDev={isDev}
                        ingredientsMap={ingredientsMap}
                        getDisplayName={getDisplayName}
                        getOriginalRecipeName={getOriginalRecipeName}
                        onAmountChange={handleAmountChange}
                        onRemove={handleRemoveItem}
                        onToggleChecked={handleCheckItem}
                        renderChalkboardBadge={renderChalkboardBadge}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {!isFinalised && pantryStapleItems.length > 0 ? (
                <div className="border-t border-border pt-6 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Pantry staples
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Unchecked items are removed when you confirm. Check what
                        you need, or use Add all.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handlePantryAddAll}
                        disabled={
                          pantryIncludedIds.size === pantryStapleItems.length
                        }
                      >
                        Add all
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handlePantryClearSelection}
                        disabled={pantryIncludedIds.size === 0}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {pantryStapleItems.map((item) => {
                      const amtSummary = getAmountLines(item).join(" · ");
                      const includedDraft = pantryIncludedIds.has(item._id);
                      return (
                        <label
                          key={item._id}
                          className={cn(
                            "flex items-start gap-2 rounded-lg border p-3 cursor-pointer transition-colors",
                            includedDraft
                              ? "border-primary/45 bg-primary/5"
                              : "border-dashed border-border/80 bg-muted/20 hover:bg-muted/35",
                          )}
                        >
                          <Checkbox
                            checked={includedDraft}
                            onCheckedChange={(v) => {
                              setPantryIncludedIds((prev) => {
                                const next = new Set(prev);
                                if (v === true) next.add(item._id);
                                else next.delete(item._id);
                                return next;
                              });
                            }}
                            className="size-4 mt-0.5 shrink-0"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="text-sm font-medium block leading-snug capitalize">
                              {getDisplayName(item)}
                              {isDev &&
                                item.ingredientId &&
                                ingredientsMap?.[item.ingredientId] && (
                                  <span className="text-muted-foreground font-normal normal-case">
                                    {" "}
                                    ({getOriginalRecipeName(item)})
                                  </span>
                                )}
                            </span>
                            {renderChalkboardBadge(item)}
                            {amtSummary ? (
                              <span className="text-xs text-muted-foreground mt-1 block">
                                {amtSummary}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            {shoppingList.items.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  All items removed. Use the button above to leave or edit this
                  list.
                </p>
              </div>
            )}

            {!isFinalised &&
              shoppingList.items.length > 0 &&
              draftTripItemCount === 0 && (
                <div className="text-center py-6 rounded-lg border border-dashed bg-muted/20">
                  <p className="text-sm text-muted-foreground px-4">
                    Nothing selected for this shop yet. Include items from your
                    list, your &quot;already have&quot; lines, or pantry staples
                    above.
                  </p>
                </div>
              )}

            <Separator className="my-6" />

            {/* Action Buttons */}
            {isFinalised ? (
              // Final state: Print, Share, Done
              <div className="flex gap-2 flex-wrap sticky bottom-nav">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handlePrint}
                >
                  <Printer className="size-4 mr-2" />
                  Print List
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleShare}
                >
                  <Share2 className="size-4 mr-2" />
                  Share
                </Button>
                <Button className="w-full sm:w-auto sm:flex-1" onClick={onDone}>
                  <Check className="size-4 mr-2" />
                  Done Shopping
                </Button>
              </div>
            ) : (
              // Editing state: Confirm/Save
              <div className="flex gap-2 sticky bottom-nav">
                <Button variant="outline" className="flex-1" onClick={onBack}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleConfirmWithPantryTrim}
                  disabled={draftTripItemCount === 0 || isConfirming}
                >
                  <Check className="size-4 mr-2" />
                  {isConfirming ? "Confirming…" : "Confirm Shopping List"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chalkboard Dialog */}
      <Dialog
        open={showChalkboardDialog}
        onOpenChange={setShowChalkboardDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {shoppingList.chalkboardItemIds.length > 0
                ? "Add more from kitchen chalkboard"
                : "Add from kitchen chalkboard"}
            </DialogTitle>
            <DialogDescription>
              Choose chalkboards to pull items from. Each line is added to this
              list and removed from the chalkboard when you confirm the list.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Personal Chalkboard Toggle */}
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1">
                <Label
                  htmlFor="personal-toggle"
                  className="text-base font-medium"
                >
                  Personal Chalkboard
                </Label>
                <p className="text-sm text-muted-foreground">
                  {(() => {
                    const availableItems = personalChalkboard?.filter(
                      (item) =>
                        !shoppingList.items.some((ing) =>
                          namesEqual(getCanonicalKey(ing), item.text),
                        ),
                    );
                    const count = availableItems?.length || 0;
                    return count > 0
                      ? `${count} item${count > 1 ? "s" : ""}`
                      : "No items";
                  })()}
                </p>
              </div>
              <Switch
                id="personal-toggle"
                checked={includePersonal}
                onCheckedChange={setIncludePersonal}
                disabled={
                  !personalChalkboard ||
                  personalChalkboard.filter(
                    (item) =>
                      !shoppingList.items.some((ing) =>
                        namesEqual(getCanonicalKey(ing), item.text),
                      ),
                  ).length === 0
                }
              />
            </div>

            {/* Household Chalkboard Toggles */}
            {households && households.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <Label className="text-sm font-medium">
                    Household Chalkboards
                  </Label>
                  {households.map((household) => {
                    const householdItems =
                      allHouseholdChalkboards?.[household._id] || [];
                    const availableItems = householdItems.filter(
                      (item) =>
                        !shoppingList.items.some((ing) =>
                          namesEqual(getCanonicalKey(ing), item.text),
                        ),
                    );
                    const isSelected = selectedHouseholdIds.has(household._id);
                    return (
                      <div
                        key={household._id}
                        className="flex items-center justify-between space-x-4"
                      >
                        <div className="flex-1">
                          <Label
                            htmlFor={`household-toggle-${household._id}`}
                            className="text-base font-medium"
                          >
                            {household.name}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {availableItems.length > 0
                              ? `${availableItems.length} item${availableItems.length > 1 ? "s" : ""}`
                              : "No items"}
                          </p>
                        </div>
                        <Switch
                          id={`household-toggle-${household._id}`}
                          checked={isSelected}
                          onCheckedChange={() => toggleHousehold(household._id)}
                          disabled={availableItems.length === 0}
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Preview of what will be added */}
            {(() => {
              // Calculate items to preview (only items not already added)
              const previewItems: Array<{
                id: Id<"chalkboardItems">;
                text: string;
              }> = [];

              if (includePersonal && personalChalkboard) {
                personalChalkboard.forEach((item) => {
                  if (
                    !shoppingList.items.some((ing) =>
                      namesEqual(getCanonicalKey(ing), item.text),
                    )
                  ) {
                    previewItems.push({ id: item._id, text: item.text });
                  }
                });
              }

              if (allHouseholdChalkboards) {
                Array.from(selectedHouseholdIds).forEach((householdId) => {
                  const householdItems =
                    allHouseholdChalkboards?.[householdId] || [];
                  householdItems?.forEach((item) => {
                    if (
                      !shoppingList.items.some((ing) =>
                        namesEqual(getCanonicalKey(ing), item.text),
                      )
                    ) {
                      previewItems.push({ id: item._id, text: item.text });
                    }
                  });
                });
              }

              return previewItems.length > 0 ? (
                <>
                  <Separator />
                  <div className="border rounded-lg p-3 bg-muted/30">
                    <p className="text-sm font-medium mb-2">
                      Items to be added ({previewItems.length}):
                    </p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {previewItems.map((item) => (
                        <p
                          key={item.id}
                          className="text-sm text-muted-foreground"
                        >
                          • {item.text}
                        </p>
                      ))}
                    </div>
                  </div>
                </>
              ) : null;
            })()}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowChalkboardDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddFromChalkboard}>Add to List</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ShoppingListScreenItemRow({
  item,
  isFinalised,
  isDev,
  ingredientsMap,
  getDisplayName,
  getOriginalRecipeName,
  onAmountChange,
  onRemove,
  onToggleChecked,
  renderChalkboardBadge,
}: {
  item: ShoppingListItem;
  isFinalised: boolean;
  isDev: boolean;
  ingredientsMap: Record<Id<"ingredients">, Doc<"ingredients">> | undefined;
  getDisplayName: (item: ShoppingListItem) => string;
  getOriginalRecipeName: (item: ShoppingListItem) => string;
  onAmountChange: (itemId: Id<"shoppingListItems">, newAmount: number) => void;
  onRemove: (itemId: Id<"shoppingListItems">) => void;
  onToggleChecked: (itemId: Id<"shoppingListItems">) => void;
  renderChalkboardBadge: (
    item: ShoppingListItem,
    options?: { className?: string },
  ) => React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-all",
        isFinalised && item.checked
          ? "bg-muted/50 opacity-60"
          : "hover:bg-muted/30 hover:border-primary/30",
      )}
    >
      {isFinalised && (
        <Checkbox
          checked={item.checked}
          onCheckedChange={() => onToggleChecked(item._id)}
          className="size-5"
        />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <p
            className={cn(
              "font-medium capitalize",
              isFinalised && item.checked && "line-through",
            )}
          >
            {getDisplayName(item)}
            {isDev &&
              item.ingredientId &&
              ingredientsMap?.[item.ingredientId] && (
                <span className="text-muted-foreground font-normal">
                  {" "}
                  ({getOriginalRecipeName(item)})
                </span>
              )}
          </p>
          {renderChalkboardBadge(item)}
        </div>

        {(() => {
          const entries =
            item.amountEntries && item.amountEntries.length > 0
              ? item.amountEntries
              : [
                  {
                    amount: item.amount,
                    unit: item.unit,
                  },
                ].filter(
                  (e) => e.amount != null || (e.unit != null && e.unit !== ""),
                );
          if (entries.length === 0) return null;
          if (entries.length > 1) {
            return (
              <div className="space-y-0.5">
                {entries.map((entry, i) => (
                  <p
                    key={i}
                    className="text-sm text-muted-foreground capitalize"
                  >
                    {entry.amount ?? ""} {entry.unit ?? ""}
                  </p>
                ))}
              </div>
            );
          }
          const single = entries[0]!;
          if (isFinalised) {
            return (
              <p className="text-sm text-muted-foreground capitalize">
                {single.amount ?? ""} {single.unit ?? ""}
              </p>
            );
          }
          const isNumeric =
            typeof single.amount === "number" && !isNaN(single.amount);
          return (
            <div className="flex items-center gap-1.5">
              {isNumeric ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      onAmountChange(item._id, (single.amount as number) - 1)
                    }
                    className="flex items-center justify-center size-6 rounded hover:bg-muted transition-colors"
                    aria-label="Decrease amount"
                  >
                    <Minus className="size-3.5 text-muted-foreground" />
                  </button>
                  <span className="min-w-8 text-center text-sm font-medium tabular-nums">
                    {single.amount}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onAmountChange(item._id, (single.amount as number) + 1)
                    }
                    className="flex items-center justify-center size-6 rounded hover:bg-muted transition-colors"
                    aria-label="Increase amount"
                  >
                    <Plus className="size-3.5 text-muted-foreground" />
                  </button>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {single.amount}
                </span>
              )}
              {single.unit && (
                <span className="text-sm text-muted-foreground ml-0.5">
                  {single.unit}
                </span>
              )}
            </div>
          );
        })()}
      </div>

      {!isFinalised && (
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onRemove(item._id)}
        >
          <X className="size-4" />
          <span className="sr-only">Remove {getDisplayName(item)}</span>
        </Button>
      )}
    </div>
  );
}
