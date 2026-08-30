import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getPublicEnv } from "@/lib/env";

const readOnlyWriteExceptions = ["/login", "/signup", "/auth/callback", "/admin-security", "/set-password"];

function isBlockedReadOnlyWrite(request: NextRequest) {
  if (process.env.RELAY_READ_ONLY_MODE !== "true" || request.method === "GET" || request.method === "HEAD")
    return false;
  return !readOnlyWriteExceptions.some(
    (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`),
  );
}

export async function proxy(request: NextRequest) {
  if (isBlockedReadOnlyWrite(request)) {
    if (request.headers.has("next-action")) return NextResponse.redirect(new URL("/read-only", request.url), 303);
    return Response.json(
      { error: "Relay is temporarily read-only. No changes were saved." },
      { status: 503, headers: { "Cache-Control": "private, no-store", "Retry-After": "900" } },
    );
  }

  let response = NextResponse.next({ request });
  const env = getPublicEnv();
  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Refresh expired access tokens before Server Components read the session.
  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
