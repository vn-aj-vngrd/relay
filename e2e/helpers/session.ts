import { createClient } from "@supabase/supabase-js";
import { assertDisposableUser, fixtureConfig } from "./auth";

/** Resume only an explicitly named, still-published artifact owned by the fixture account. */
export async function reusableTestGame(baseURL: string, id: string) {
  const config = fixtureConfig(process.env, baseURL);
  const admin = createClient(config.supabaseURL, config.secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: identity, error: userError } =
    await admin.auth.admin.getUserById(config.userId);
  if (userError || !identity.user)
    throw new Error("Could not verify disposable game owner.");
  assertDisposableUser(identity.user, config);
  const { data, error } = await admin
    .from("sessions")
    .select("id,title,host_id,status,visibility")
    .eq("id", id)
    .single();
  if (
    error ||
    !data ||
    data.host_id !== config.userId ||
    data.status !== "published" ||
    data.visibility !== "link" ||
    !data.title.startsWith("Relay E2E ")
  )
    throw new Error("Refusing to reuse an unverified test game.");
  return { id: data.id as string, title: data.title as string };
}
