/**
 * Serialize JSON-LD safely for inline <script type="application/ld+json"> blocks.
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
