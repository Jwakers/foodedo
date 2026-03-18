import { ConvexHttpClient } from "convex/browser";

export function getConvexHttpClient(options?: { auth?: string }) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");
  }
  return new ConvexHttpClient(url, options?.auth ? { auth: options.auth } : {});
}

