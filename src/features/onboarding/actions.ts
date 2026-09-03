"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db/client";
import { profiles, sessionPlayers } from "@/db/schema";
import {
  postSetupDestination,
  safeNextPath,
} from "@/features/auth/destination-path";
import { requireUser } from "@/features/auth/session";
import { validateAvatarFile } from "@/features/players/avatar-validation";
import { playingExperienceValues } from "@/features/players/playing-experience";
import { ensureProfile } from "@/features/players/profile";
import { assertRateLimit, checkRateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { discoverySourceValues } from "./discovery-source";

async function guardOnboardingMutation(userId: string) {
  await assertRateLimit(
    { scope: "onboarding-mutation", limit: 20, windowSeconds: 60 },
    `user:${userId}`,
    "Setup changes are happening too quickly. Wait a moment and try again."
  );
}

const setupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Add the name your friends know you by.")
    .max(60, "Keep your name under 60 characters."),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Use at least 3 characters.")
    .max(24, "Keep your username under 24 characters.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and single hyphens."
    ),
  city: z
    .string()
    .trim()
    .max(60, "Keep your city under 60 characters.")
    .optional(),
  skillLevel: z.enum(playingExperienceValues).optional(),
  dominantHand: z.enum(["right", "left", "both"]).optional(),
  bio: z
    .string()
    .trim()
    .max(240, "Keep your About you text under 240 characters.")
    .optional(),
  discoverySource: z.enum(discoverySourceValues).optional(),
});

export type OnboardingActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function destinationAfterSetup(formData: FormData) {
  return postSetupDestination(formData.get("next"));
}

export async function completeProfileSetup(
  _: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const user = await requireUser();
  await guardOnboardingMutation(user.id);
  const profile = await ensureProfile(user);
  const parsed = setupSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    city: formData.get("city") || undefined,
    skillLevel: formData.get("skillLevel") || undefined,
    dominantHand: formData.get("dominantHand") || undefined,
    bio: formData.get("bio") || undefined,
    discoverySource: formData.get("discoverySource") || undefined,
  });
  if (!parsed.success)
    return {
      error: "Check the details marked below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };

  const usernameOwner = await db.query.profiles.findFirst({
    where: and(
      eq(profiles.username, parsed.data.username),
      ne(profiles.userId, user.id)
    ),
  });
  if (usernameOwner)
    return {
      error: "That username is already taken.",
      fieldErrors: { username: ["Try another username."] },
    };

  const avatarEntry = formData.get("avatar");
  let newAvatarPath: string | null = null;
  if (avatarEntry instanceof File && avatarEntry.size > 0) {
    const validatedAvatar = await validateAvatarFile(avatarEntry);
    if ("error" in validatedAvatar && validatedAvatar.error)
      return {
        error: validatedAvatar.error,
        fieldErrors: { avatar: [validatedAvatar.error] },
      };
    const avatarLimit = await checkRateLimit(
      { scope: "avatar-upload", limit: 10, windowSeconds: 86400 },
      `user:${user.id}`
    );
    if (!avatarLimit.allowed)
      return {
        error:
          "Profile photo changes are temporarily limited. Try again tomorrow.",
        fieldErrors: { avatar: ["Try again tomorrow."] },
      };
    newAvatarPath = `${user.id}/${crypto.randomUUID()}.${validatedAvatar.extension}`;
    const { error: uploadError } = await createSupabaseAdminClient()
      .storage.from("avatars")
      .upload(newAvatarPath, validatedAvatar.file, {
        contentType: validatedAvatar.file.type,
        cacheControl: "31536000",
        upsert: false,
      });
    if (uploadError)
      return {
        error:
          "Your profile photo couldn’t be uploaded. Check your connection and try again.",
      };
  }

  const now = new Date();
  try {
    await db.transaction(async (tx) => {
      await tx
        .update(profiles)
        .set({
          name: parsed.data.name,
          username: parsed.data.username,
          avatarPath: newAvatarPath ?? profile.avatarPath,
          bio: parsed.data.bio || null,
          city: parsed.data.city || null,
          skillLevel: parsed.data.skillLevel || null,
          dominantHand: parsed.data.dominantHand || null,
          discoverySource: parsed.data.discoverySource || null,
          onboardingCompletedAt: now,
          updatedAt: now,
        })
        .where(eq(profiles.userId, user.id));
      await tx
        .update(sessionPlayers)
        .set({ skillLevel: parsed.data.skillLevel || null, updatedAt: now })
        .where(eq(sessionPlayers.userId, user.id));
    });
  } catch (error) {
    if (newAvatarPath)
      await createSupabaseAdminClient()
        .storage.from("avatars")
        .remove([newAvatarPath]);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    )
      return {
        error: "That username is already taken.",
        fieldErrors: { username: ["Try another username."] },
      };
    console.error("Profile setup failed", error);
    return { error: "Your profile couldn’t be saved. Try again." };
  }

  if (
    newAvatarPath &&
    profile.avatarPath?.startsWith(`${user.id}/`) &&
    profile.avatarPath !== newAvatarPath
  ) {
    await createSupabaseAdminClient()
      .storage.from("avatars")
      .remove([profile.avatarPath])
      .catch(() => undefined);
  }
  revalidatePath("/", "layout");
  return { success: true };
}

export async function skipProfileSetup(formData: FormData) {
  const user = await requireUser();
  await guardOnboardingMutation(user.id);
  await ensureProfile(user);
  await db
    .update(profiles)
    .set({ onboardingCompletedAt: new Date(), updatedAt: new Date() })
    .where(eq(profiles.userId, user.id));
  redirect(destinationAfterSetup(formData));
}

export async function completeProductTour(formData: FormData) {
  const user = await requireUser();
  await guardOnboardingMutation(user.id);
  await ensureProfile(user);
  const destination = safeNextPath(formData.get("destination"));
  const now = new Date();
  await db
    .update(profiles)
    .set({
      onboardingCompletedAt: now,
      productTourCompletedAt: now,
      updatedAt: now,
    })
    .where(eq(profiles.userId, user.id));
  revalidatePath("/", "layout");
  redirect(destination);
}
