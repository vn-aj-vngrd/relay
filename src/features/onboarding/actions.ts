"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { safeNextPath } from "@/features/auth/destination-path";
import { requireUser } from "@/features/auth/session";
import { ensureProfile } from "@/features/players/profile";

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
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens."),
  city: z.string().trim().max(60, "Keep your city under 60 characters.").optional(),
  skillLevel: z.enum(["new", "casual", "regular", "experienced"]).optional(),
  dominantHand: z.enum(["right", "left", "both"]).optional(),
  discoverySource: z.enum(["friend", "group_chat", "social", "search", "other"]).optional(),
});

export type OnboardingActionState = { error?: string; fieldErrors?: Record<string, string[]> };

function destinationAfterSetup(formData: FormData) {
  const next = safeNextPath(formData.get("next"));
  return next === "/home" ? "/home?tour=1" : next;
}

export async function completeProfileSetup(
  _: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const user = await requireUser();
  await ensureProfile(user);
  const parsed = setupSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    city: formData.get("city") || undefined,
    skillLevel: formData.get("skillLevel") || undefined,
    dominantHand: formData.get("dominantHand") || undefined,
    discoverySource: formData.get("discoverySource") || undefined,
  });
  if (!parsed.success)
    return { error: "Check the details marked below.", fieldErrors: parsed.error.flatten().fieldErrors };

  const usernameOwner = await db.query.profiles.findFirst({
    where: and(eq(profiles.username, parsed.data.username), ne(profiles.userId, user.id)),
  });
  if (usernameOwner)
    return { error: "That username is already taken.", fieldErrors: { username: ["Try another username."] } };

  try {
    await db
      .update(profiles)
      .set({
        name: parsed.data.name,
        username: parsed.data.username,
        city: parsed.data.city || null,
        skillLevel: parsed.data.skillLevel || null,
        dominantHand: parsed.data.dominantHand || null,
        discoverySource: parsed.data.discoverySource || null,
        onboardingCompletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, user.id));
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505")
      return { error: "That username is already taken.", fieldErrors: { username: ["Try another username."] } };
    console.error("Profile setup failed", error);
    return { error: "Your profile couldn’t be saved. Try again." };
  }
  redirect(destinationAfterSetup(formData));
}

export async function skipProfileSetup(formData: FormData) {
  const user = await requireUser();
  await ensureProfile(user);
  await db
    .update(profiles)
    .set({ onboardingCompletedAt: new Date(), updatedAt: new Date() })
    .where(eq(profiles.userId, user.id));
  redirect(destinationAfterSetup(formData));
}

export async function completeProductTour(formData: FormData) {
  const user = await requireUser();
  await ensureProfile(user);
  const destination = z.enum(["/home", "/games/new"]).catch("/home").parse(formData.get("destination"));
  const now = new Date();
  await db
    .update(profiles)
    .set({ onboardingCompletedAt: now, productTourCompletedAt: now, updatedAt: now })
    .where(eq(profiles.userId, user.id));
  revalidatePath("/", "layout");
  redirect(destination);
}
