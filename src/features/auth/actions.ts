"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getPublicEnv } from "@/lib/env";
import { checkRateLimit, requestIdentity } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { resolvePostAuthDestination } from "./destination";
import { safeNextPath } from "./destination-path";
import { getCurrentUser } from "./session";

const emailSchema = z.email();
const passwordSchema = z
  .string()
  .min(8)
  .max(72)
  .regex(/[A-Za-z]/)
  .regex(/\d/);

function nextPath(formData: FormData) {
  return safeNextPath(formData.get("next"));
}

function authError(message: string, destination = "/login", next?: string): never {
  const params = new URLSearchParams({ error: message });
  if (next && next !== "/home") params.set("next", next);
  redirect(`${destination}?${params}`);
}

async function guardAuthAttempt(input: {
  scope: string;
  email?: string;
  ipLimit: number;
  accountLimit?: number;
  windowSeconds: number;
  destination?: string;
  next?: string;
}) {
  const ipResult = await checkRateLimit(
    { scope: `${input.scope}:ip`, limit: input.ipLimit, windowSeconds: input.windowSeconds },
    await requestIdentity(),
  );
  const accountResult = input.email
    ? await checkRateLimit(
        {
          scope: `${input.scope}:account`,
          limit: input.accountLimit ?? input.ipLimit,
          windowSeconds: input.windowSeconds,
        },
        `email:${input.email.toLowerCase()}`,
      )
    : null;
  if (!ipResult.allowed || accountResult?.allowed === false)
    authError("Too many attempts. Wait a few minutes and try again.", input.destination, input.next);
}

export async function sendMagicLink(formData: FormData) {
  const next = nextPath(formData);
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) authError("Enter a valid email address.", "/login", next);
  await guardAuthAttempt({
    scope: "magic-link",
    email: parsed.data,
    ipLimit: 8,
    accountLimit: 3,
    windowSeconds: 3600,
    destination: "/login",
    next,
  });
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: `${getPublicEnv().NEXT_PUBLIC_APP_URL}/auth/callback` },
  });
  if (error) authError(error.message, "/login", next);
  const cookieStore = await cookies();
  cookieStore.set("relay_auth_next", next, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });
  redirect("/login?sent=1");
}

export async function signInWithPassword(formData: FormData) {
  const next = nextPath(formData);
  const email = emailSchema.safeParse(formData.get("email"));
  const password = passwordSchema.safeParse(formData.get("password"));
  if (!email.success || !password.success)
    authError(
      "Enter a valid email and a password with at least 8 characters, including a letter and number.",
      "/login",
      next,
    );
  await guardAuthAttempt({
    scope: "password-sign-in",
    email: email.data,
    ipLimit: 25,
    accountLimit: 12,
    windowSeconds: 600,
    destination: "/login",
    next,
  });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.data, password: password.data });
  if (error || !data.user) authError("Email or password is incorrect.", "/login", next);
  redirect(await resolvePostAuthDestination(next, data.user.id));
}

export async function createPasswordAccount(formData: FormData) {
  const next = nextPath(formData);
  const email = emailSchema.safeParse(formData.get("email"));
  const password = passwordSchema.safeParse(formData.get("password"));
  if (!email.success || !password.success)
    authError(
      "Enter a valid email and a password with at least 8 characters, including a letter and number.",
      "/signup",
      next,
    );
  await guardAuthAttempt({
    scope: "password-sign-up",
    email: email.data,
    ipLimit: 8,
    accountLimit: 3,
    windowSeconds: 3600,
    destination: "/signup",
    next,
  });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.data,
    password: password.data,
  });
  if (error)
    authError(
      error.message === "User already registered"
        ? "An account already exists for this email. Log in instead."
        : "We couldn’t create your account. Please try again.",
      "/signup",
      next,
    );
  if (data.session && data.user) redirect(await resolvePostAuthDestination(next, data.user.id));
  redirect("/signup?sent=account");
}

export async function setTemporaryPassword(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/set-password");
  const password = passwordSchema.safeParse(formData.get("password"));
  const confirmation = formData.get("confirmation");
  if (!password.success)
    redirect(`/set-password?error=${encodeURIComponent("Use at least 8 characters with a letter and number.")}`);
  if (password.data !== confirmation) redirect(`/set-password?error=${encodeURIComponent("Passwords do not match.")}`);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) redirect(`/set-password?error=${encodeURIComponent("Your password could not be updated. Try again.")}`);
  const admin = createSupabaseAdminClient();
  const { error: metadataError } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { force_password_change: false },
  });
  if (metadataError)
    redirect(
      `/set-password?error=${encodeURIComponent("Your password changed, but account setup could not finish. Submit it once more.")}`,
    );
  redirect("/onboarding");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function signInWithGoogle(formData: FormData) {
  const next = nextPath(formData);
  await guardAuthAttempt({ scope: "google-sign-in", ipLimit: 20, windowSeconds: 600, destination: "/login", next });
  const cookieStore = await cookies();
  cookieStore.set("relay_auth_next", next, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${getPublicEnv().NEXT_PUBLIC_APP_URL}/auth/callback` },
  });
  if (error || !data.url) authError(error?.message ?? "Google sign-in could not start.");
  redirect(data.url);
}
