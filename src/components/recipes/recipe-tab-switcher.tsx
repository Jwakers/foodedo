"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  TAB_ALL,
  TAB_DISCOVER,
  TAB_PARAM,
  useRecipeListing,
} from "./recipe-listing-context";
import {
  RecipeSourceSwitcher,
  type RecipeSourceSwitchValue,
} from "./recipe-source-switcher";

export function RecipeTabSwitcher() {
  const { isTabbedMode, currentTab } = useRecipeListing();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!isTabbedMode || currentTab === null) return null;

  const value = currentTab;

  const onValueChange = (tab: RecipeSourceSwitchValue) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === TAB_DISCOVER) {
      params.set(TAB_PARAM, TAB_DISCOVER);
    } else if (tab === TAB_ALL) {
      params.set(TAB_PARAM, TAB_ALL);
    } else {
      params.delete(TAB_PARAM);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  return (
    <RecipeSourceSwitcher
      value={value}
      onValueChange={onValueChange}
      className="mt-6"
    />
  );
}
