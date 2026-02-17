import { ROUTES } from "@/app/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChefHat, Home, ListOrdered } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 pb-8 text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-muted p-6">
              <ChefHat className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>

          {/* Title and Description */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">404</h1>
            <h2 className="text-2xl font-semibold">Page Not Found</h2>
            <p className="text-muted-foreground">
              Oops! This recipe seems to have wandered off the kitchen counter.
              Let&apos;s get you back to cooking!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <Button asChild size="lg" className="w-full">
              <Link href={ROUTES.DASHBOARD}>
                <Home className="mr-2 size-5" />
                Go to Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href={ROUTES.MY_RECIPES}>
                <ListOrdered className="mr-2 size-5" />
                View My Recipes
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
