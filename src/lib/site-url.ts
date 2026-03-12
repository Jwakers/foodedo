/**
 * Canonical base URL for the site (no trailing slash).
 * Used for sitemap, robots, metadataBase, and absolute URLs.
 *
 * SITE_URL must be set (e.g. https://www.foodedo.com).
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
