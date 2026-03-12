import { createClient } from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

/** True when Sanity is configured (projectId set). Callers can branch on this to skip fetches when disabled. */
export const isSanityConfigured = Boolean(projectId);

if (!projectId && process.env.NODE_ENV === "production") {
  throw new Error(
    "NEXT_PUBLIC_SANITY_PROJECT_ID is required when running in production.",
  );
}

/** Sanity client. When projectId is not set (e.g. at build without env), a placeholder is used so the app builds; fetches will fail and callers should handle that. */
export const client = createClient({
  projectId: projectId ?? "build-placeholder",
  dataset,
  apiVersion: "2024-01-01",
  useCdn: false,
});
