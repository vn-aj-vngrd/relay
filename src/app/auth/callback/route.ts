import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import { resolvePostAuthDestination } from "@/features/auth/destination";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/login?error=Missing+authentication+code.", request.url));

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.redirect(new URL("/login?error=Authentication+did+not+finish.", request.url));
  const cookieStore = await cookies();
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
  const next = cookieStore.get("relay_auth_next")?.value ?? "/home";
  cookieStore.delete("relay_auth_next");
  const destination = await resolvePostAuthDestination(next, data.user.id);
  return NextResponse.redirect(new URL(destination, request.url));
}
