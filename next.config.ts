import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
});

const nextConfig: NextConfig = {
  turbopack: {},
  /**
   * Admin generator server actions read docs files at runtime.
   * Without tracing includes, Vercel/serverless bundles omit `docs/`, causing ENOENT.
   */
  outputFileTracingIncludes: {
    "/dashboard/admin/blog-generator": ["./docs/BLOG-CREATION-BRIEF.md"],
    "/dashboard/admin/recipe-enhance": [
      "./docs/RECIPE-GENERATION-PROMPT.md",
      "./docs/RECIPE_AUTHORING_METHODOLOGY.md",
    ],
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },
  skipTrailingSlashRedirect: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.convex.cloud",
      },
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb", // Allow up to 15MB for image uploads (3 images with base64 encoding overhead)
    },
  },
};

export default withSerwist(nextConfig);
