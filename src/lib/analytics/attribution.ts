"use client";

import type { SharedAttributionProps } from "@/lib/analytics/events";

const STORAGE_KEY = "foodedo_analytics_attribution_v1";

type StoredAttribution = Omit<SharedAttributionProps, "page_path" | "intent_topic">;

let cachedAttribution: StoredAttribution | null = null;

function getReferrerDomain(referrer: string): string | undefined {
  if (!referrer) return undefined;
  try {
    return new URL(referrer).hostname;
  } catch {
    return undefined;
  }
}

function readStoredAttribution(): StoredAttribution {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredAttribution;
    return parsed ?? {};
  } catch {
    return {};
  }
}

export function persistAttributionFromUrl(): StoredAttribution {
  if (typeof window === "undefined") return {};
  if (cachedAttribution) return cachedAttribution;

  const url = new URL(window.location.href);
  const stored = readStoredAttribution();
  const next: StoredAttribution = {
    utm_source: url.searchParams.get("utm_source") ?? stored.utm_source,
    utm_medium: url.searchParams.get("utm_medium") ?? stored.utm_medium,
    utm_campaign: url.searchParams.get("utm_campaign") ?? stored.utm_campaign,
    utm_term: url.searchParams.get("utm_term") ?? stored.utm_term,
    utm_content: url.searchParams.get("utm_content") ?? stored.utm_content,
    referrer_domain: stored.referrer_domain ?? getReferrerDomain(document.referrer),
  };

  cachedAttribution = next;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage errors and continue without persistence.
  }
  return cachedAttribution;
}

export function getAttributionProps(): StoredAttribution {
  return persistAttributionFromUrl();
}
