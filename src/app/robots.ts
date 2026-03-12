import { getSiteBaseUrl } from "@/lib/site-url";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteBaseUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/recipe/", "/invite/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
