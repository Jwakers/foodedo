import { APP_NAME } from "@/app/constants";

/** `og:site_name` and `og:url` for link previews (use with page-level canonical URL). */
export function openGraphSiteAndUrl(canonicalUrl: string) {
  return {
    siteName: APP_NAME,
    url: canonicalUrl,
  };
}
