import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const getCurrentUser = cache(async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
});

export async function requireUser(next = "/home") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  const account = await db.query.users.findFirst({ columns: { suspendedAt: true }, where: eq(users.id, user.id) });
  if (account?.suspendedAt) redirect("/account-suspended");
  if (user.app_metadata.force_password_change === true) redirect("/set-password");
  return user;
}
