import "server-only";

import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { getCurrentUser, requireUser } from "@/features/auth/session";
import { getServerEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { parseAdminEmails } from "./validation";

export function isAdminEmail(email: string | null | undefined) {
  return Boolean(
    email &&
      parseAdminEmails(getServerEnv().ADMIN_EMAILS).has(email.toLowerCase())
  );
}

export async function getAuthorizedAdmin(): Promise<User | null> {
  const user = await getCurrentUser();
  return user && isAdminEmail(user.email) ? user : null;
}

export async function getAuthorizedAal2Admin(): Promise<User | null> {
  const user = await getAuthorizedAdmin();
  if (!user) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return !error && data.currentLevel === "aal2" ? user : null;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser("/admin");
  if (!isAdminEmail(user.email)) redirect("/admin-access-denied");

  const supabase = await createSupabaseServerClient();
  const { data, error } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || data.currentLevel !== "aal2") redirect("/admin-security");

  return user;
}
