import "server-only";
import { eq } from "drizzle-orm";
import type { User } from "@supabase/supabase-js";
import { db } from "@/db/client";
import { profiles } from "@/db/schema";

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 24) || "player";
}

export async function ensureProfile(user: User) {
  const existing = await db.query.profiles.findFirst({ where: eq(profiles.userId, user.id) });
  if (existing) return existing;
  const name = user.user_metadata.full_name ?? user.user_metadata.name ?? user.email?.split("@")[0] ?? "Player";
  const base = slugify(name);
  const username = `${base}-${user.id.slice(0, 5)}`;
  const [created] = await db.insert(profiles).values({ userId: user.id, name, username, avatarPath: user.user_metadata.avatar_url }).returning();
  return created;
}
