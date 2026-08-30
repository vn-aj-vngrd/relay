import { createHash } from "node:crypto";

import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getPublicEnv } from "@/lib/env";
import { THEME_INIT_SCRIPT } from "@/lib/theme-init";

const readOnlyWriteExceptions = ["/login", "/signup", "/auth/callback", "/admin-security", "/set-password"];
const sessionRefreshPrefixes = [
  "/admin",
  "/api/admin",
  "/api/games",
  "/api/groups",
  "/api/notifications",
  "/api/search",
  "/court",
  "/feedback",
  "/games",
  "/groups",
  "/help",
  "/home",
  "/notifications",
  "/onboarding",
  "/preferences",
  "/profile",
  "/s/",
  "/search",
  "/set-password",
];
const strictCspPrefixes = ["/admin", "/auth", "/set-password", ...sessionRefreshPrefixes];
const themeInitHash = createHash("sha256").update(THEME_INIT_SCRIPT).digest("base64");

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`),
  );
}

function isBlockedReadOnlyWrite(request: NextRequest) {
  if (process.env.RELAY_READ_ONLY_MODE !== "true" || request.method === "GET" || request.method === "HEAD")
    return false;
  return !readOnlyWriteExceptions.some(
    (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`),
  );
}

function contentSecurityPolicy(nonce: string | null) {
  const isDevelopment = process.env.NODE_ENV === "development";
  const scriptSource = nonce
    ? `script-src 'self' 'nonce-${nonce}' 'sha256-${themeInitHash}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com`
    : `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com`;

  return [
    "default-src 'self'",
    scriptSource,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://lh3.googleusercontent.com",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com https://vitals.vercel-insights.com",
    "frame-src https://challenges.cloudflare.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

function withSecurityHeaders(response: NextResponse, csp: string) {
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export async function proxy(request: NextRequest) {
  const strictCsp = matchesPrefix(request.nextUrl.pathname, strictCspPrefixes);
  const nonce = strictCsp ? Buffer.from(crypto.randomUUID()).toString("base64") : null;
  const csp = contentSecurityPolicy(nonce);

  if (isBlockedReadOnlyWrite(request)) {
    const response = request.headers.has("next-action")
      ? NextResponse.redirect(new URL("/read-only", request.url), 303)
      : NextResponse.json(
          { error: "Relay is temporarily read-only. No changes were saved." },
          { status: 503, headers: { "Cache-Control": "private, no-store", "Retry-After": "900" } },
        );
    return withSecurityHeaders(response, csp);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("Content-Security-Policy", csp);
  if (nonce) requestHeaders.set("x-nonce", nonce);

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  if (matchesPrefix(request.nextUrl.pathname, sessionRefreshPrefixes)) {
    const env = getPublicEnv();
    const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: requestHeaders } });
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    // Refresh expired access tokens only for routes that can consume a session.
    await supabase.auth.getClaims();
  }

  return withSecurityHeaders(response, csp);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/:path*",
    "/auth/:path*",
    "/court/:path*",
    "/feedback/:path*",
    "/games/:path*",
    "/groups/:path*",
    "/help/:path*",
    "/home/:path*",
    "/notifications/:path*",
    "/onboarding/:path*",
    "/preferences/:path*",
    "/profile/:path*",
    "/s/:path*",
    "/search/:path*",
    "/set-password/:path*",
  ],
};
