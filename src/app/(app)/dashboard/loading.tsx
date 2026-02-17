import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div
      role="region"
      aria-label="Loading dashboard"
      aria-busy="true"
      className="container mx-auto px-4 py-6 max-w-7xl"
    >
      {/* Hero Section Skeleton */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-xl border border-primary/20 p-6 mb-6">
        <div
          aria-hidden="true"
          className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl"
        />

        <div className="relative">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-96 mb-4" />
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
      </div>

      {/* Households Section Skeleton */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-primary/8 to-background rounded-xl border border-primary/25 p-6 mb-6">
        <div
          aria-hidden="true"
          className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary/15 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-primary/15 blur-2xl"
        />

        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div>
              <Skeleton className="h-6 w-32 mb-1" />
              <Skeleton className="size-48" />
            </div>
          </div>
          <Skeleton className="h-16 w-full mb-4" />
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-44" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed Skeleton */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="size-5" />
                <Skeleton className="h-6 w-32" />
              </div>
              <Skeleton className="size-48" />
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
        </div>

        {/* Feature Grid Skeleton */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card
                key={i}
                className="group hover:shadow-lg transition-all duration-300"
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-lg" />
                    <div>
                      <Skeleton className="h-5 w-24 mb-1" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
