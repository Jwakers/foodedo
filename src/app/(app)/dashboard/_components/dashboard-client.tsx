"use client";

import { getCannyBoardUrl } from "@/app/(app)/_components.tsx/canny-identify";
import { APP_NAME, ROUTES } from "@/app/constants";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
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
import { useEffect, useMemo, useState } from "react";
import { useCurrentMealPlan } from "@/app/(app)/_components.tsx/current-meal-plan-context";
import { MealPlanOverviewSection, PreviousMealPlanNudge } from "./meal-plan-overview-section";
import { TodaysMealSpotlight } from "./todays-meal-spotlight";

type RecentActivity = FunctionReturnType<typeof api.recipes.getRecentActivity>;
const baseCannyBoardUrl = process.env.NEXT_PUBLIC_CANNY_BOARD_URL;

const NEW_ACCOUNT_MAX_AGE_MS = 48 * 60 * 60 * 1000;

function HeroSection() {
  const { user, isLoaded } = useUser();
  const firstName = user?.firstName?.trim() ?? "";

  /** Only trust account age after Clerk has hydrated — avoids "Welcome back" flash for new users. */
  const accountCreatedMs = useMemo(() => {
    if (!isLoaded || !user?.createdAt) return null;
    const t = new Date(user.createdAt).getTime();
    return Number.isFinite(t) ? t : null;
  }, [isLoaded, user?.createdAt]);

  const isNewAccount =
    isLoaded &&
    accountCreatedMs !== null &&
    Date.now() - accountCreatedMs >= 0 &&
    Date.now() - accountCreatedMs < NEW_ACCOUNT_MAX_AGE_MS;

  const welcomeTitle = useMemo(() => {
    if (!isLoaded) return "";
    if (firstName.length > 0) {
      return isNewAccount ? `Welcome, ${firstName}` : `Welcome back, ${firstName}`;
    }
    return isNewAccount ? "Welcome" : "Welcome back";
  }, [firstName, isLoaded, isNewAccount]);

  /** Client-only: avoids hydration mismatch (server default locale/time ≠ browser). */
  const [heroDate, setHeroDate] = useState<{
    label: string;
    dateTime: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    function computeHeroDate(): {
      label: string;
      dateTime: string;
    } {
      const now = new Date();
      return {
        label: now.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        }),
        dateTime: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
      };
    }

    const msUntilNextLocalMidnight = () => {
      const now = new Date();
      const next = new Date(now);
      next.setDate(next.getDate() + 1);
      next.setHours(0, 0, 0, 0);
      return Math.max(1, next.getTime() - now.getTime());
    };

    setHeroDate(computeHeroDate());

    const scheduleNext = () => {
      timeoutId = setTimeout(() => {
        if (cancelled) return;
        setHeroDate(computeHeroDate());
        scheduleNext();
      }, msUntilNextLocalMidnight());
    };
    scheduleNext();

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <header className="mb-8 min-w-0">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {!isLoaded ? (
            <span
              className="inline-block h-9 min-h-9 w-48 max-w-[min(18rem,75vw)] shrink-0 rounded-md bg-muted/70 align-middle animate-pulse sm:h-10 sm:min-h-10 sm:w-56"
              aria-hidden
            />
          ) : (
            welcomeTitle
          )}
        </h1>
        {heroDate ? (
          <time
            dateTime={heroDate.dateTime}
            className="shrink-0 text-sm text-muted-foreground tabular-nums sm:text-right"
          >
            {heroDate.label}
          </time>
        ) : (
          <span
            className="shrink-0 inline-block h-5 min-w-[12rem] rounded-md bg-muted/50 animate-pulse sm:text-right"
            aria-hidden
          />
        )}
      </div>
      <div
        className="mt-6 h-px w-full max-w-md bg-linear-to-r from-primary/40 via-primary/15 to-transparent"
        aria-hidden
      />
    </header>
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
          <div className="text-center py-8 px-1">
            <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
              No recipes yet. You can still{" "}
              <Link
                href={ROUTES.MEAL_PLAN}
                className="text-primary font-medium underline-offset-2 hover:underline"
              >
                generate a week
              </Link>{" "}
              from our curated catalog; then add your own from{" "}
              <Link
                href={ROUTES.MY_RECIPES_DISCOVER_TAB}
                className="text-primary font-medium underline-offset-2 hover:underline"
              >
                Discover
              </Link>{" "}
              or the + button.
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
  startHere,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  className?: string;
  children?: React.ReactNode;
  /** Highlight this card when the user has no current meal plan. */
  startHere?: boolean;
}) {
  return (
    <Link href={href}>
      <Card
        className={cn(
          "group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer",
          startHere &&
            "border-primary/35 bg-primary/6 ring-1 ring-primary/15 md:col-span-2",
          className,
        )}
      >
        <CardHeader>
          <div className="flex flex-wrap items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors shrink-0">
              <Icon className="size-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2 gap-y-1">
                <CardTitle className="text-lg">{title}</CardTitle>
                {startHere ? (
                  <Badge
                    variant="secondary"
                    className="bg-primary/15 text-primary border-primary/25 text-xs"
                  >
                    Start here
                  </Badge>
                ) : null}
              </div>
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
    <div className="relative overflow-hidden bg-gradient-to-br from-accent/20 via-accent/10 to-background rounded-xl border border-accent/30 p-6">
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

function BentoGrid({ emphasizeMealPlan }: { emphasizeMealPlan: boolean }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
      {/* Meal planning */}
      <FeatureCard
        title="Meal planning"
        description="Plan your week from our catalog and your recipes, then build a shopping list"
        icon={CalendarCheck}
        href={ROUTES.MEAL_PLAN}
        className="h-full"
        startHere={emphasizeMealPlan}
      >
        {emphasizeMealPlan ? (
          <p className="text-sm font-medium text-primary pt-1">
            Generate a full week in one tap — no recipe library required to
            start.
          </p>
        ) : null}
      </FeatureCard>

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
  const { currentPlan: currentPlanForLayout } = useCurrentMealPlan();
  const emphasizeNoPlan =
    currentPlanForLayout !== undefined && currentPlanForLayout === null;

  return (
    <div className="w-full min-w-0 overflow-x-hidden container mx-auto px-4 py-6 max-w-7xl box-border">
      <HeroSection />
      <TodaysMealSpotlight />
      <MealPlanOverviewSection />
      <PreviousMealPlanNudge />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Activity Feed */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <RecentActivitySection data={recentActivity} />
        </div>

        {/* Feature Grid */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          <BentoGrid emphasizeMealPlan={emphasizeNoPlan} />
        </div>
      </div>
      {emphasizeNoPlan ? (
        <details className="mb-6 rounded-xl border border-border bg-muted/15 open:bg-muted/25 transition-colors">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground list-none [&::-webkit-details-marker]:hidden flex items-center justify-between gap-2">
            <span>More — households & feedback</span>
            <span className="text-xs font-normal text-muted-foreground shrink-0">
              Optional
            </span>
          </summary>
          <div className="border-t border-border/60 px-2 pb-2 pt-4 space-y-6">
            <HouseholdsSection />
            <FeedbackSection />
          </div>
        </details>
      ) : (
        <>
          <HouseholdsSection />
          <FeedbackSection />
        </>
      )}
    </div>
  );
}
