"use client";

import { ROUTES } from "@/app/constants";
import { cn } from "@/lib/utils";
import {
  DragDropProvider,
  DragOverlay,
  useDraggable,
  useDroppable,
} from "@dnd-kit/react";
import type { Id } from "convex/_generated/dataModel";
import { api } from "convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { GripVertical } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ComponentProps } from "react";
import { useCallback, useMemo, useState } from "react";
import { startOfDayMs } from "@/lib/utils";

type DragDropProviderProps = ComponentProps<typeof DragDropProvider>;
type DragOverEventArg = Parameters<
  NonNullable<DragDropProviderProps["onDragOver"]>
>[0];
type DragEndEventArg = Parameters<
  NonNullable<DragDropProviderProps["onDragEnd"]>
>[0];

type CurrentPlan = NonNullable<
  FunctionReturnType<typeof api.mealPlans.getCurrentMealPlan>
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

  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow",
        isDragging && "opacity-90 shadow-lg ring-2 ring-primary",
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
      className={cn(
        "relative",
        draggable.isDragging && "opacity-50",
      )}
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
      <div
        ref={draggable.handleRef}
        className={cn(
          "absolute right-1 top-1 z-10 flex size-8 cursor-grab items-center justify-center rounded-md bg-black/50 text-white active:cursor-grabbing",
          "touch-none",
        )}
        aria-label="Hold to drag and reorder"
      >
        <GripVertical className="size-4" aria-hidden />
      </div>
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
  const startDate = plan.startDate ?? plan.endDate - 7 * ONE_DAY_MS;
  const dayDates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        startOfDayMs(startDate + i * ONE_DAY_MS),
      ),
    [startDate],
  );

  const entriesByDay = useMemo(() => {
    const map = new Map<number, EntryLike[]>();
    for (let i = 0; i < 7; i++) map.set(dayDates[i], []);
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
    const target = event.operation.target;
    if (!target?.id) {
      setOverDayIndex(null);
      return;
    }
    const id = String(target.id);
    if (id.startsWith("day-")) {
      setOverDayIndex(parseInt(id.slice(4), 10));
    } else {
      setOverDayIndex(null);
    }
  }, []);

  /** Event shape: event.operation.source / event.operation.target, event.canceled (DragEndEventArg from provider props). */
  const handleDragEnd = useCallback(
    (event: DragEndEventArg) => {
      setOverDayIndex(null);
      if (event.canceled) return;
      const { source, target } = event.operation;
      if (!source || !target?.id || source.id === target.id) return;
      const id = String(target.id);
      if (!id.startsWith("day-")) return;
      const toDayIndex = parseInt(id.slice(4), 10);
      if (toDayIndex < 0 || toDayIndex > 6) return;
      const newDate = dayDates[toDayIndex];
      const entriesInDay = entriesByDay.get(newDate) ?? [];
      const data = source.data as
        | { entry: EntryLike; fromDayIndex: number }
        | undefined;
      if (!data?.entry) return;
      const entryId = data.entry._id as Id<"mealPlanEntries">;
      const newOrder =
        data.fromDayIndex === toDayIndex
          ? entriesInDay.length - 1
          : entriesInDay.length;
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
        drag to reorder.
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
