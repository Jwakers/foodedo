"use client";

import { ROUTES } from "@/app/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CalendarCheck,
  ChefHat,
  Clipboard,
  Home,
  Plus,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { AddRecipeDrawer } from "./add-recipe-drawer";
import { useCurrentMealPlan } from "./current-meal-plan-context";

export function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const { currentPlan } = useCurrentMealPlan();
  const showPlanWeekFab =
    currentPlan !== undefined && currentPlan === null;
  const mealsHref = currentPlan
    ? ROUTES.mealPlanWithId(currentPlan._id)
    : ROUTES.MEAL_PLAN;

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const syncNavHeight = () => {
      document.body.style.setProperty("--nav-height", `${nav.offsetHeight}px`);
    };

    syncNavHeight();

    const observer = new ResizeObserver(syncNavHeight);
    observer.observe(nav);
    window.addEventListener("resize", syncNavHeight);
    window.addEventListener("orientationchange", syncNavHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncNavHeight);
      window.removeEventListener("orientationchange", syncNavHeight);
    };
  }, []);

  return (
    <>
      <nav
        ref={navRef}
        className="sticky bottom-0 safe-area-inset-bottom inset-x-0 z-50 bg-background border-t border-border w-full"
      >
        <div className="grid auto-cols-fr grid-flow-col px-4 py-2">
          {/* Home */}
          <Link href={ROUTES.DASHBOARD}>
            <Button
              variant="ghost"
              className="h-auto flex flex-col items-center gap-1 px-3 py-2 w-full"
            >
              <Home className="size-5" />
              <span className="text-[0.625rem] sm:text-xs">Home</span>
            </Button>
          </Link>

          {/* Meal planning */}
          <Link href={mealsHref}>
            <Button
              variant="ghost"
              className="h-auto w-full flex flex-col items-center gap-1 px-3 py-2"
              aria-label="Meal planning"
            >
              <CalendarCheck className="size-5" />
              <span className="text-[0.625rem] sm:text-xs">
                <span className="sm:hidden">Meals</span>
                <span className="hidden sm:inline">Meal plan</span>
              </span>
            </Button>
          </Link>

          {/* Primary: plan week when none yet; otherwise add recipe */}
          {showPlanWeekFab ? (
            <Button
              size="icon"
              className="size-14 rounded-full shadow-lg mx-auto"
              asChild
            >
              <Link href={ROUTES.MEAL_PLAN} aria-label="Plan your week">
                <Sparkles className="size-6" />
              </Link>
            </Button>
          ) : (
            <Button
              size="icon"
              className={cn(
                "size-14 rounded-full shadow-lg mx-auto",
                currentPlan === undefined && "opacity-90",
              )}
              onClick={() => setDrawerOpen(true)}
              aria-label="Add Recipe"
            >
              <Plus className="size-6" />
            </Button>
          )}

          {/* Chalkboard */}
          <Link href={ROUTES.CHALKBOARD}>
            <Button
              variant="ghost"
              className="h-auto w-full flex flex-col items-center gap-1 px-3 py-2"
            >
              <Clipboard className="size-5" />
              <span className="text-[0.625rem] sm:text-xs">Chalkboard</span>
            </Button>
          </Link>

          {/* Households */}
          <Link href={ROUTES.MY_RECIPES}>
            <Button
              variant="ghost"
              className="h-auto w-full flex flex-col items-center gap-1 px-3 py-2"
            >
              <ChefHat className="size-5" />
              <span className="text-[0.625rem] sm:text-xs">
                <span className="sm:hidden">Recipes</span>
                <span className="hidden sm:inline">My Recipes</span>
              </span>
            </Button>
          </Link>
        </div>
      </nav>

      <AddRecipeDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}
