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
import { passwordResetRequestErrorMessage, recoveredPasswordErrorMessage } from "./password-errors";
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
  const captchaToken = z.string().min(1).max(4096).safeParse(formData.get("cf-turnstile-response"));
  if (!email.success || !password.success)
    authError(
      "Enter a valid email and a password with at least 8 characters, including a letter and number.",
      "/login",
      next,
    );
  if (!captchaToken.success) authError("Complete the security check and try again.", "/login", next);
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
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.data,
    password: password.data,
    options: { captchaToken: captchaToken.data },
  });
  if (error || !data.user) authError("Email or password is incorrect.", "/login", next);
  redirect(await resolvePostAuthDestination(next, data.user.id));
}

export async function createPasswordAccount(formData: FormData) {
  const next = nextPath(formData);
  const email = emailSchema.safeParse(formData.get("email"));
  const password = passwordSchema.safeParse(formData.get("password"));
  const captchaToken = z.string().min(1).max(4096).safeParse(formData.get("cf-turnstile-response"));
  if (!email.success || !password.success)
    authError(
      "Enter a valid email and a password with at least 8 characters, including a letter and number.",
      "/signup",
      next,
    );
  if (!captchaToken.success) authError("Complete the security check and try again.", "/signup", next);
  await guardAuthAttempt({
    scope: "password-sign-up",
    email: email.data,
    ipLimit: 30,
    accountLimit: 10,
    windowSeconds: 3600,
    destination: "/signup",
    next,
  });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.data,
    password: password.data,
    options: {
      captchaToken: captchaToken.data,
      emailRedirectTo: `${getPublicEnv().NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });
  if (error)
    authError(
      error.message === "User already registered"
        ? "An account already exists for this email. Log in instead."
        : error.message.includes("beta signup is full")
          ? "Relay’s beta is full right now. Try again after more places open."
          : "We couldn’t create your account. Please try again.",
      "/signup",
      next,
    );
  if (data.session && data.user) redirect(await resolvePostAuthDestination(next, data.user.id));
  const cookieStore = await cookies();
  cookieStore.set("relay_confirmation_email", email.data, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/signup",
  });
  redirect("/signup?sent=account");
}

export async function requestPasswordReset(formData: FormData) {
  const email = emailSchema.safeParse(formData.get("email"));
  const captchaToken = z.string().min(1).max(4096).safeParse(formData.get("cf-turnstile-response"));
  if (!email.success) authError("Enter a valid email address.", "/forgot-password");
  if (!captchaToken.success) authError("Complete the security check and try again.", "/forgot-password");
  await guardAuthAttempt({
    scope: "password-reset",
    email: email.data,
    ipLimit: 8,
    accountLimit: 3,
    windowSeconds: 3600,
    destination: "/forgot-password",
  });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${getPublicEnv().NEXT_PUBLIC_APP_URL}/auth/callback?recovery=1`,
    captchaToken: captchaToken.data,
  });
  if (error) {
    console.error("[relay-password-reset-request]", { code: error.code, status: error.status });
    authError(passwordResetRequestErrorMessage(error), "/forgot-password");
  }
  const cookieStore = await cookies();
  cookieStore.set("relay_recovery_email", email.data, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/forgot-password",
  });
  redirect("/forgot-password?sent=1");
}

export async function updateRecoveredPassword(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = await createSupabaseServerClient();
  const { data: currentUser, error: sessionError } = await supabase.auth.getUser();
  if (sessionError || !currentUser.user || cookieStore.get("relay_password_recovery")?.value !== "1")
    redirect("/forgot-password");
  const password = passwordSchema.safeParse(formData.get("password"));
  const confirmation = formData.get("confirmation");
  if (!password.success) authError("Use at least 8 characters with a letter and number.", "/update-password");
  if (password.data !== confirmation) authError("Passwords do not match.", "/update-password");

  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) {
    console.error("[relay-password-recovery-update]", { code: error.code, status: error.status });
    authError(recoveredPasswordErrorMessage(error), "/update-password");
  }
  cookieStore.delete("relay_password_recovery");
  await supabase.auth.signOut();
  redirect("/login?password=updated");
}

export async function changePassword(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/preferences/password");
  const currentPassword = passwordSchema.safeParse(formData.get("currentPassword"));
  const password = passwordSchema.safeParse(formData.get("password"));
  const confirmation = formData.get("confirmation");
  if (!currentPassword.success) authError("Enter your current password.", "/preferences/password");
  if (!password.success) authError("Use at least 8 characters with a letter and number.", "/preferences/password");
  if (password.data !== confirmation) authError("Passwords do not match.", "/preferences/password");
  if (password.data === currentPassword.data)
    authError("Choose a new password that differs from your current password.", "/preferences/password");

  await guardAuthAttempt({
    scope: "password-change",
    email: user.email,
    ipLimit: 10,
    accountLimit: 5,
    windowSeconds: 3600,
    destination: "/preferences/password",
  });
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    current_password: currentPassword.data,
    password: password.data,
  });
  if (error) {
    const message = error.message.toLowerCase().includes("password")
      ? "Your current password is incorrect."
      : "Your password could not be changed. Try again.";
    authError(message, "/preferences/password");
  }
  redirect("/preferences/password?success=1");
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
