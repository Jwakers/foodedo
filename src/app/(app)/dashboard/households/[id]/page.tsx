"use client";

import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePaginatedQuery, useQuery } from "convex/react";
import { FunctionReturnType } from "convex/server";
import { ArrowLeft, Settings, UserPlus } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import { HouseholdMemberList } from "./_components/household-member-list";
import { HouseholdRecipeList } from "./_components/household-recipe-list";
import { InviteMemberDialog } from "./_components/invite-member-dialog";

interface HouseholdDetailPageProps {
  params: Promise<{
    id: Id<"households">;
  }>;
}

export type Recipe = FunctionReturnType<
  typeof api.households.listHouseholdRecipesPaginated
>["page"][number];

export default function HouseholdDetailPage({
  params,
}: HouseholdDetailPageProps) {
  const { id } = use(params);
  const household = useQuery(api.households.getHousehold, { householdId: id });
  const members = useQuery(api.households.getHouseholdMembers, {
    householdId: id,
  });
  const {
    results: recipes,
    status: recipesStatus,
    loadMore: loadMoreRecipes,
  } = usePaginatedQuery(
    api.households.listHouseholdRecipesPaginated,
    { householdId: id },
    { initialNumItems: 20 },
  );
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const isRecipesInitialLoading =
    recipesStatus === "LoadingFirstPage" && recipes.length === 0;
  const canLoadMoreRecipes = recipesStatus === "CanLoadMore";
  const loadingMoreRecipes = recipesStatus === "LoadingMore";

  if (
    household === undefined ||
    members === undefined ||
    isRecipesInitialLoading
  ) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (household === null) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">Household not found</p>
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
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-wrap gap-x-8 gap-y-4 justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/households">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {household.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              {members.length} {members.length === 1 ? "member" : "members"} •{" "}
              {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
            </p>
          </div>
        </div>

        {household.isOwner && (
          <div className="flex gap-2 justify-end ml-auto">
            <Button onClick={() => setIsInviteDialogOpen(true)}>
              <UserPlus className="mr-2 size-4" />
              Invite Member
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/households/${id}/settings`}>
                <Settings className="mr-2 size-4" />
                Settings
              </Link>
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="recipes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recipes">Recipes</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="recipes" className="space-y-4">
          <HouseholdRecipeList
            recipes={recipes}
            householdId={id}
            canLoadMore={canLoadMoreRecipes}
            loadingMore={loadingMoreRecipes}
            onLoadMore={() => loadMoreRecipes(20)}
          />
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <HouseholdMemberList
            members={members}
            householdId={id}
            isOwner={household.isOwner}
          />
        </TabsContent>
      </Tabs>

      <InviteMemberDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        householdId={id}
        householdName={household.name}
      />
    </div>
  );
}
