import { createClient } from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

/** Sanity client. When projectId is not set (e.g. at build without env), a placeholder is used so the app builds; fetches will fail and callers should handle that. */
export const client = createClient({
  projectId: projectId ?? "build-placeholder",
  dataset,
  apiVersion: "2024-01-01",
  useCdn: false,
});
