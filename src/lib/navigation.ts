/** Matches `useRouter()` from `next/navigation` for back/push only. */
export type AppNavigateBackRouter = {
  back: () => void;
  push: (href: string) => void;
};

/**
 * Prefer browser history for PWA-style navigation; fall back when there is no
 * prior entry (e.g. cold-opened deep link). `history.length` is a best-effort
 * heuristic and can be imperfect in some SPAs, but avoids trapping users with
 * `router.back()` when the stack is empty.
 */
export function navigateBackOr(
  router: AppNavigateBackRouter,
  fallbackHref: string,
): void {
  if (typeof window !== "undefined" && window.history.length <= 1) {
    router.push(fallbackHref);
    return;
  }
  router.back();
}
