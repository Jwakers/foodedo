import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/ingest(.*)",
  "/faq",
  "/support(.*)",
  "/family-meal-planning",
  "/recipe-to-shopping-list",
  "/household-meal-planning",
  "/privacy",
  "/terms",
  "/pricing",
  "/beta",
  "/blog",
  "/blog/(.*)",
  "/discover",
  "/discover/(.*)",
  "/invite(.*)",
  "/robots.txt",
  "/sitemap(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Keep homepage public, but avoid broad matcher patterns accidentally
  // treating all routes as public.
  const isHomepage = req.nextUrl.pathname === "/";
  if (!isHomepage && !isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp4|webm|vtt)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
