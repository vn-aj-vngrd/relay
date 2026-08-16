"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { validateAvatarFile } from "./avatar-validation";
import { ensureProfile } from "./profile";

export type AvatarActionState = { error?: string; success?: boolean };

export async function uploadAvatarAction(_: AvatarActionState, formData: FormData): Promise<AvatarActionState> {
  const user = await requireUser();
  const profile = await ensureProfile(user);
  const validated = await validateAvatarFile(formData.get("avatar"));
  if ("error" in validated) return { error: validated.error };
  const image = validated.file;
  const path = `${user.id}/${crypto.randomUUID()}.${validated.extension}`;
  const supabase = createSupabaseAdminClient();
  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, image, { contentType: image.type, cacheControl: "31536000", upsert: false });
  if (uploadError) return { error: "Your photo couldn’t be uploaded. Check your connection and try again." };

  try {
    await db.update(profiles).set({ avatarPath: path, updatedAt: new Date() }).where(eq(profiles.userId, user.id));
  } catch (error) {
    await supabase.storage.from("avatars").remove([path]);
    console.error("Avatar profile update failed", error);
    return { error: "Your profile photo couldn’t be saved. Try again." };
  }

  if (profile.avatarPath?.startsWith(`${user.id}/`) && profile.avatarPath !== path) {
    await supabase.storage.from("avatars").remove([profile.avatarPath]).catch(() => undefined);
  }
  revalidatePath(`/profile/${profile.username}`);
  revalidatePath("/", "layout");
  return { success: true };
}
