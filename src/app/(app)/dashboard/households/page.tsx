"use client";

import { api } from "@/../convex/_generated/api";
import { LimitIndicator } from "@/components/limit-indicator";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import useSubscription from "@/lib/hooks/use-subscription";
import { useQuery } from "convex/react";
import { Plus, Settings, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CreateHouseholdDialog } from "./_components/create-household-dialog";

export default function HouseholdsPage() {
  const households = useQuery(api.households.getUserHouseholds);
  const subscription = useSubscription();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  if (households === undefined) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Households</h1>
          <p className="text-muted-foreground mt-1">
            Share recipes with your family and friends
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 size-4" />
            Create Household
          </Button>
        </div>
      </div>

      <div className="flex justify-end my-4">
        <LimitIndicator
          current={households?.length ?? 0}
          max={subscription?.maxHouseholds ?? 0}
          label="households"
        />
      </div>

      {households.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No households yet</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Create a household to start sharing recipes with your family and
              friends
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 size-4" />
              Create Your First Household
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {households.map((household) => (
            <Link
              key={household._id}
              href={`/dashboard/households/${household._id}`}
            >
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {household.name}
                        {household.role === "owner" && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-normal">
                            Owner
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {household.memberCount}{" "}
                        {household.memberCount === 1 ? "member" : "members"} •{" "}
                        {household.recipeCount}{" "}
                        {household.recipeCount === 1 ? "recipe" : "recipes"}
                      </CardDescription>
                    </div>
                    {household.role === "owner" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          // Navigate to settings
                          window.location.href = `/dashboard/households/${household._id}/settings`;
                        }}
                      >
                        <Settings className="size-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="size-4 mr-2" />
                    View members and recipes
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateHouseholdDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
