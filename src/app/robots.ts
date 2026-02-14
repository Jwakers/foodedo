import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.VERCEL_URL
    ? `${process.env.NODE_ENV === "production" ? "https://" : "http://"}${process.env.VERCEL_URL}`
    : "https://foodedo-app.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/recipe/", "/invite/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
