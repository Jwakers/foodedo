"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AppFeedbackVisibilityValue = {
  suppressedCount: number;
  registerSuppress: () => () => void;
};

const AppFeedbackVisibilityContext =
  createContext<AppFeedbackVisibilityValue | null>(null);

export function AppFeedbackVisibilityProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [suppressedCount, setSuppressedCount] = useState(0);

  const registerSuppress = useCallback(() => {
    setSuppressedCount((n) => n + 1);
    return () => setSuppressedCount((n) => Math.max(0, n - 1));
  }, []);

  const value = useMemo(
    () => ({ suppressedCount, registerSuppress }),
    [suppressedCount, registerSuppress],
  );

  return (
    <AppFeedbackVisibilityContext.Provider value={value}>
      {children}
    </AppFeedbackVisibilityContext.Provider>
  );
}

/** Hides the floating app feedback control while mounted (e.g. when sticky bottom actions need the space). */
export function SuppressAppFeedback() {
  const ctx = useContext(AppFeedbackVisibilityContext);
  useEffect(() => {
    if (!ctx) return;
    return ctx.registerSuppress();
  }, [ctx]);
  return null;
}

export function useAppFeedbackSuppressed(): boolean {
  const ctx = useContext(AppFeedbackVisibilityContext);
  return (ctx?.suppressedCount ?? 0) > 0;
}
