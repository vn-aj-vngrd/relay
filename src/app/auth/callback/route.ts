import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import { resolvePostAuthDestination } from "@/features/auth/destination";
import { safeNextPath } from "@/features/auth/destination-path";
import { googleOAuthErrorMessage } from "@/features/auth/google-oauth-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const providerError = request.nextUrl.searchParams.get("error");
  if (providerError) {
    const next = safeNextPath(cookieStore.get("relay_auth_next")?.value);
    cookieStore.delete("relay_auth_next");
    const loginParams = new URLSearchParams({ error: googleOAuthErrorMessage(request.nextUrl.searchParams) });
    if (next !== "/home") loginParams.set("next", next);
    return NextResponse.redirect(new URL(`/login?${loginParams}`, request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    cookieStore.delete("relay_auth_next");
    const destination =
      request.nextUrl.searchParams.get("recovery") === "1"
        ? "/forgot-password?error=This+reset+link+is+invalid+or+has+expired.+Request+a+new+one."
        : "/login?error=Missing+authentication+code.";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    cookieStore.delete("relay_auth_next");
    return NextResponse.redirect(
      new URL("/login?error=Authentication+could+not+be+completed.+Try+again.", request.url),
    );
  }
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    cookieStore.delete("relay_auth_next");
    return NextResponse.redirect(new URL("/login?error=Authentication+did+not+finish.", request.url));
  }
  if (request.nextUrl.searchParams.get("recovery") === "1") {
    cookieStore.set("relay_password_recovery", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 600,
      path: "/",
    });
    return NextResponse.redirect(new URL("/update-password", request.url));
  }
  const next = safeNextPath(cookieStore.get("relay_auth_next")?.value);
  cookieStore.delete("relay_auth_next");
  const destination = await resolvePostAuthDestination(next, data.user.id);
  return NextResponse.redirect(new URL(destination, request.url));
}
