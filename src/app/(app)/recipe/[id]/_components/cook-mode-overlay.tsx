"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { DialogClose } from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, Heart, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { Recipe } from "./recipe-client";

interface CookModeOverlayProps {
  recipe: NonNullable<Recipe>;
  onClose: () => void;
}

type IngredientItem = {
  name: string;
  amount?: number;
  unit?: string;
  preparation?: string;
};

export function CookModeOverlay({ recipe, onClose }: CookModeOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const method = recipe.method ?? [];
  const methodSteps = method.length;
  const totalSteps = 1 + methodSteps + 1; // mise + method steps + complete
  const isMiseEnPlace = currentStep === 0;
  const isCompleteSlide = currentStep === methodSteps + 1;
  const isMethodStep = !isMiseEnPlace && !isCompleteSlide;
  const methodIndex = isMethodStep ? currentStep - 1 : 0;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const stepLabel = isMiseEnPlace
    ? "Mise en Place"
    : isCompleteSlide
      ? "All done"
      : `Step ${methodIndex + 1} of ${methodSteps}`;

  // Prevent background scroll while overlay is open (Dialog handles focus trap + Escape)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Screen wake lock
  useEffect(() => {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const requestLock = async () => {
      try {
        if (document.visibilityState === "visible") {
          const lock = await navigator.wakeLock.request("screen");
          if (cancelled) {
            await lock.release();
            return;
          }
          sentinel = lock;
        }
      } catch {
        /* ignore */
      }
    };
    const releaseLock = () => {
      sentinel?.release().catch(() => {});
      sentinel = null;
    };
    void requestLock();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void requestLock();
      else releaseLock();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      releaseLock();
    };
  }, []);

  const progressPercent = isMiseEnPlace
    ? 0
    : isCompleteSlide
      ? 100
      : methodSteps > 0
        ? ((methodIndex + 1) / methodSteps) * 100
        : 0;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="h-dvh max-h-dvh w-full max-w-full md:max-w-full translate-x-[-50%] translate-y-[-50%] gap-0 border-0 rounded-none bg-card p-0 shadow-lg focus:outline-none"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">
          Cooking mode: {recipe.title} — {stepLabel}
        </DialogTitle>
        <div className="flex size-full flex-col">
          <DialogClose asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full fixed top-4 right-4 z-10"
              aria-label="Close cooking mode"
            >
              <X className="size-5" />
            </Button>
          </DialogClose>

          {/* Content - scrollable, flex-1 min-h-0 so footer stays visible */}
          <div
            className="flex-1 overflow-y-auto safe-area-inset"
            role="region"
            aria-current="step"
            aria-label={
              isMiseEnPlace
                ? "Mise en Place"
                : isCompleteSlide
                  ? "Recipe complete"
                  : stepLabel
            }
          >
            {isMethodStep ? (
              <div className="bg-card p-6 md:p-8">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Step {methodIndex + 1} of {methodSteps}
                </p>
                <p className="mt-0.5 text-lg text-foreground">{recipe.title}</p>
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            ) : null}
            <div
              key={currentStep}
              className="animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
            >
              {isMiseEnPlace ? (
                <MiseEnPlaceSlide
                  ingredients={recipe.ingredients ?? []}
                  recipeImage={recipe.image}
                />
              ) : isCompleteSlide ? (
                <CompleteSlide
                  recipeTitle={recipe.title}
                  recipeImage={recipe.image}
                />
              ) : (
                <MethodStepSlide
                  step={method[methodIndex]}
                  stepNumber={methodIndex + 1}
                />
              )}
            </div>
          </div>

          <footer className="sticky bottom-0 safe-area-inset-bottom flex items-center justify-between gap-4 border-t border-border bg-card/80 px-4 py-4 backdrop-blur-sm">
            <Button
              variant="outline"
              size="lg"
              disabled={isFirstStep}
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              aria-label="Previous step"
            >
              <ChevronLeft className="h-6 w-6" />
              Previous
            </Button>
            {isCompleteSlide ? (
              <Button
                size="lg"
                onClick={onClose}
                aria-label="Close cooking mode"
              >
                Close
              </Button>
            ) : (
              <Button
                size="lg"
                disabled={isLastStep}
                onClick={() =>
                  setCurrentStep((s) => Math.min(totalSteps - 1, s + 1))
                }
                aria-label="Next step"
              >
                Next
                <ChevronRight className="h-6 w-6" />
              </Button>
            )}
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MiseEnPlaceSlide({
  ingredients,
  recipeImage,
}: {
  ingredients: IngredientItem[];
  recipeImage: string | null;
}) {
  return (
    <section
      className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden"
      aria-labelledby="mise-heading"
    >
      {/* Left: visual panel with image + overlay text */}
      <div className="relative flex min-h-[200px] flex-col justify-end bg-muted md:min-h-full">
        {recipeImage ? (
          <Image
            src={recipeImage}
            alt=""
            fill
            className="object-cover"
            unoptimized
            sizes="(max-width: 768px) 100vw, 40vw"
          />
        ) : null}
        <div
          className={cn(
            "relative p-6",
            recipeImage
              ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
              : "text-foreground",
          )}
        >
          <h1
            id="mise-heading"
            className="text-2xl font-bold tracking-tight md:text-3xl"
          >
            Mise en Place
          </h1>
          <p className="mt-1 text-sm opacity-95">Everything in its place.</p>
        </div>
      </div>
      {/* Right: content panel */}
      <div className="flex flex-col overflow-y-auto p-6 md:p-8">
        <h2 className="text-lg font-semibold text-primary">Before we start</h2>
        <p className="mt-2 text-muted-foreground">
          Great cooking starts with preparation. Gather and measure these
          ingredients so you can cook smoothly—continue whenever you’re ready.
        </p>
        {ingredients.length === 0 ? (
          <p className="mt-6 text-muted-foreground">No ingredients listed.</p>
        ) : (
          <ul className="mt-6 space-y-2">
            {ingredients.map((ing, index) => (
              <li
                key={`${index}-${ing.name}-${ing.amount}-${ing.unit}`}
                className="flex flex-wrap items-baseline gap-x-1.5 rounded-lg bg-muted px-4 py-3 text-base"
              >
                {!!ing.amount && (
                  <span className="font-semibold text-foreground">
                    {ing.amount}
                  </span>
                )}
                {ing.unit && (
                  <span className="text-muted-foreground uppercase text-sm">
                    {ing.unit}
                  </span>
                )}
                <span className="font-medium capitalize text-foreground">
                  {ing.name}
                </span>
                {ing.preparation && (
                  <span className="italic text-muted-foreground capitalize">
                    — {ing.preparation}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function CompleteSlide({
  recipeTitle,
  recipeImage,
}: {
  recipeTitle: string;
  recipeImage: string | null;
}) {
  return (
    <section
      className="grid h-full flex-1 grid-cols-1"
      aria-labelledby="complete-heading"
    >
      {/* Left: content panel - heart, message, Cook Again */}
      <div className="flex flex-col justify-center p-6 md:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary text-primary md:h-20 md:w-20">
          <Heart className="h-8 w-8 text-primary md:h-10 md:w-10" />
        </div>
        <div className="space-y-2 mt-4">
          <h1
            id="complete-heading"
            className="text-2xl font-bold tracking-tight text-primary md:text-3xl"
          >
            Bon Appétit!
          </h1>
          <p className="text-muted-foreground">
            You’ve created something wonderful. Take a moment to appreciate the
            aroma and enjoy your delicious meal.
          </p>
          <p className="text-sm font-medium text-foreground">{recipeTitle}</p>
        </div>
      </div>
      {/* Right: recipe image */}
      <div className="relative min-h-[200px] bg-muted md:min-h-full">
        {recipeImage ? (
          <Image
            src={recipeImage}
            alt=""
            width={1000}
            height={1000}
            className="object-cover"
            unoptimized
            sizes="(max-width: 768px) 100vw, 60vw"
          />
        ) : (
          <div className="flex h-full min-h-[200px] items-center justify-center text-muted-foreground">
            <Heart className="h-16 w-16 opacity-30" />
          </div>
        )}
      </div>
    </section>
  );
}

function MethodStepSlide({
  step,
  stepNumber,
}: {
  step: {
    title: string;
    description?: string | null;
    imageUrl?: string | null;
  };
  stepNumber: number;
}) {
  return (
    <section
      className="relative bg-card p-6 md:p-8"
      aria-labelledby={`step-title-${stepNumber}`}
    >
      {/* Main step content - centered feel */}
      <div>
        <h1
          id={`step-title-${stepNumber}`}
          className="text-2xl font-bold tracking-tight text-foreground md:text-3xl"
        >
          {step.title}
        </h1>
        {step.description && (
          <p className="mt-4 whitespace-pre-wrap text-lg leading-relaxed text-muted-foreground">
            {step.description}
          </p>
        )}
        {step.imageUrl && (
          <div className="relative mt-6 aspect-video w-full overflow-hidden rounded-xl border border-border shadow-md">
            <Image
              src={step.imageUrl}
              alt={`Step ${stepNumber}: ${step.title}`}
              fill
              className="object-cover"
              unoptimized
              sizes="100vw"
            />
          </div>
        )}
      </div>
    </section>
  );
}
