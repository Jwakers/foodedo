import { APP_NAME } from "@/app/constants";
import { SITE_DEFAULT_DESCRIPTION, SITE_DEFAULT_TITLE } from "@/lib/site-messaging";
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_DEFAULT_TITLE,
    short_name: APP_NAME,
    description: SITE_DEFAULT_DESCRIPTION,
    orientation: "portrait",
    categories: ["food", "lifestyle", "productivity"],
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    start_url: "/dashboard",
    scope: "/",
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    lang: "en-GB",
    dir: "ltr",
  };
}
