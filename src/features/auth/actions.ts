"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getPublicEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { getCurrentUser } from "./session";

const emailSchema = z.email();
const passwordSchema = z
  .string()
  .min(8)
  .max(72)
  .regex(/[A-Za-z]/)
  .regex(/\d/);

function nextPath(formData: FormData) {
  const value = formData.get("next");
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/home";
}

function authError(message: string, destination = "/login"): never {
  redirect(`${destination}?error=${encodeURIComponent(message)}`);
}

export async function sendMagicLink(formData: FormData) {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) authError("Enter a valid email address.");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: `${getPublicEnv().NEXT_PUBLIC_APP_URL}/auth/callback` },
  });
  if (error) authError(error.message);
  redirect("/login?sent=1");
}

export async function signInWithPassword(formData: FormData) {
  const email = emailSchema.safeParse(formData.get("email"));
  const password = passwordSchema.safeParse(formData.get("password"));
  if (!email.success || !password.success)
    authError("Enter a valid email and a password with at least 8 characters, including a letter and number.");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email: email.data, password: password.data });
  if (error) authError("Email or password is incorrect.");
  redirect(nextPath(formData));
}

export async function createPasswordAccount(formData: FormData) {
  const email = emailSchema.safeParse(formData.get("email"));
  const password = passwordSchema.safeParse(formData.get("password"));
  if (!email.success || !password.success)
    authError(
      "Enter a valid email and a password with at least 8 characters, including a letter and number.",
      "/signup",
    );
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
    );
  if (data.session) redirect(nextPath(formData));
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

export async function signInWithGoogle() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${getPublicEnv().NEXT_PUBLIC_APP_URL}/auth/callback` },
  });
  if (error || !data.url) authError(error?.message ?? "Google sign-in could not start.");
  redirect(data.url);
}
