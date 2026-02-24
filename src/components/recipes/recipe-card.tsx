"use client";

import { CATEGORY_COLORS, ROUTES } from "@/app/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, titleCase } from "@/lib/utils";
import { Id } from "convex/_generated/dataModel";
import { Check, Clock, Users, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export type RecipeListItem = {
  _id: Id<"recipes">;
  title: string;
  description?: string | null;
  prepTime: number;
  cookTime?: number | null;
  serves: number;
  category: string;
  image?: string | null;
  updatedAt?: number;
  _creationTime?: number;
  isGeneratorEligible?: boolean | null;
  primaryProtein?: string | null;
  complexityTier?: string | null;
};

export function RecipeCard({ recipe }: { recipe: RecipeListItem }) {
  const totalTime = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
  const categoryLabel = titleCase(recipe.category);
  const categoryColor =
    CATEGORY_COLORS[recipe.category as keyof typeof CATEGORY_COLORS] ?? "";
  const mealPlanEligible = recipe.isGeneratorEligible === true;

  return (
    <Link href={`${ROUTES.RECIPE}/${recipe._id}`}>
      <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 pt-0">
        <div className="aspect-4/3 bg-linear-to-br from-primary/20 to-primary/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
          {recipe.image && (
            <Image
              src={recipe.image}
              alt={recipe.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, (max-width: 1440px) 25vw, 450px"
              className="object-cover size-full"
              unoptimized
            />
          )}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {mealPlanEligible ? (
              <span
                className="size-6 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shrink-0"
                title="Included in meal plan generation"
                aria-label="Included in meal plan generation"
              >
                <Check className="size-3.5" strokeWidth={3} />
              </span>
            ) : (
              <span
                className="size-6 rounded-full flex items-center justify-center shrink-0 border border-dashed border-gray-400 text-gray-400"
                title="Not included in meal plan generation"
                aria-label="Not included in meal plan generation"
              >
                <X className="size-3.5" strokeWidth={2.5} />
              </span>
            )}
            <Badge
              variant="secondary"
              className={cn(categoryColor, "border-0 font-medium")}
            >
              {categoryLabel}
            </Badge>
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-xl font-bold text-white drop-shadow-lg line-clamp-2">
              {recipe.title}
            </h3>
            {recipe.description && (
              <p className="text-white/90 text-sm mt-1 line-clamp-2 drop-shadow">
                {recipe.description}
              </p>
            )}
          </div>
        </div>

        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="size-4" />
                <span>{totalTime} min</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="size-4" />
                <span>Serves {recipe.serves}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {new Date(
                  recipe.updatedAt ?? recipe._creationTime ?? 0,
                ).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function RecipeCardSkeleton() {
  return (
    <Card className="group relative overflow-hidden">
      <div className="aspect-4/3 bg-muted relative overflow-hidden">
        <div className="absolute top-4 right-4">
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="size-8" />
        </div>
      </CardFooter>
    </Card>
  );
}

export function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <RecipeCardSkeleton key={index} />
      ))}
    </div>
  );
}
