"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="h-full py-10 bg-background flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-6">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>

        <h1 className="text-4xl font-bold text-foreground mb-4">
          Something went wrong!
        </h1>

        <p className="text-muted-foreground mb-2">
          We encountered an error while loading your dashboard.
        </p>

        {process.env.NODE_ENV !== "production" && error.message && (
          <p
            role="alert"
            aria-live="polite"
            className="text-sm text-muted-foreground/80 mb-6 font-mono bg-muted/50 p-3 rounded-md"
          >
            {error.message}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} size="lg" variant="default">
            <RefreshCw className="size-4" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
