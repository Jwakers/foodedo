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
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.convex.cloud",
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
