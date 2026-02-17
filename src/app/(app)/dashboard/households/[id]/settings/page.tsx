"use client";

import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";

interface HouseholdSettingsPageProps {
  params: Promise<{
    id: Id<"households">;
  }>;
}

export default function HouseholdSettingsPage({
  params,
}: HouseholdSettingsPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const household = useQuery(api.households.getHousehold, { householdId: id });
  const [name, setName] = useState(household?.name ?? "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const updateHousehold = useMutation(api.households.updateHousehold);
  const deleteHousehold = useMutation(api.households.deleteHousehold);

  // Update local name when household data loads
  useEffect(() => {
    if (!household?.name) return;
    setName(household.name);
  }, [household?.name]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a household name");
      return;
    }

    if (name === household?.name) {
      toast.info("No changes to save");
      return;
    }

    setIsUpdating(true);
    try {
      await updateHousehold({
        householdId: id,
        name: name.trim(),
      });
      toast.success("Household updated successfully!");
    } catch (error) {
      console.error("Error updating household:", error);
      toast.error("Failed to update household");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteHousehold = async () => {
    setIsDeleting(true);
    try {
      await deleteHousehold({ householdId: id });
      toast.success("Household deleted successfully");
      router.push("/dashboard/households");
    } catch (error) {
      console.error("Error deleting household:", error);
      toast.error("Failed to delete household");
      setIsDeleting(false);
    }
  };

  if (household === undefined) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (household === null || !household.isOwner) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">
              {household === null
                ? "Household not found"
                : "Only the household owner can access settings"}
            </p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/households">
                <ArrowLeft className="mr-2 size-4" />
                Back to Households
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/households/${id}`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Household Settings
          </h1>
          <p className="text-muted-foreground mt-1">{household.name}</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>
              Update your household&apos;s basic information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateName} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Household Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Smith Family"
                  disabled={isUpdating}
                />
              </div>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions for this household
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Delete Household</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this household and remove all members
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Household</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{household.name}&quot;? This
              action cannot be undone. All members will be removed and shared
              recipes will be unshared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteHousehold}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Household"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
