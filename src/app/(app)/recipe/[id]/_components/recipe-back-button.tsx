"use client";

import { ROUTES } from "@/app/constants";
import { Button } from "@/components/ui/button";
import { navigateBackOr } from "@/lib/navigation";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

/** PWA-friendly back: uses history when possible, else My Recipes. */
export function RecipeBackButton() {
  const router = useRouter();

  return (
    <div className="mb-4">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => navigateBackOr(router, ROUTES.MY_RECIPES)}
        aria-label="Go back to previous page"
      >
        <ArrowLeft className="size-4" />
        Back
      </Button>
    </div>
  );
}
