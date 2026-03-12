/**
 * Canonical base URL for the site (no trailing slash).
 * Used for sitemap, robots, metadataBase, and absolute URLs.
 *
 * Set SITE_URL in production (e.g. https://www.foodedo.com) so sitemap and
 * metadata use your custom domain instead of the Vercel deployment URL.
 */
export function getSiteBaseUrl(): string {
  if (process.env.SITE_URL) {
    return process.env.SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    return `${protocol}://${process.env.VERCEL_URL}`;
  }
  return "https://www.foodedo.com";
}
