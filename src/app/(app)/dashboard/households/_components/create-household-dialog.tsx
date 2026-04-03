"use client";

import { api } from "@/../convex/_generated/api";
import { Button } from "@/components/ui/button";
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
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/posthog-client";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface CreateHouseholdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateHouseholdDialog({
  open,
  onOpenChange,
}: CreateHouseholdDialogProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const createHousehold = useMutation(api.households.createHousehold);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a household name");
      return;
    }

    setIsLoading(true);

    try {
      const result = await createHousehold({ name: name.trim() });
      trackEvent(ANALYTICS_EVENTS.HOUSEHOLD_CREATED);
      toast.success("Household created successfully!");
      onOpenChange(false);
      setName("");
      router.push(`/dashboard/households/${result.householdId}`);
    } catch (error) {
      console.error("Error creating household:", error);
      toast.error("Failed to create household");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Household</DialogTitle>
            <DialogDescription>
              Create a new household to share recipes with family and friends.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="name">Household Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Smith Family"
              className="mt-2"
              disabled={isLoading}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Household"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
