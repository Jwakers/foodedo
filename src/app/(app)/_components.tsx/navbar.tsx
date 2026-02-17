"use client";

import { ROUTES } from "@/app/constants";
import { Button } from "@/components/ui/button";
import {
  CalendarCheck,
  ChefHat,
  Clipboard,
  Compass,
  Home,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { AddRecipeDrawer } from "./add-recipe-drawer";

export function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    document.body.style.setProperty(
      "--nav-height",
      `${navRef.current?.clientHeight}px`
    );
  }, []);

  return (
    <>
      <nav
        ref={navRef}
        className="sticky bottom-0 safe-area-inset-bottom left-0 right-0 z-50 bg-background border-t border-border"
      >
        <div className="grid auto-cols-fr grid-flow-col px-4 py-2">
          {/* Home */}
          <Link href={ROUTES.DASHBOARD}>
            <Button
              variant="ghost"
              className="h-auto flex flex-col items-center gap-1 px-3 py-2 w-full"
            >
              <Home className="h-5 w-5" />
              <span className="text-[0.625rem] sm:text-xs">Home</span>
            </Button>
          </Link>

          {/* Meal planning */}
          <Link href={ROUTES.MEAL_PLAN}>
            <Button
              variant="ghost"
              className="h-auto w-full flex flex-col items-center gap-1 px-3 py-2"
              aria-label="Meal planning"
            >
              <CalendarCheck className="h-5 w-5" />
              <span className="text-[0.625rem] sm:text-xs">
                <span className="sm:hidden">Meals</span>
                <span className="hidden sm:inline">Meal plan</span>
              </span>
            </Button>
          </Link>

          {/* Add Recipe - Primary action */}
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg mx-auto"
            onClick={() => setDrawerOpen(true)}
            aria-label="Add Recipe"
          >
            <Plus className="h-6 w-6" />
          </Button>

          {/* Discover */}
          <Link href={ROUTES.DISCOVER}>
            <Button
              variant="ghost"
              className="h-auto w-full flex flex-col items-center gap-1 px-3 py-2"
              aria-label="Discover recipes"
            >
              <Compass className="h-5 w-5" />
              <span className="text-[0.625rem] sm:text-xs">Discover</span>
            </Button>
          </Link>

          {/* Chalkboard */}
          <Link href={ROUTES.CHALKBOARD}>
            <Button
              variant="ghost"
              className="h-auto w-full flex flex-col items-center gap-1 px-3 py-2"
            >
              <Clipboard className="h-5 w-5" />
              <span className="text-[0.625rem] sm:text-xs">Chalkboard</span>
            </Button>
          </Link>

          {/* Households */}
          <Link href={ROUTES.MY_RECIPES}>
            <Button
              variant="ghost"
              className="h-auto w-full flex flex-col items-center gap-1 px-3 py-2"
            >
              <ChefHat className="h-5 w-5" />
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
