import { createClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const token = process.env.SANITY_API_WRITE_TOKEN;

/**
 * True when Sanity write is configured (projectId + token). Use for gating draft creation.
 */
export const isSanityWriteConfigured = Boolean(projectId && token);

/**
 * Server-only Sanity client with write token. Use only in server actions or API routes.
 * Throws if SANITY_API_WRITE_TOKEN or NEXT_PUBLIC_SANITY_PROJECT_ID is missing when called.
 */
export function getSanityWriteClient() {
  if (!projectId) {
    throw new Error("NEXT_PUBLIC_SANITY_PROJECT_ID is required for Sanity write.");
  }
  if (!token) {
    throw new Error("SANITY_API_WRITE_TOKEN is required for Sanity write.");
  }
  return createClient({
    projectId,
    dataset,
    apiVersion: "2024-01-01",
    useCdn: false,
    token,
  });
}
