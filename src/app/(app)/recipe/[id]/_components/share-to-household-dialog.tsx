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
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/posthog-client";
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
  const households = useQuery(
    api.households.getUserHouseholds,
    open ? {} : "skip",
  );
  const [selectedHouseholds, setSelectedHouseholds] = useState<
    Set<Id<"households">>
  >(new Set());
  const [isPending, setIsPending] = useState(false);

  const shareRecipe = useMutation(api.households.shareRecipeToHousehold);
  const unshareRecipe = useMutation(api.households.unshareRecipeFromHousehold);
  const householdsByRecipeId = useQuery(
    api.households.getHouseholdsByRecipeId,
    open ? { recipeId } : "skip",
  );

  const handleCheckboxChange = async (
    householdId: Id<"households">,
    isChecked: boolean,
  ) => {
    // Add to pending state
    setIsPending(true);

    let mutationSucceeded = false;
    try {
      if (isChecked) {
        await shareRecipe({ recipeId, householdId });
        toast.success("Recipe shared to household");
      } else {
        await unshareRecipe({ recipeId, householdId });
        toast.success("Recipe removed from household");
      }
      mutationSucceeded = true;
    } catch (error: unknown) {
      console.error("Error updating recipe share:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to share recipe",
      );
    } finally {
      setIsPending(false);
    }

    if (!mutationSucceeded) return;

    try {
      if (isChecked) {
        trackEvent(ANALYTICS_EVENTS.RECIPE_SHARED_TO_HOUSEHOLD, {
          recipe_title: recipeTitle,
          household_id: householdId,
          recipe_id: recipeId,
        });
      } else {
        trackEvent(ANALYTICS_EVENTS.RECIPE_UNSHARED_FROM_HOUSEHOLD, {
          recipe_title: recipeTitle,
          household_id: householdId,
          recipe_id: recipeId,
        });
      }
    } catch (analyticsError: unknown) {
      console.error("Recipe share analytics error:", analyticsError);
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
          <DialogTitle>Household access</DialogTitle>
          <DialogDescription>
            If you belong to only one household, this recipe is usually shared
            there automatically once it&apos;s saved as a complete recipe.
            Otherwise, choose below. Uncheck a household to stop sharing there.
          </DialogDescription>
          <p className="text-sm text-muted-foreground pt-1">
            &quot;{recipeTitle}&quot;
          </p>
        </DialogHeader>

        <div className="py-4">
          {!open ? null : households === undefined ? (
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
