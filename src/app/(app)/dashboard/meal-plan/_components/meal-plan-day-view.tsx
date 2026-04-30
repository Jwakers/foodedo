"use client";

import { ROUTES } from "@/app/constants";
import { cn, startOfDayMs } from "@/lib/utils";
import {
  DragDropProvider,
  DragOverlay,
  useDraggable,
  useDroppable,
} from "@dnd-kit/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { MAX_DAYS_IN_MEAL_PLAN } from "convex/lib/constants";
import type { FunctionReturnType } from "convex/server";
import { GripVertical } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ComponentProps } from "react";
import { useCallback, useMemo, useState } from "react";

type DragDropProviderProps = ComponentProps<typeof DragDropProvider>;
type DragOverEventArg = Parameters<
  NonNullable<DragDropProviderProps["onDragOver"]>
>[0];
type DragEndEventArg = Parameters<
  NonNullable<DragDropProviderProps["onDragEnd"]>
>[0];
type DragOperationTarget = DragOverEventArg["operation"]["target"];
type DropPlacement = { dayIndex: number; order: number | null };

type CurrentPlan = NonNullable<
  FunctionReturnType<typeof api.mealPlans.getMealPlan>
>;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function dayLabel(dateMs: number): string {
  const d = new Date(dateMs);
  return d.toLocaleDateString("en-GB", { weekday: "short" });
}

