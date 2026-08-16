import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { requireUser } from "@/features/auth/session";
import { getServerEnv } from "@/lib/env";
import { parseAdminEmails } from "./validation";

export function isAdminEmail(email: string | null | undefined) {
  return Boolean(email && parseAdminEmails(getServerEnv().ADMIN_EMAILS).has(email.toLowerCase()));
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser("/admin");
  if (!isAdminEmail(user.email)) redirect("/admin-access-denied");
  return user;
}
