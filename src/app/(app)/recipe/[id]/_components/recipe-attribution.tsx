import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar, ExternalLink, User } from "lucide-react";
import { Recipe } from "./recipe-client";

interface RecipeAttributionProps {
  recipe: NonNullable<Recipe>;
}

export function RecipeAttribution({ recipe }: RecipeAttributionProps) {
  const hasAttribution =
    recipe.originalUrl || recipe.originalAuthor || recipe.originalPublishedDate;

  if (!hasAttribution) return null;

  // Format the published date if available
  const publishedDate = recipe.originalPublishedDate
    ? (() => {
        const d = new Date(recipe.originalPublishedDate);
        return Number.isNaN(d.getTime())
          ? null
          : d.toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            });
      })()
    : null;

  // Extract domain from URL for cleaner display
  const domain = (() => {
    if (!recipe.originalUrl) return null;
    try {
      return new URL(recipe.originalUrl).hostname.replace(/^www\./, "");
    } catch {
      return null;
    }
  })();

  return (
    <Card>
      <CardContent>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span>Recipe adapted from external source</span>
          </div>

          <Separator className="bg-border" />

          {/* Attribution Details */}
          <div className="flex flex-wrap gap-y-2 gap-x-6 justify-between items-end">
            <div className="space-y-2">
              {recipe.originalAuthor && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="size-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-foreground">
                    <span className="text-muted-foreground">By</span>{" "}
                    <span className="font-medium">{recipe.originalAuthor}</span>
                  </span>
                </div>
              )}

              {publishedDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="size-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-foreground">
                    <span className="text-muted-foreground">Published</span>{" "}
                    <span className="font-medium">{publishedDate}</span>
                  </span>
                </div>
              )}
            </div>

            {recipe.originalUrl && (
              <div className="flex items-start gap-2 text-sm">
                <ExternalLink className="size-4 text-primary flex-shrink-0" />
                <a
                  href={recipe.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium inline-flex items-center"
                >
                  View original recipe{domain ? ` on ${domain}` : ""}
                </a>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
