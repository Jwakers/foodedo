"use client";

import { RecipeForm } from "@/app/(app)/_components.tsx/recipe-form";
import { ROUTES } from "@/app/constants";
import { Button } from "@/components/ui/button";
import { navigateBackOr } from "@/lib/navigation";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function CreateRecipeClient() {
  const router = useRouter();

  return (
    <div
      className="flex flex-col h-full w-full max-w-4xl mx-auto"
      style={{
        minHeight: `calc(100dvh - var(--nav-height) - var(--header-height))`,
      }}
    >
      <header className="shrink-0 border-b bg-background px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => navigateBackOr(router, ROUTES.MY_RECIPES)}
            aria-label="Go back"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="font-semibold text-lg">Create Recipe</h1>
            <p className="text-muted-foreground text-sm">
              Fill in the details to create your recipe
            </p>
          </div>
        </div>
      </header>
      <RecipeForm />
    </div>
  );
}
