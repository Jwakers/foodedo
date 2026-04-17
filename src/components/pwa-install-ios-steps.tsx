"use client";

import { APP_NAME } from "@/app/constants";
import { cn } from "@/lib/utils";
import { Check, Ellipsis, Share } from "lucide-react";

export function PwaInstallIosSteps({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-md border border-primary/20 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary">
            <span className="text-xs font-bold text-primary-foreground">1</span>
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-foreground">
              Open your browser menu
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs text-muted-foreground">
                In Safari, open the page or browser menu
              </p>
              <Ellipsis className="inline-block size-4 shrink-0 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-primary/20 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary">
            <span className="text-xs font-bold text-primary-foreground">2</span>
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-foreground">
              Tap the Share button
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs text-muted-foreground">
                From there, choose the share option.
              </p>
              <Share className="inline-block size-4 shrink-0 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-primary/20 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary">
            <span className="text-xs font-bold text-primary-foreground">3</span>
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-foreground">
              Choose &ldquo;Add to Home Screen&rdquo;
            </p>
            <p className="text-xs text-muted-foreground">
              You may need to scroll the share sheet actions to find it.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-primary/20 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary">
            <Check className="size-3 text-primary-foreground" />
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-foreground">
              Open from your home screen
            </p>
            <p className="text-xs text-muted-foreground">
              Launch {APP_NAME} like a native app anytime.
            </p>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        <a
          href="https://support.apple.com/guide/iphone/add-a-website-icon-to-your-home-screen-iphc8971d144/ios"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:text-primary/80"
        >
          Apple: Add a website icon to your Home Screen
        </a>
      </p>
    </div>
  );
}
