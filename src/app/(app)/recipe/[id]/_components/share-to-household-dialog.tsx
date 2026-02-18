"use client";

import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import { ROUTES } from "@/app/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery } from "convex/react";
import { Check, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ShareToHouseholdDialogProps {
  recipeId: Id<"recipes">;
  recipeTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareToHouseholdDialog({
  recipeId,
  recipeTitle,
  open,
  onOpenChange,
}: ShareToHouseholdDialogProps) {
  const households = useQuery(api.households.getUserHouseholds);
  const [selectedHouseholds, setSelectedHouseholds] = useState<
    Set<Id<"households">>
  >(new Set());
  const [isPending, setIsPending] = useState(false);

  const shareRecipe = useMutation(api.households.shareRecipeToHousehold);
  const unshareRecipe = useMutation(api.households.unshareRecipeFromHousehold);
  const householdsByRecipeId = useQuery(
    api.households.getHouseholdsByRecipeId,
    {
      recipeId,
    },
  );

  const handleCheckboxChange = async (
    householdId: Id<"households">,
    isChecked: boolean,
  ) => {
    // Add to pending state
    setIsPending(true);

    try {
      if (isChecked) {
        // Share recipe to household
        await shareRecipe({ recipeId, householdId });
        toast.success("Recipe shared to household");
      } else {
        // Unshare recipe from household
        await unshareRecipe({ recipeId, householdId });
        toast.success("Recipe removed from household");
      }
    } catch (error: unknown) {
      console.error("Error updating recipe share:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to share recipe",
      );
    } finally {
      // Remove from pending state
      setIsPending(false);
    }
  };

  useEffect(() => {
    if (open) return;
    setSelectedHouseholds(new Set());
    setIsPending(false);
  }, [open]);

  useEffect(() => {
    const householdsIds =
      householdsByRecipeId?.map((household) => household.householdId) ?? [];
    setSelectedHouseholds(new Set(householdsIds));
  }, [householdsByRecipeId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Recipe</DialogTitle>
          <DialogDescription>
            Share &quot;{recipeTitle}&quot; with your households
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {households === undefined ? (
            <div className="text-center text-muted-foreground py-8">
              Loading households...
            </div>
          ) : households.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">
                You don&apos;t have any households yet
              </p>
              <Link href={ROUTES.HOUSEHOLDS}>
                <Button variant="outline">Create a Household</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {households.map((household) => {
                return (
                  <Label
                    key={household._id}
                    htmlFor={household._id}
                    className={cn(
                      "w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors",
                      isPending
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer",
                    )}
                  >
                    <Checkbox
                      id={household._id}
                      checked={selectedHouseholds.has(household._id)}
                      disabled={isPending}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange(household._id, checked === true)
                      }
                    />
                    <div className="font-medium">{household.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {household.memberCount}{" "}
                      {household.memberCount === 1 ? "member" : "members"}
                    </div>
                    {isPending ? (
                      <div className="ml-auto text-sm text-muted-foreground">
                        Updating...
                      </div>
                    ) : (
                      selectedHouseholds.has(household._id) && (
                        <Check className="size-4 text-primary ml-auto" />
                      )
                    )}
                  </Label>
                );
              })}
            </div>
          )}
        </div>

        {households && households.length > 0 && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {isPending ? "Updating..." : "Close"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
