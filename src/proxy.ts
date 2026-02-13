import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// -----------------------------------------------------------------------------
// Subdomain detection (app. subdomain = web app, root domain = marketing)
// -----------------------------------------------------------------------------

const rootDomain = process.env.VERCEL_URL || "localhost:3000";

/** Derive protocol from request — crucial for ngrok/proxy where TLS is terminated upstream */
function getProtocol(request: Request): "http" | "https" {
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded === "https") return "https";
  const host = request.headers.get("host") ?? "";
  // ngrok, Vercel, etc. always use HTTPS — default to it for non-localhost
  if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
    return "https";
  }
  return "http";
}

function isAppSubdomain(request: Request): boolean {
  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0];

  // Production: app.{rootDomain}
  const rootFormatted = rootDomain.split(":")[0];
  return hostname === `app.${rootFormatted}`;
}

function getAppUrl(request: Request): string {
  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0];
  const port = host.includes(":") ? host.split(":")[1] : "";
  const rootFormatted = rootDomain.split(":")[0];
  const protocol = getProtocol(request);

  if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
    const base = `${protocol}://app.localhost`;
    return port ? `${base}:${port}` : base;
  }

  return `${protocol}://app.${rootFormatted}`;
}

function getMarketingUrl(request: Request): string {
  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0];
  const port = host.includes(":") ? host.split(":")[1] : "";
  const protocol = getProtocol(request);

  // Strip "app." prefix if present to get root domain
  const rootHostname = hostname.startsWith("app.")
    ? hostname.slice(4)
    : hostname;

  const base = `${protocol}://${rootHostname}`;
  return port ? `${base}:${port}` : base;
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

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/privacy",
  "/terms",
  "/beta",
  "/invite(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // Skip subdomain routing in development — all paths work on localhost
  const host = req.headers.get("host") || "";
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
  if (isLocal) {
    if (!isPublicRoute(req)) await auth.protect();
    return NextResponse.next();
  }

  const onAppSubdomain = isAppSubdomain(req);

  // --- Subdomain routing (production only) ---
  if (onAppSubdomain) {
    // On app subdomain: root path → /dashboard
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", getAppUrl(req)));
    }
    // On app subdomain: marketing routes → redirect to main domain
    if (isMarketingOnlyRoute(pathname)) {
      return NextResponse.redirect(new URL(pathname, getMarketingUrl(req)));
    }
  } else {
    // On root domain: app routes → redirect to app subdomain
    if (isAppRoute(pathname)) {
      return NextResponse.redirect(
        new URL(pathname + req.nextUrl.search, getAppUrl(req)),
      );
    }
  }

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
