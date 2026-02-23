"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Renders a Back button only when the user came from the same origin
 * (or has in-app history), so we don't show "back" to an external site.
 */
export function RecipeBackButton() {
  const router = useRouter();
  const [showBack, setShowBack] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const referrer = document.referrer;
      const sameOriginReferrer =
        referrer !== "" && new URL(referrer).origin === window.location.origin;
      setShowBack(sameOriginReferrer);
    } catch {
      setShowBack(false);
    }
  }, []);

  if (showBack === false) return null;

  return (
    <div className="mb-4">
      <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => router.back()}
      aria-label="Go back to previous page"
    >
      <ArrowLeft className="size-4" />
      Back
    </Button>
    </div>
  );
}
