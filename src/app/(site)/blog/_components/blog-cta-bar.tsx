import { APP_NAME, ROUTES } from "@/app/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChefHat } from "lucide-react";
import Link from "next/link";

export function BlogCtaBar() {
  return (
    <div
      className={cn(
        "border-b bg-primary/8 dark:bg-primary/12",
        "py-2.5 px-4",
      )}
    >
      <div className="container mx-auto max-w-4xl flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <ChefHat className="size-4 text-primary shrink-0" aria-hidden />
          <span>
            Turn what you read into real meals — try{" "}
            <span className="font-semibold text-foreground">{APP_NAME}</span>{" "}
            free.
          </span>
        </p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={ROUTES.SIGN_IN}>Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={ROUTES.SIGN_UP}>Get started</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
