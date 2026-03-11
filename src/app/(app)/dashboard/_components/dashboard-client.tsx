"use client";

import { getCannyBoardUrl } from "@/app/(app)/_components.tsx/canny-identify";
import { APP_NAME, ROUTES } from "@/app/constants";
import { cn, startOfDayMs } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/nextjs";
import { api } from "convex/_generated/api";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import {
  ArrowRight,
  CalendarCheck,
  ChefHat,
  Clipboard,
  Clock,
  Compass,
  Globe,
  LucideIcon,
  MessageSquare,
  Plus,
  ShoppingCart,
  Sparkles,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

type RecentActivity = FunctionReturnType<typeof api.recipes.getRecentActivity>;
const baseCannyBoardUrl = process.env.NEXT_PUBLIC_CANNY_BOARD_URL;

function formatDateShort(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function MealPlanOverviewSection() {
  const currentPlan = useQuery(api.mealPlans.getCurrentMealPlan);

  // Group meals by date - must be called before early returns to follow Rules of Hooks
  const mealsByDate = useMemo(() => {
    if (!currentPlan?.entries) return [];
    const grouped = new Map<
      number,
      Array<{ title: string; mealLabel?: string }>
    >();
    currentPlan.entries.forEach((entry) => {
      const dateKey = startOfDayMs(entry.date);
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      if (entry.recipe?.title) {
        grouped.get(dateKey)!.push({
          title: entry.recipe.title,
          mealLabel: entry.mealLabel ?? undefined,
        });
      }
    });
    // Sort by date
    return Array.from(grouped.entries())
      .sort(([a], [b]) => a - b)
      .map(([date, meals]) => ({ date, meals }));
  }, [currentPlan?.entries]);

  if (currentPlan === undefined) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-lg" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentPlan) {
    return (
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/15 rounded-lg shrink-0">
                <CalendarCheck className="size-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">
                  Plan your week
                </h2>
                <p className="text-sm text-muted-foreground">
                  Add meals from your recipes and generate a shopping list in
                  one place.
                </p>
              </div>
            </div>
            <Button asChild className="shrink-0">
              <Link href={ROUTES.MEAL_PLAN}>
                <CalendarCheck className="size-4 mr-2" />
                Create meal plan
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayStart =
    currentPlan.startDate ??
    (currentPlan.entries?.length
      ? Math.min(...currentPlan.entries.map((e) => e.date))
      : startOfDayMs(Date.now()));
  const displayEnd =
    currentPlan.endDate ??
    (currentPlan.entries?.length
      ? Math.max(...currentPlan.entries.map((e) => e.date))
      : startOfDayMs(Date.now()));
  const mealCount = currentPlan.entries?.length ?? 0;

  return (
    <Card className="mb-6 border-primary/20 bg-primary/5 overflow-hidden min-w-0">
      <CardContent className="p-4 sm:p-6 min-w-0 overflow-hidden">
        <div className="flex flex-col gap-4 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
            <div className="flex items-start gap-3 min-w-0 flex-1 overflow-hidden">
              <div className="p-2 bg-primary/15 rounded-lg shrink-0">
                <CalendarCheck className="size-6 text-primary" />
              </div>
              <div className="min-w-0 overflow-hidden">
                <h2 className="text-lg font-semibold text-foreground mb-0.5 truncate">
                  This week&apos;s meal plan
                </h2>
                <p className="text-sm text-muted-foreground">
                  {formatDateShort(displayStart)} –{" "}
                  {formatDateShort(displayEnd)}
                  {" · "}
                  {mealCount} meal{mealCount !== 1 ? "s" : ""} planned
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button asChild variant="default" size="sm" className="shrink-0">
                <Link href={ROUTES.MEAL_PLAN}>View plan</Link>
              </Button>
            </div>
          </div>
          {mealsByDate.length > 0 && (
            <div className="min-w-0 overflow-hidden rounded-md border border-border/60 bg-background/50">
              <div className="p-2 sm:p-3 max-h-48 overflow-y-auto space-y-3">
                {mealsByDate.map(({ date, meals }) => (
                  <div key={date} className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2">
                      {formatDateShort(date)}
                    </p>
                    <ul className="list-none space-y-0.5">
                      {meals.map((meal, i) => (
                        <li
                          key={`${date}-${meal.title}-${i}`}
                          className="py-1.5 px-2 text-sm text-foreground truncate"
                        >
                          {meal.mealLabel && (
                            <span className="text-muted-foreground text-xs mr-2">
                              {meal.mealLabel}:
                            </span>
                          )}
                          {meal.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function HeroSection() {
  const { user } = useUser();
  const firstName = user?.firstName || "there";

  return (
    <div className="relative overflow-hidden bg-linear-to-br from-primary/10 via-primary/5 to-background rounded-xl border border-primary/20 p-6 mb-6">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />

      <div className="relative">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Welcome back, {firstName}!
        </h1>
        <p className="text-muted-foreground mb-4">
          Check out your meal plan, recipes, or create a shopping list.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="shadow-md">
            <Link href={ROUTES.MEAL_PLAN}>
              <CalendarCheck className="size-4 mr-2" />
              Meal plan
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={ROUTES.SHOPPING_LIST}>
              <ShoppingCart className="size-4 mr-2" />
              Shopping list
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={ROUTES.MY_RECIPES}>View My Recipes</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ActivityCard({
  recipe,
}: {
  recipe: FunctionReturnType<
    typeof api.recipes.getRecentActivity
  >["recent"][number];
}) {
  const totalTime = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);

  return (
    <Link
      href={`${ROUTES.RECIPE}/${recipe._id}`}
      aria-label={`Edit ${recipe.title || "recipe"}`}
      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
    >
      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
        {recipe.image ? (
          <Image
            src={recipe.image}
            alt={recipe.title}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ChefHat className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">
          {recipe.title || "Untitled Recipe"}
        </h4>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{totalTime} min</span>
        </div>
      </div>
      <div className="flex-shrink-0">
        <ArrowRight className="size-4" />
      </div>
    </Link>
  );
}

function RecentActivitySection({ data }: { data: RecentActivity | undefined }) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg border"
              >
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="w-8 h-8 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasActivity = data.recent.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Your latest recipes</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasActivity ? (
          <div className="text-center py-8">
            <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              No recent activity - start by creating a recipe with the
              &quot;+&quot; button below
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Recent Recipes */}
            {data.recent.map((recipe) => (
              <ActivityCard key={recipe._id} recipe={recipe} />
            ))}

            {data.recent.length > 0 && (
              <div className="pt-2">
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href={ROUTES.MY_RECIPES}>View All Recipes</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FeatureCard({
  title,
  description,
  icon: Icon,
  href,
  className = "",
  children,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Link href={href}>
      <Card
        className={cn(
          "group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer",
          className,
        )}
      >
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Icon className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription className="text-sm">
                {description}
              </CardDescription>
            </div>
          </div>
          {children}
        </CardHeader>
      </Card>
    </Link>
  );
}

function HouseholdsSection() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-primary/8 to-background rounded-xl border border-primary/25 p-6 mb-6">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary/15 blur-2xl" />
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-primary/15 blur-2xl" />

      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Households</h2>
            <p className="text-sm text-muted-foreground">
              Collaborate with family & friends
            </p>
          </div>
        </div>

        <p className="text-muted-foreground mb-4 max-w-2xl">
          Create households to share your favourite recipes with family and
          friends. Everyone can view shared recipes, manage household items
          together via the shared kitchen chalkboard, and collaborate on
          shopping lists. Perfect for families, flatmates, and cooking
          communities!
        </p>

        <div className="flex flex-wrap gap-3">
          <Button asChild className="shadow-md">
            <Link href={ROUTES.HOUSEHOLDS}>
              <Users className="size-4 mr-2" />
              Manage Households
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={ROUTES.HOUSEHOLDS}>
              <Plus className="size-4 mr-2" />
              Create New Household
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function FeedbackSection() {
  const pathname = usePathname();
  const cannyBoardUrl = baseCannyBoardUrl ? getCannyBoardUrl(pathname) : null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-accent/20 via-accent/10 to-background rounded-xl border border-accent/30 p-6 mb-6">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-accent/20 blur-2xl" />
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-accent/20 blur-2xl" />

      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-accent/20 rounded-lg">
            <MessageSquare className="h-6 w-6 text-accent-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Help Us Improve
            </h2>
            <p className="text-sm text-muted-foreground">
              Share your feedback and suggestions
            </p>
          </div>
        </div>

        <p className="text-muted-foreground mb-4 max-w-2xl">
          Your feedback helps us make {APP_NAME} better for everyone. Whether
          you have suggestions for new features, found a bug, or just want to
          share your experience, we&apos;d love to hear from you!
        </p>

        {cannyBoardUrl ? (
          <Button asChild className="shadow-md">
            <a
              data-canny-link
              href={cannyBoardUrl}
              rel="noreferrer"
              target="_blank"
            >
              <MessageSquare className="size-4 mr-2" />
              Share Feedback
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function BentoGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
      {/* Meal planning */}
      <FeatureCard
        title="Meal planning"
        description="Plan your week with recipes, then generate a shopping list"
        icon={CalendarCheck}
        href={ROUTES.MEAL_PLAN}
        className="md:col-span-1 h-full"
      />

      {/* Shopping List */}
      <FeatureCard
        title="Shopping list"
        description="Create ad-hoc shopping lists from recipes and the chalkboard"
        icon={ShoppingCart}
        href={ROUTES.SHOPPING_LIST}
        className="md:col-span-1 h-full"
      />

      {/* Chalkboard */}
      <FeatureCard
        title="Kitchen Chalkboard"
        description="Quick notes for your kitchen, for yourself or your household"
        icon={Clipboard}
        href={ROUTES.CHALKBOARD}
        className="md:col-span-1 h-full"
      />

      {/* My Recipes */}
      <FeatureCard
        title="My Recipes"
        description="View, manage and create recipes"
        icon={ChefHat}
        href={ROUTES.MY_RECIPES}
        className="md:col-span-1 h-full"
      />

      {/* Import Recipe */}
      <FeatureCard
        title="Import Recipe"
        description="Save recipes from websites or copy and paste text"
        icon={Globe}
        href={ROUTES.IMPORT_RECIPE}
        className="md:col-span-1 h-full"
      />

      {/* Discover */}
      <FeatureCard
        title="Discover"
        description="Browse our curated recipes"
        icon={Compass}
        href={ROUTES.MY_RECIPES_DISCOVER_TAB}
        className="md:col-span-1 h-full"
      />
    </div>
  );
}

export default function DashboardClient() {
  const recentActivity = useQuery(api.recipes.getRecentActivity);

  return (
    <div className="w-full min-w-0 overflow-x-hidden container mx-auto px-4 py-6 max-w-7xl box-border">
      <HeroSection />
      <MealPlanOverviewSection />
      <HouseholdsSection />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <RecentActivitySection data={recentActivity} />
        </div>

        {/* Feature Grid */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          <BentoGrid />
        </div>

        <div className="order-3 lg:order-3 col-span-full">
          <FeedbackSection />
        </div>
      </div>
    </div>
  );
}