function dayDateLabel(dateMs: number): string {
  const d = new Date(dateMs);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatPlanRange(startDateMs: number, endDateMs: number): string {
  const fmt = (ms: number) =>
    new Date(ms).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  return `${fmt(startDateMs)} - ${fmt(endDateMs)}`;
}

function dropPlacementFromTarget(target: DragOperationTarget): DropPlacement | null {
  if (!target?.id) return null;
  const id = String(target.id);
  if (id.startsWith("day-")) {
    const parsed = Number.parseInt(id.slice(4), 10);
    return Number.isInteger(parsed) ? { dayIndex: parsed, order: null } : null;
  }

  const targetData = target.data as
    | { fromDayIndex?: unknown; fromOrder?: unknown }
    | undefined;
  const fromDayIndex = targetData?.fromDayIndex;
  if (typeof fromDayIndex !== "number" || !Number.isInteger(fromDayIndex)) {
    return null;
  }
  const fromOrder = targetData?.fromOrder;
  const order =
    typeof fromOrder === "number" && Number.isInteger(fromOrder)
      ? fromOrder
      : null;
  return { dayIndex: fromDayIndex, order };
}

type EntryLike = CurrentPlan["entries"][number];

function DraggableEntryCard({
  entry,
  isDragging,
}: {
  entry: EntryLike;
  isDragging?: boolean;
}) {
  const recipe = entry.recipe;
  if (!recipe) return null;
  const totalMin =
    recipe.totalTimeMinutes ?? recipe.prepTime + (recipe.cookTime ?? 0);
  const timeLabel = totalMin > 0 ? `${totalMin} min` : "";
  const hasLeftoverMatches =
    recipe.leftoverMatches && recipe.leftoverMatches.length > 0;

  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow",
        hasLeftoverMatches &&
          !isDragging &&
          "border-amber-500/40 ring-2 ring-amber-500/20",
        !hasLeftoverMatches && "border-border",
        isDragging && "border-border opacity-90 shadow-lg ring-2 ring-primary",
      )}
    >
      <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
        {recipe.image ? (
          <Image
            src={recipe.image}
            alt={recipe.title}
            fill
            className="object-cover"
            unoptimized
            sizes="(max-width: 768px) 50vw, 160px"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground text-xs">
            No image
          </div>
        )}
        {timeLabel && (
          <div className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
            {timeLabel}
          </div>
        )}
      </div>
      <div className="p-2">
        <h3 className="text-sm font-medium leading-tight text-foreground line-clamp-2">
          {recipe.title}
        </h3>
        {hasLeftoverMatches && (
          <div className="mt-1.5 space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-amber-800 dark:text-amber-400/90">
              Your ingredients
            </p>
            <div className="flex flex-wrap gap-1">
              {recipe.leftoverMatches?.map((m) => (
                <span
                  key={
                    m.kind === "canonical"
                      ? `id:${m.ingredientId}`
                      : `ph:${m.label}`
                  }
                  className="rounded-md border border-amber-500/45 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium leading-tight text-amber-950 dark:text-amber-100"
                >
                  {m.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function DayColumn({
  dayIndex,
  dateMs,
  entries,
  isOver,
}: {
  dayIndex: number;
  dateMs: number;
  entries: EntryLike[];
  isOver: boolean;
}) {
  const droppable = useDroppable({
    id: `day-${dayIndex}`,
  });
  const showOver = isOver || droppable.isDropTarget;

  return (
    <div
      ref={droppable.ref}
      className={cn(
        "min-h-[140px] rounded-xl border-2 border-dashed p-3 transition-colors",
        showOver
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/20 bg-muted/30",
      )}
    >
      <div className="mb-2 text-center">
        <p className="text-sm font-semibold text-foreground">
          {dayLabel(dateMs)}
        </p>
        <p className="text-xs text-muted-foreground">{dayDateLabel(dateMs)}</p>
      </div>
      <div className="flex flex-col gap-2">
        {entries.map((entry, idx) => (
          <DraggableEntry
            key={entry._id}
            entry={entry}
            dayIndex={dayIndex}
            order={idx}
          />
        ))}
      </div>
    </div>
  );
}

function DraggableEntry({
  entry,
  dayIndex,
  order,
}: {
  entry: EntryLike;
  dayIndex: number;
  order: number;
}) {
  const draggable = useDraggable({
    id: entry._id,
    data: {
      entry,
      fromDayIndex: dayIndex,
      fromDate: entry.date,
      fromOrder: order,
    },
  });

  const recipeId = entry.recipe?._id;
  const recipeHref = recipeId ? `${ROUTES.RECIPE}/${recipeId}` : null;

  return (
    <div
      ref={draggable.ref}
      className={cn("relative", draggable.isDragging && "opacity-50")}
    >
      {recipeHref ? (
        <Link
          href={recipeHref}
          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
          aria-label={`Open recipe: ${entry.recipe?.title ?? "Recipe"}`}
        >
          <DraggableEntryCard entry={entry} isDragging={draggable.isDragging} />
        </Link>
      ) : (
        <DraggableEntryCard entry={entry} isDragging={draggable.isDragging} />
      )}
      <button
        ref={draggable.handleRef}
        type="button"
        className={cn(
          "absolute right-1 top-1 z-10 flex size-8 cursor-grab items-center justify-center rounded-md bg-black/50 text-white active:cursor-grabbing",
          "touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        )}
        aria-label="Hold to drag and reorder"
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
    </div>
  );
}

export function MealPlanDayView({
  plan,
  onMoveEntry,
}: {
  plan: CurrentPlan;
  onMoveEntry: (
    entryId: Id<"mealPlanEntries">,
    date: number,
    order: number,
  ) => void;
}) {
  const earliestEntryDate = useMemo(() => {
    const entries = plan.entries ?? [];
    if (entries.length === 0) return undefined;
    let minDate = entries[0]!.date;
    for (const entry of entries) {
      if (entry.date < minDate) minDate = entry.date;
    }
    return startOfDayMs(minDate);
  }, [plan.entries]);
  const planStartDate = startOfDayMs(
    plan.startDate ?? earliestEntryDate ?? plan.endDate,
  );
  const inferredDayCount = Math.floor((plan.endDate - planStartDate) / ONE_DAY_MS) + 1;
  const dayCount = Math.max(1, Math.min(MAX_DAYS_IN_MEAL_PLAN, inferredDayCount));
  const dayDates = useMemo(
    () =>
      Array.from({ length: dayCount }, (_, i) =>
        startOfDayMs(planStartDate + i * ONE_DAY_MS),
      ),
    [dayCount, planStartDate],
  );

  const entriesByDay = useMemo(() => {
    const map = new Map<number, EntryLike[]>();
    for (const dayDate of dayDates) map.set(dayDate, []);
    const sorted = [...(plan.entries ?? [])].sort(
      (a, b) => a.date - b.date || (a.order ?? 0) - (b.order ?? 0),
    );
    for (const entry of sorted) {
      const dayStart = startOfDayMs(entry.date);
      if (map.has(dayStart)) {
        map.get(dayStart)!.push(entry);
      } else {
        const closest = dayDates.reduce(
          (best, d) =>
            Math.abs(d - entry.date) < Math.abs(best - entry.date) ? d : best,
          dayDates[0],
        );
        map.get(closest)!.push(entry);
      }
    }
    return map;
  }, [plan.entries, dayDates]);

  const [overDayIndex, setOverDayIndex] = useState<number | null>(null);

  const handleDragStart = useCallback(() => {
    setOverDayIndex(null);
  }, []);

  const handleDragOver = useCallback((event: DragOverEventArg) => {
    const toDayIndex = dropPlacementFromTarget(event.operation.target)?.dayIndex;
    if (toDayIndex == null || toDayIndex < 0 || toDayIndex >= dayDates.length) {
      setOverDayIndex(null);
      return;
    }
    setOverDayIndex(toDayIndex);
  }, [dayDates.length]);

  /** Event shape: event.operation.source / event.operation.target, event.canceled (DragEndEventArg from provider props). */
  const handleDragEnd = useCallback(
    (event: DragEndEventArg) => {
      setOverDayIndex(null);
      if (event.canceled) return;
      const { source, target } = event.operation;
      if (!source || !target?.id || source.id === target.id) return;
      const placement = dropPlacementFromTarget(target);
      const toDayIndex = placement?.dayIndex;
      if (toDayIndex == null || toDayIndex < 0 || toDayIndex >= dayDates.length)
        return;
      const newDate = dayDates[toDayIndex];
      const entriesInDay = entriesByDay.get(newDate) ?? [];
      const dayCapacity = dayDates.length;
      const data = source.data as
        | { entry: EntryLike; fromDayIndex: number; fromOrder: number }
        | undefined;
      if (!data?.entry) return;
      const entryId = data.entry._id as Id<"mealPlanEntries">;
      const maxOrderForDay = Math.max(0, dayCapacity - 1);
      const desiredIndex = Math.max(
        0,
        placement?.order ?? entriesInDay.length,
      );
      let newOrder = Math.max(0, Math.min(desiredIndex, maxOrderForDay));
      if (data.fromDayIndex === toDayIndex) {
        const lengthWithoutSource = Math.max(0, dayCapacity - 1);
        const adjustedIndex =
          data.fromOrder < desiredIndex ? desiredIndex - 1 : desiredIndex;
        newOrder = Math.max(0, Math.min(adjustedIndex, lengthWithoutSource));
      }
      onMoveEntry(entryId, newDate, Math.max(0, newOrder));
    },
    [dayDates, entriesByDay, onMoveEntry],
  );

  return (
    <DragDropProvider
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <p className="mb-3 text-center text-xs text-muted-foreground">
        Tap a meal to open the recipe. Hold the grip icon for a moment, then
        drag to reorder. You can move meals between {formatPlanRange(planStartDate, plan.endDate)}.
      </p>
      {/* 2 columns on mobile, then 3, 4, 7 at larger breakpoints */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {dayDates.map((dateMs, i) => (
          <DayColumn
            key={dateMs}
            dayIndex={i}
            dateMs={dateMs}
            entries={entriesByDay.get(dateMs) ?? []}
            isOver={overDayIndex === i}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {(source) => {
          const entry = (source.data as { entry: EntryLike } | undefined)
            ?.entry;
          if (!entry) return null;
          return (
            <div className="w-[180px] max-w-[50vw] rotate-1 scale-105">
              <DraggableEntryCard entry={entry} isDragging />
            </div>
          );
        }}
      </DragOverlay>
    </DragDropProvider>
  );
}
