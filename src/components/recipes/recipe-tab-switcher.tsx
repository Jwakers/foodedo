"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRecipeListing } from "./recipe-listing-context";

const TAB_PARAM = "tab";
const TAB_MY_RECIPES = "my-recipes";
const TAB_DISCOVER = "discover";

export function RecipeTabSwitcher() {
  const { isTabbedMode, currentTab } = useRecipeListing();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!isTabbedMode || currentTab === null) return null;

  const value = currentTab;

  const onValueChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === TAB_DISCOVER) {
      params.set(TAB_PARAM, TAB_DISCOVER);
    } else {
      params.delete(TAB_PARAM);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <Tabs value={value} onValueChange={onValueChange} className="mt-6">
      <TabsList className="w-fit">
        <TabsTrigger value={TAB_MY_RECIPES}>My Recipes</TabsTrigger>
        <TabsTrigger value={TAB_DISCOVER}>Discover</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
