"use client";

import { ROUTES } from "@/app/constants";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import Link from "next/link";

type PremiumFeatureNoticeProps = {
  title: string;
  description: string;
  className?: string;
  ctaLabel?: string;
  ctaSuffix?: string;
};

export function PremiumFeatureNotice({
  title,
  description,
  className,
  ctaLabel = "Upgrade your account",
  ctaSuffix = "to take advantage of advanced features.",
}: PremiumFeatureNoticeProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-background/60 p-3 text-sm",
        className,
      )}
    >
      <p className="font-medium flex items-center gap-2">
        <Lock className="size-4" />
        {title}
      </p>
      <p className="mt-1 text-muted-foreground">
        {description}{" "}
        <Link className="underline underline-offset-4" href={ROUTES.PRICING}>
          {ctaLabel}
        </Link>{" "}
        {ctaSuffix}
      </p>
    </div>
  );
}
