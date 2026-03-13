/**
 * Canonical base URL for the site (no trailing slash).
 * Used for sitemap, robots, metadataBase, canonical tags, and absolute URLs.
 *
 * SITE_URL must be set (e.g. https://www.foodedo.com).
 * Use the same scheme and host you want in search results (match your Google
 * Search Console property and any www ↔ non-www redirect target).
 */
export function getSiteBaseUrl(): string {
  const url = process.env.SITE_URL;
  if (!url?.trim()) {
    throw new Error(
      "SITE_URL is required. Set it in your environment (e.g. SITE_URL=https://www.foodedo.com).",
    );
  }
  return url.trim().replace(/\/$/, "");
}
