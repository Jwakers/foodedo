import { ROUTES } from "@/app/constants";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function RecipeNotFound() {
  return (
    <div className="bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Recipe Not Found
        </h1>
        <p className="text-muted-foreground mb-6">
          The recipe you&apos;re looking for doesn&apos;t exist or you
          don&apos;t have permission to view it.
        </p>
        <Button size="lg" asChild>
          <Link href={ROUTES.MY_RECIPES}>
            <ArrowLeft className="size-4" />
            Back to My Recipes
          </Link>
        </Button>
      </div>
    </div>
  );
}
