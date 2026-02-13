import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { protocol, rootDomain } from "@/lib/utils";

// -----------------------------------------------------------------------------
// Subdomain detection (app. subdomain = web app, root domain = marketing)
// -----------------------------------------------------------------------------

function isAppSubdomain(request: Request): boolean {
  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0];

  // Local development: app.localhost
  if (hostname === "app.localhost" || hostname === "app.127.0.0.1") {
    return true;
  }

  // Production: app.{rootDomain}
  const rootFormatted = rootDomain.split(":")[0];
  return hostname === `app.${rootFormatted}`;
}

function getAppUrl(request: Request): string {
  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0];
  const port = host.includes(":") ? host.split(":")[1] : "";
  const rootFormatted = rootDomain.split(":")[0];

  if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
    const base = `${protocol}://app.localhost`;
    return port ? `${base}:${port}` : base;
  }

  return `${protocol}://app.${rootFormatted}`;
}

function getMarketingUrl(request: Request): string {
  const host = request.headers.get("host") || "";
  return `${protocol}://${host}`;
}

function isAppRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/recipe") ||
    pathname.startsWith("/invite")
  );
}

function isMarketingOnlyRoute(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname === "/pricing" ||
    pathname === "/beta"
  );
}

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  const onAppSubdomain = isAppSubdomain(req);

  // --- Subdomain routing: handle redirects before auth ---
  if (onAppSubdomain) {
    // On app subdomain: root path → /dashboard
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", getAppUrl(req)));
    }
    // On app subdomain: marketing routes → redirect to main domain
    if (isMarketingOnlyRoute(pathname) && pathname !== "/") {
      return NextResponse.redirect(new URL(pathname, getMarketingUrl(req)));
    }
  } else {
    // On root domain: app routes → redirect to app subdomain
    if (isAppRoute(pathname)) {
      return NextResponse.redirect(
        new URL(pathname + req.nextUrl.search, getAppUrl(req))
      );
    }
  }

  // --- Clerk auth (unchanged) ---
  const isPublicRoute = createRouteMatcher([
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/privacy",
    "/terms",
    "/beta",
    "/invite(.*)",
  ]);

  if (!isPublicRoute(req)) await auth.protect();

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
