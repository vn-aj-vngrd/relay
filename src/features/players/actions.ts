"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { validateAvatarFile } from "./avatar-validation";
import { playingExperienceValues } from "./playing-experience";
import { ensureProfile } from "./profile";

export type AvatarActionState = { error?: string; success?: boolean };
export type ProfileDetailsActionState = { error?: string; success?: string; fieldErrors?: Record<string, string[]> };

const profileDetailsSchema = z.object({
  name: z.string().trim().min(2, "Add the name your friends know you by.").max(60),
  bio: z.string().trim().max(240, "Keep your bio under 240 characters."),
  city: z.string().trim().max(60, "Keep your city under 60 characters."),
  skillLevel: z.union([z.literal(""), z.enum(playingExperienceValues)]),
  dominantHand: z.enum(["", "right", "left", "both"]),
});

export async function updateOwnProfileAction(
  _: ProfileDetailsActionState,
  formData: FormData,
): Promise<ProfileDetailsActionState> {
  const user = await requireUser();
  const profile = await ensureProfile(user);
  const parsed = profileDetailsSchema.safeParse({
    name: formData.get("name"),
    bio: formData.get("bio") ?? "",
    city: formData.get("city") ?? "",
    skillLevel: formData.get("skillLevel") ?? "",
    dominantHand: formData.get("dominantHand") ?? "",
  });
  if (!parsed.success)
    return { error: "Check the fields marked below.", fieldErrors: parsed.error.flatten().fieldErrors };

  await db
    .update(profiles)
    .set({
      name: parsed.data.name,
      bio: parsed.data.bio || null,
      city: parsed.data.city || null,
      skillLevel: parsed.data.skillLevel || null,
      dominantHand: parsed.data.dominantHand || null,
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, user.id));
  revalidatePath(`/profile/${profile.username}`);
  revalidatePath("/", "layout");
  return { success: "Player details saved." };
}

export async function uploadAvatarAction(_: AvatarActionState, formData: FormData): Promise<AvatarActionState> {
  const user = await requireUser();
  const profile = await ensureProfile(user);
  const validated = await validateAvatarFile(formData.get("avatar"));
  if ("error" in validated) return { error: validated.error };
  const limit = await checkRateLimit({ scope: "avatar-upload", limit: 10, windowSeconds: 86400 }, `user:${user.id}`);
  if (!limit.allowed) return { error: "Profile photo changes are temporarily limited. Try again tomorrow." };
  const image = validated.file;
  const path = `${user.id}/${crypto.randomUUID()}.${validated.extension}`;
  const supabase = createSupabaseAdminClient();
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, image, { contentType: image.type, cacheControl: "31536000", upsert: false });
  if (uploadError) return { error: "Your photo couldn’t be uploaded. Check your connection and try again." };

  try {
    await db.update(profiles).set({ avatarPath: path, updatedAt: new Date() }).where(eq(profiles.userId, user.id));
  } catch (error) {
    await supabase.storage.from("avatars").remove([path]);
    console.error("Avatar profile update failed", error);
    return { error: "Your profile photo couldn’t be saved. Try again." };
  }

  if (profile.avatarPath?.startsWith(`${user.id}/`) && profile.avatarPath !== path) {
    await supabase.storage
      .from("avatars")
      .remove([profile.avatarPath])
      .catch(() => undefined);
  }
  revalidatePath(`/profile/${profile.username}`);
  revalidatePath("/", "layout");
  return { success: true };
}
