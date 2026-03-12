import { ROUTES } from "@/app/constants";
import { IngredientsList } from "@/app/(app)/_components.tsx/ingredients-list";
import { MethodList } from "@/app/(app)/_components.tsx/method-list";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatLabel, titleCase } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  User,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export type DiscoverRecipeData = {
  title: string;
  description?: string | null;
  prepTime: number;
  cookTime?: number | null;
  serves: number;
  category: string;
  image?: string | null;
  ingredients?: Array<{
    name: string;
    amount?: number;
    unit?: string;
    preparation?: string;
  }>;
  method?: Array<{
    title: string;
    description?: string | null;
    imageUrl?: string | null;
  }>;
  nutrition?: {
    calories?: number;
    protein?: number;
    fat?: number;
    carbohydrates?: number;
  } | null;
  originalUrl?: string | null;
  originalAuthor?: string | null;
  originalPublishedDate?: number | null;
  primaryProtein?: string | null;
  complexityTier?: string | null;
  cuisine?: string[] | null;
};

export function DiscoverRecipeView({ recipe }: { recipe: DiscoverRecipeData }) {
  const totalMins = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);
  const categoryLabel = titleCase(recipe.category);

  return (
    <article className="min-h-screen bg-background">
      {/* Back link */}
      <div className="border-b border-border/60 bg-muted/30">
        <div className="container mx-auto max-w-3xl px-4 py-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={ROUTES.DISCOVER} className="gap-2" aria-label="Back to Discover">
              <ArrowLeft className="size-4" />
              Back to Discover
            </Link>
          </Button>
        </div>
      </div>

      {/* Hero image */}
      {recipe.image && (
        <div className="relative w-full aspect-21/9 sm:aspect-3/1 bg-muted">
          <Image
            src={recipe.image}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-background/90 via-background/20 to-transparent" />
        </div>
      )}

      <div className="container mx-auto max-w-3xl px-4 py-8 sm:py-12">
        {/* Title & meta */}
        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary" className="font-medium">
              {categoryLabel}
            </Badge>
            {recipe.primaryProtein && (
              <Badge variant="outline" className="font-medium">
                {formatLabel(recipe.primaryProtein)}
              </Badge>
            )}
            {recipe.complexityTier && (
              <Badge variant="outline" className="font-medium">
                {formatLabel(recipe.complexityTier)}
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground mb-4">
            {recipe.title}
          </h1>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            {totalMins > 0 && (
              <span className="flex items-center gap-1.5">
                <Clock className="size-4 shrink-0" aria-hidden />
                {totalMins} min total
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Users className="size-4 shrink-0" aria-hidden />
              Serves {recipe.serves}
            </span>
          </div>
          {recipe.description && (
            <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl">
              {recipe.description}
            </p>
          )}
        </header>

        <div className="space-y-10">
          {/* Ingredients */}
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Ingredients</CardTitle>
              </CardHeader>
              <CardContent>
                <IngredientsList ingredients={recipe.ingredients} />
              </CardContent>
            </Card>
          )}

          {/* Method */}
          {recipe.method && recipe.method.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Method</CardTitle>
              </CardHeader>
              <CardContent>
                <MethodList method={recipe.method} />
              </CardContent>
            </Card>
          )}

          {/* Nutrition (optional, compact) */}
          {recipe.nutrition &&
            (recipe.nutrition.calories ??
              recipe.nutrition.protein ??
              recipe.nutrition.fat ??
              recipe.nutrition.carbohydrates) != null && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Nutrition</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {recipe.nutrition.calories != null && (
                      <li>
                        <span className="font-medium text-foreground">
                          {recipe.nutrition.calories}
                        </span>{" "}
                        kcal
                      </li>
                    )}
                    {recipe.nutrition.protein != null && (
                      <li>
                        <span className="font-medium text-foreground">
                          {recipe.nutrition.protein}g
                        </span>{" "}
                        protein
                      </li>
                    )}
                    {recipe.nutrition.fat != null && (
                      <li>
                        <span className="font-medium text-foreground">
                          {recipe.nutrition.fat}g
                        </span>{" "}
                        fat
                      </li>
                    )}
                    {recipe.nutrition.carbohydrates != null && (
                      <li>
                        <span className="font-medium text-foreground">
                          {recipe.nutrition.carbohydrates}g
                        </span>{" "}
                        carbs
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            )}

          {/* Attribution */}
          {(recipe.originalUrl ||
            recipe.originalAuthor ||
            recipe.originalPublishedDate) && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Recipe adapted from external source
                  </p>
                  <Separator />
                  <div className="flex flex-wrap gap-y-2 gap-x-6 justify-between items-end">
                    <div className="space-y-2">
                      {recipe.originalAuthor && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="size-4 text-muted-foreground shrink-0" />
                          <span>
                            <span className="text-muted-foreground">By</span>{" "}
                            <span className="font-medium">
                              {recipe.originalAuthor}
                            </span>
                          </span>
                        </div>
                      )}
                      {recipe.originalPublishedDate != null && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="size-4 text-muted-foreground shrink-0" />
                          <span>
                            <span className="text-muted-foreground">
                              Published{" "}
                            </span>
                            <span className="font-medium">
                              {new Date(
                                recipe.originalPublishedDate,
                              ).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                    {recipe.originalUrl && (
                      <div className="flex items-start gap-2 text-sm">
                        <ExternalLink className="size-4 text-primary shrink-0 mt-0.5" />
                        <a
                          href={recipe.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-medium"
                        >
                          View original recipe
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </article>
  );
}
