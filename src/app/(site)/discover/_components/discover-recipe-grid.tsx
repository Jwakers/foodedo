"use client";

import { CATEGORY_COLORS, ROUTES } from "@/app/constants";
import type { RecipeListItem } from "@/components/recipes/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn, titleCase } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

function DiscoverRecipeCard({
  recipe,
}: {
  recipe: RecipeListItem & { publicSlug: string };
}) {
  const totalTime = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
  const categoryLabel = titleCase(recipe.category);
  const categoryColor =
    CATEGORY_COLORS[recipe.category as keyof typeof CATEGORY_COLORS] ?? "";

  return (
    <Link href={ROUTES.discoverRecipe(recipe.publicSlug)}>
      <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 pt-0">
        <div className="aspect-4/3 bg-linear-to-br from-primary/20 to-primary/5 relative overflow-hidden">
          {recipe.image && (
            <Image
              src={recipe.image}
              alt={recipe.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, (max-width: 1440px) 25vw, 450px"
              className="object-cover size-full"
            />
          )}
          {/* Strong bottom gradient so title stays legible over any image */}
          <div
            className="absolute inset-0 bg-linear-to-t from-black/70 to-64% to-transparent"
            aria-hidden
          />
          <div className="absolute top-4 right-4 flex items-center gap-2">
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
              <span>{totalTime} min</span>
              <span>Serves {recipe.serves}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function DiscoverRecipeGrid({ recipes }: { recipes: RecipeListItem[] }) {
  const withSlug = recipes.filter(
    (r): r is RecipeListItem & { publicSlug: string } =>
      typeof r.publicSlug === "string" && r.publicSlug.trim().length > 0,
  );

  if (withSlug.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground py-12">
          No recipes to show yet.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {withSlug.map((recipe) => (
          <DiscoverRecipeCard key={recipe._id} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}
