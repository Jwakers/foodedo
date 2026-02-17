import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import useShare from "@/lib/hooks/use-share";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import {
  ArrowLeft,
  Check,
  Clipboard,
  Minus,
  Plus,
  Printer,
  Share2,
  ShoppingCart,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type ShoppingList = NonNullable<
  FunctionReturnType<typeof api.shoppingLists.getActiveShoppingList>
>;

function namesEqual(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

interface ShoppingListProps {
  shoppingList: ShoppingList;
  onConfirm: () => void;
  onBack: () => void;
  onDone: () => void;
  onEdit: () => void;
  setSelectedChalkboardItems: React.Dispatch<
    React.SetStateAction<Set<Id<"chalkboardItems">>>
  >;
}

export default function ShoppingList({
  shoppingList,
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

  // Mutations
  const toggleItemChecked = useMutation(api.shoppingLists.toggleItemChecked);
  const updateItemAmount = useMutation(api.shoppingLists.updateItemAmount);
  const removeItem = useMutation(api.shoppingLists.removeItem);
  const addChalkboardItems = useMutation(api.shoppingLists.addChalkboardItems);

  const isFinalised = shoppingList.status === "active";
  const allIngredients = shoppingList.items;

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
          !allIngredients.some((ing) => namesEqual(ing.name, item.text)),
      ).length;
    }

    // Count household items not yet added
    if (allHouseholdChalkboards) {
      Object.values(allHouseholdChalkboards).forEach((items) => {
        count += items.filter(
          (item) =>
            !allIngredients.some((ing) => namesEqual(ing.name, item.text)),
        ).length;
      });
    }

    return count;
  };

  const availableChalkboardItemsCount = getAvailableChalkboardCount();

  const handleAmountChange = async (
    itemId: Id<"shoppingListItems">,
    newAmount: number,
  ) => {
    try {
      await updateItemAmount({
        itemId,
        amount: Math.max(0, newAmount),
      });
    } catch (error) {
      console.error("Failed to update amount:", error);
      toast.error("Failed to update amount");
    }
  };

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
        const alreadyAdded = allIngredients.some((ing) =>
          namesEqual(ing.name, item.text),
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
            const alreadyAdded = allIngredients.some((ing) =>
              namesEqual(ing.name, item.text),
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
    // Create a formatted text version of the shopping list
    const listText = `Shopping List - ${new Date().toLocaleDateString()}\n\n${allIngredients
      .map((item) => {
        const checked = item.checked ? "✓ " : "";
        const amt = item.amount != null ? String(item.amount) : "";
        const unit = item.unit ? ` ${item.unit}` : "";
        const space = amt || unit ? " " : "";
        return `${checked}• ${amt}${unit}${space}${item.name}`;
      })
      .join("\n")}`;

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
          <div className="space-y-1">
            {allIngredients.map((item) => {
              return (
                <div
                  key={item._id}
                  className="flex items-start gap-3 py-2 border-b"
                >
                  <div className="w-5 h-5 border-2 rounded flex-shrink-0 mt-0.5">
                    {item.checked && (
                      <div className="w-full h-full flex items-center justify-center">
                        ✓
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <span className={cn(item.checked && "line-through")}>
                      {item.name}
                    </span>
                    <span className="ml-2">
                      {item.amount ?? ""} {item.unit ?? ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-sm mt-8">Total items: {allIngredients.length}</p>
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
            Back to Recipe Selection
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
                {allIngredients.length} items
              </Badge>
            </div>

            {/* Chalkboard section for non-finalized lists */}
            {!isFinalised && availableChalkboardItemsCount > 0 && (
              <div className="sticky top-4 mb-6 z-10">
                <Button
                  size="lg"
                  className="w-full shadow-lg"
                  onClick={() => setShowChalkboardDialog(true)}
                >
                  <Clipboard className="size-5" />
                  Add from Kitchen Chalkboard
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
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Use in the app</p>
                      <p className="text-muted-foreground">
                        Check off items as you shop. Your progress is saved
                        automatically.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Print it out</p>
                      <p className="text-muted-foreground">
                        Get a clean, printer-friendly version to take to the
                        store.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
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

            <div className="space-y-2">
              {allIngredients.map((item) => {
                return (
                  <div
                    key={item._id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all",
                      isFinalised && item.checked
                        ? "bg-muted/50 opacity-60"
                        : "hover:bg-muted/30 hover:border-primary/30",
                    )}
                  >
                    {/* Checkbox (only in finalized state) */}
                    {isFinalised && (
                      <Checkbox
                        checked={item.checked}
                        onCheckedChange={() => handleCheckItem(item._id)}
                        className="size-5"
                      />
                    )}

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p
                          className={cn(
                            "font-medium capitalize",
                            isFinalised && item.checked && "line-through",
                          )}
                        >
                          {item.name}
                        </p>
                      </div>

                      {/* Amount Display/Controls */}
                      {(item.amount !== undefined && item.amount !== null) ||
                      item.unit !== undefined ? (
                        isFinalised ? (
                          // Static display when finalized
                          <p className="text-sm text-muted-foreground capitalize">
                            {item.amount ?? ""} {item.unit ?? ""}
                          </p>
                        ) : (
                          // Editable controls before finalized
                          <div className="flex items-center gap-1.5">
                            {typeof item.amount === "number" &&
                            !isNaN(item.amount) ? (
                              <>
                                <button
                                  onClick={() =>
                                    handleAmountChange(
                                      item._id,
                                      (item.amount as number) - 1,
                                    )
                                  }
                                  className="flex items-center justify-center size-6 rounded hover:bg-muted transition-colors"
                                  aria-label="Decrease amount"
                                >
                                  <Minus className="size-3.5 text-muted-foreground" />
                                </button>
                                <span className="min-w-[2rem] text-center text-sm font-medium tabular-nums">
                                  {item.amount}
                                </span>
                                <button
                                  onClick={() =>
                                    handleAmountChange(
                                      item._id,
                                      (item.amount as number) + 1,
                                    )
                                  }
                                  className="flex items-center justify-center size-6 rounded hover:bg-muted transition-colors"
                                  aria-label="Increase amount"
                                >
                                  <Plus className="size-3.5 text-muted-foreground" />
                                </button>
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {item.amount}
                              </span>
                            )}
                            {item.unit && (
                              <span className="text-sm text-muted-foreground ml-0.5">
                                {item.unit}
                              </span>
                            )}
                          </div>
                        )
                      ) : null}
                    </div>

                    {/* Remove Button (only in editing state) */}
                    {!isFinalised && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveItem(item._id)}
                      >
                        <X className="size-4" />
                        <span className="sr-only">Remove {item.name}</span>
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {allIngredients.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  All items removed. Go back to select recipes again.
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
                  onClick={onConfirm}
                  disabled={allIngredients.length === 0}
                >
                  <Check className="size-4 mr-2" />
                  Confirm Shopping List
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
            <DialogTitle>Add from Kitchen Chalkboard</DialogTitle>
            <DialogDescription>
              Select which chalkboards to add to your shopping list. All items
              will be added and cleared from the chalkboard.
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
                        !allIngredients.some((ing) =>
                          namesEqual(ing.name, item.text),
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
                      !allIngredients.some((ing) =>
                        namesEqual(ing.name, item.text),
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
                        !allIngredients.some((ing) =>
                          namesEqual(ing.name, item.text),
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
                    !allIngredients.some((ing) =>
                      namesEqual(ing.name, item.text),
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
                      !allIngredients.some((ing) =>
                        namesEqual(ing.name, item.text),
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
