"use client";

import { TEXT_LIMITS } from "convex/lib/constants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
  CircleQuestionMark,
  Clipboard,
  Home,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChalkboardItem } from "./types";

const MAX_TEXT_LENGTH = TEXT_LIMITS.CHALKBOARD_MAX_LENGTH;

export default function ChalkboardClient() {
  const [activeTab, setActiveTab] = useState<"personal" | "household">(
    "household",
  );
  const households = useQuery(api.households.getUserHouseholds);
  const personalItems = useQuery(api.chalkboard.getPersonalChalkboard);
  const [selectedHouseholdId, setSelectedHouseholdId] =
    useState<Id<"households"> | null>(null);

  const householdItems = useQuery(
    api.chalkboard.getHouseholdChalkboard,
    selectedHouseholdId ? { householdId: selectedHouseholdId } : "skip",
  );

  const [personalInputText, setPersonalInputText] = useState("");
  const [householdInputText, setHouseholdInputText] = useState("");
  const [showClearPersonalDialog, setShowClearPersonalDialog] = useState(false);
  const [showClearHouseholdDialog, setShowClearHouseholdDialog] =
    useState(false);

  const addPersonalItem = useMutation(api.chalkboard.addPersonalItem);
  const addHouseholdItem = useMutation(api.chalkboard.addHouseholdItem);
  const deletePersonalItem = useMutation(api.chalkboard.deletePersonalItem);
  const deleteHouseholdItem = useMutation(api.chalkboard.deleteHouseholdItem);
  const clearPersonalChalkboard = useMutation(
    api.chalkboard.clearPersonalChalkboard,
  );
  const clearHouseholdChalkboard = useMutation(
    api.chalkboard.clearHouseholdChalkboard,
  );

  useEffect(() => {
    if (!households?.length || selectedHouseholdId !== null) return;
    setSelectedHouseholdId(households[0]._id);
  }, [households, selectedHouseholdId]);

  const handleAddPersonalItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personalInputText.trim()) return;

    try {
      await addPersonalItem({ text: personalInputText });
      setPersonalInputText("");
      toast.success("Item added to your personal chalkboard");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add item",
      );
    }
  };

  const handleAddHouseholdItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!householdInputText.trim() || !selectedHouseholdId) return;

    try {
      await addHouseholdItem({
        text: householdInputText,
        householdId: selectedHouseholdId,
      });
      setHouseholdInputText("");
      toast.success("Item added to household chalkboard");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add item",
      );
    }
  };

  const handleDeletePersonalItem = async (itemId: Id<"chalkboardItems">) => {
    try {
      await deletePersonalItem({ itemId });
      toast.success("Item removed");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete item",
      );
    }
  };

  const handleDeleteHouseholdItem = async (itemId: Id<"chalkboardItems">) => {
    try {
      await deleteHouseholdItem({ itemId });
      toast.success("Item removed");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete item",
      );
    }
  };

  const handleClearPersonal = async () => {
    try {
      const result = await clearPersonalChalkboard();
      setShowClearPersonalDialog(false);
      toast.success(
        `Cleared ${result.deletedCount} items from personal chalkboard`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to clear chalkboard",
      );
    }
  };

  const handleClearHousehold = async () => {
    if (!selectedHouseholdId) return;

    try {
      const result = await clearHouseholdChalkboard({
        householdId: selectedHouseholdId,
      });
      setShowClearHouseholdDialog(false);
      toast.success(
        `Cleared ${result.deletedCount} items from household chalkboard`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to clear chalkboard",
      );
    }
  };

  const selectedHousehold = households?.find(
    (h) => h._id === selectedHouseholdId,
  );

  return (
    <>
      <div className="container mx-auto px-4 py-8 space-y-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Clipboard className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              Kitchen Chalkboard
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Quick notes and items you can add to shopping lists later
          </p>
        </div>

        {/* Info Banner */}
        <Alert variant="default">
          <CircleQuestionMark className="size-5 text-primary" />
          <AlertTitle>How the Chalkboard Works</AlertTitle>
          <AlertDescription>
            Add items here as you think of them throughout the week. When
            creating a shopping list, you can quickly add these items to it.
            Personal items are just for you, while household items are shared
            with everyone in your household.
          </AlertDescription>
        </Alert>

        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "personal" | "household")
          }
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="household">
              <Home className="size-4" />
              Household
              {householdItems && householdItems.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {householdItems.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="personal">
              <User className="size-4" />
              Personal
              {personalItems && personalItems.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {personalItems.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Household Tab */}
          <TabsContent value="household">
            {households && households.length === 0 ? (
              <EmptyHouseholdState />
            ) : (
              <>
                {households && households.length > 1 && (
                  <div className="mb-4">
                    <label className="text-sm font-medium mb-2 block">
                      Select Household
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {households.map((household) => (
                        <Button
                          key={household._id}
                          variant={
                            selectedHouseholdId === household._id
                              ? "default"
                              : "outline"
                          }
                          onClick={() => setSelectedHouseholdId(household._id)}
                          size="sm"
                        >
                          {household.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                {householdItems === undefined ? (
                  <LoadingState />
                ) : (
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold">
                            {selectedHousehold?.name ?? "Household"} Chalkboard
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Shared with all household members
                          </p>
                        </div>
                        {householdItems && householdItems.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowClearHouseholdDialog(true)}
                          >
                            Clear All
                          </Button>
                        )}
                      </div>

                      {/* Add Item Form */}
                      <form
                        onSubmit={handleAddHouseholdItem}
                        className="flex gap-2 mb-6"
                      >
                        <Input
                          placeholder="Add an item..."
                          value={householdInputText}
                          onChange={(e) =>
                            setHouseholdInputText(e.target.value)
                          }
                          maxLength={MAX_TEXT_LENGTH}
                          className="flex-1"
                        />
                        <Button
                          type="submit"
                          disabled={!householdInputText.trim()}
                        >
                          <Plus className="size-4 mr-2" />
                          Add
                        </Button>
                      </form>

                      <div className="text-xs text-muted-foreground mb-4">
                        {householdInputText.length}/{MAX_TEXT_LENGTH} characters
                      </div>

                      {/* Items List */}
                      <ChalkboardItemsList
                        items={householdItems ?? []}
                        onDelete={handleDeleteHouseholdItem}
                        emptyMessage="No items yet. Add your first item above!"
                      />
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Personal Tab */}
          <TabsContent value="personal">
            {personalItems === undefined ? (
              <LoadingState />
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold">
                        Your Personal Chalkboard
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Only you can see these items
                      </p>
                    </div>
                    {personalItems && personalItems.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowClearPersonalDialog(true)}
                      >
                        Clear All
                      </Button>
                    )}
                  </div>

                  {/* Add Item Form */}
                  <form
                    onSubmit={handleAddPersonalItem}
                    className="flex gap-2 mb-6"
                  >
                    <Input
                      placeholder="Add an item..."
                      value={personalInputText}
                      onChange={(e) => setPersonalInputText(e.target.value)}
                      maxLength={MAX_TEXT_LENGTH}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={!personalInputText.trim()}>
                      <Plus className="size-4 mr-2" />
                      Add
                    </Button>
                  </form>

                  <div className="text-xs text-muted-foreground mb-4">
                    {personalInputText.length}/{MAX_TEXT_LENGTH} characters
                  </div>

                  {/* Items List */}
                  <ChalkboardItemsList
                    items={personalItems ?? []}
                    onDelete={handleDeletePersonalItem}
                    emptyMessage="No items yet. Add your first item above!"
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Clear Personal Confirmation Dialog */}
      <AlertDialog
        open={showClearPersonalDialog}
        onOpenChange={setShowClearPersonalDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Personal Chalkboard?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all items from your personal chalkboard. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearPersonal}>
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Household Confirmation Dialog */}
      <AlertDialog
        open={showClearHouseholdDialog}
        onOpenChange={setShowClearHouseholdDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Household Chalkboard?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all items from the {selectedHousehold?.name}{" "}
              chalkboard for all members. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearHousehold}>
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ChalkboardItemsList({
  items,
  onDelete,
  emptyMessage,
}: {
  items: ChalkboardItem[];
  onDelete: (itemId: Id<"chalkboardItems">) => void;
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 mx-auto">
          <Clipboard className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item._id}
          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="font-medium">{item.text}</p>
            <p className="text-xs text-muted-foreground">
              Added by {item.addedByName} •{" "}
              {new Date(item._creationTime).toLocaleDateString()}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
            onClick={() => onDelete(item._id)}
          >
            <Trash2 className="size-4" />
            <span className="sr-only">Delete item</span>
          </Button>
        </div>
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyHouseholdState() {
  return (
    <Card>
      <CardContent className="p-12">
        <div className="text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6 mx-auto">
            <Home className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">
            No Households Yet
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            You need to be part of a household to use the household chalkboard.
            Create or join a household first.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
