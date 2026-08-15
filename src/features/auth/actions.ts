"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getPublicEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const emailSchema = z.email();
const passwordSchema = z.string().min(8).max(72).regex(/[A-Za-z]/).regex(/\d/);

function nextPath(formData: FormData) {
  const value = formData.get("next");
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function loginError(message: string): never {
  redirect(`/login?error=${encodeURIComponent(message)}`);
}

export async function sendMagicLink(formData: FormData) {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) loginError("Enter a valid email address.");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: `${getPublicEnv().NEXT_PUBLIC_APP_URL}/auth/callback` },
  });
  if (error) loginError(error.message);
  redirect("/login?sent=1");
}

export async function signInWithPassword(formData: FormData) {
  const email = emailSchema.safeParse(formData.get("email"));
  const password = passwordSchema.safeParse(formData.get("password"));
  if (!email.success || !password.success) loginError("Enter a valid email and a password with at least 8 characters, including a letter and number.");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email: email.data, password: password.data });
  if (error) loginError("Email or password is incorrect.");
  redirect(nextPath(formData));
}

export async function createPasswordAccount(formData: FormData) {
  const email = emailSchema.safeParse(formData.get("email"));
  const password = passwordSchema.safeParse(formData.get("password"));
  if (!email.success || !password.success) loginError("Enter a valid email and a password with at least 8 characters, including a letter and number.");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.data,
    password: password.data,
  });
  if (error) loginError(error.message === "User already registered" ? "An account already exists for this email. Sign in instead." : "We couldn’t create your account. Please try again.");
  if (data.session) redirect(nextPath(formData));
  redirect("/login?sent=account");
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
  if (error || !data.url) loginError(error?.message ?? "Google sign-in could not start.");
  redirect(data.url);
}
