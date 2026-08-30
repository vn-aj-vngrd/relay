"use server";

import { randomBytes } from "node:crypto";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { adminAuditLogs, profiles, sessions, users } from "@/db/schema";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { requireAdmin } from "./auth";
import {
  adminCreateUserSchema,
  adminOnboardingResetSchema,
  adminSessionActionSchema,
  adminUpdateProfileSchema,
  adminUserActionSchema,
} from "./validation";

export type AdminActionState = { error?: string; success?: string; temporaryPassword?: string; accountEmail?: string };

function refreshAdminUser(userId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export async function createUserAction(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const actor = await requireAdmin();
  const parsed = adminCreateUserSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    username: formData.get("username"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the account details." };

  const [emailExists, usernameExists] = await Promise.all([
    db.query.users.findFirst({ columns: { id: true }, where: eq(users.email, parsed.data.email) }),
    db.query.profiles.findFirst({ columns: { userId: true }, where: eq(profiles.username, parsed.data.username) }),
  ]);
  if (emailExists) return { error: "An account already uses this email address." };
  if (usernameExists) return { error: "This username is already taken." };

  const temporaryPassword = `Relay-${randomBytes(9).toString("base64url")}7`;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email: parsed.data.email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { name: parsed.data.name },
    app_metadata: { force_password_change: true },
  });
  if (error || !data.user)
    return { error: "Supabase could not create this account. Confirm the email is not already registered." };

  try {
    await db.transaction(async (tx) => {
      await tx
        .insert(profiles)
        .values({ userId: data.user.id, name: parsed.data.name, username: parsed.data.username });
      await tx.insert(adminAuditLogs).values({
        actorUserId: actor.id,
        action: "user.created",
        targetType: "user",
        targetId: data.user.id,
        metadata: { source: "admin_console" },
      });
    });
  } catch {
    await supabase.auth.admin.deleteUser(data.user.id);
    await db.delete(users).where(eq(users.id, data.user.id));
    return { error: "The account was not created because its profile could not be saved." };
  }

  refreshAdminUser(data.user.id);
  return { success: "Account created.", temporaryPassword, accountEmail: parsed.data.email };
}

export async function updateUserProfileAction(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const actor = await requireAdmin();
  const parsed = adminUpdateProfileSchema.safeParse({
    userId: formData.get("userId"),
    name: formData.get("name"),
    username: formData.get("username"),
    city: formData.get("city"),
    skillLevel: formData.get("skillLevel"),
    dominantHand: formData.get("dominantHand"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the profile details." };

  const target = await db.query.users.findFirst({ columns: { id: true }, where: eq(users.id, parsed.data.userId) });
  if (!target) return { error: "This account no longer exists." };
  const duplicate = await db.query.profiles.findFirst({
    columns: { userId: true },
    where: and(eq(profiles.username, parsed.data.username), ne(profiles.userId, target.id)),
  });
  if (duplicate) return { error: "This username is already taken." };

  const existing = await db.query.profiles.findFirst({
    columns: { username: true },
    where: eq(profiles.userId, target.id),
  });
  await db.transaction(async (tx) => {
    await tx
      .insert(profiles)
      .values({
        userId: target.id,
        name: parsed.data.name,
        username: parsed.data.username,
        city: parsed.data.city || null,
        skillLevel: parsed.data.skillLevel || null,
        dominantHand: parsed.data.dominantHand || null,
      })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          name: parsed.data.name,
          username: parsed.data.username,
          city: parsed.data.city || null,
          skillLevel: parsed.data.skillLevel || null,
          dominantHand: parsed.data.dominantHand || null,
          updatedAt: new Date(),
        },
      });
    await tx.insert(adminAuditLogs).values({
      actorUserId: actor.id,
      action: "user.profile_updated",
      targetType: "user",
      targetId: target.id,
      metadata: { fields: ["name", "username", "city", "skill_level", "dominant_hand"] },
    });
  });
  refreshAdminUser(target.id);
  if (existing?.username) revalidatePath(`/profile/${existing.username}`);
  revalidatePath(`/profile/${parsed.data.username}`);
  redirect(`/admin/users/${target.id}`);
}

export async function resetUserOnboardingAction(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const actor = await requireAdmin();
  const parsed = adminOnboardingResetSchema.safeParse({ userId: formData.get("userId") });
  if (!parsed.success) return { error: "Choose a valid account." };

  const profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, parsed.data.userId) });
  if (!profile) return { error: "This account does not have a profile to onboard." };
  if (!profile.onboardingCompletedAt && !profile.productTourCompletedAt)
    return { success: "Onboarding is already waiting for this user." };

  await db.transaction(async (tx) => {
    await tx
      .update(profiles)
      .set({ onboardingCompletedAt: null, productTourCompletedAt: null, updatedAt: new Date() })
      .where(eq(profiles.userId, profile.userId));
    await tx.insert(adminAuditLogs).values({
      actorUserId: actor.id,
      action: "user.onboarding_reset",
      targetType: "user",
      targetId: profile.userId,
      metadata: {
        previousOnboardingCompletedAt: profile.onboardingCompletedAt?.toISOString() ?? null,
        previousProductTourCompletedAt: profile.productTourCompletedAt?.toISOString() ?? null,
      },
    });
  });

  refreshAdminUser(profile.userId);
  revalidatePath("/admin/insights");
  return { success: "Onboarding will start the next time this user opens Relay." };
}

export async function suspendUserAction(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const actor = await requireAdmin();
  const parsed = adminUserActionSchema.safeParse({ userId: formData.get("userId"), reason: formData.get("reason") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the suspension details." };
  if (parsed.data.userId === actor.id) return { error: "You cannot suspend your own account." };

  const target = await db.query.users.findFirst({ where: eq(users.id, parsed.data.userId) });
  if (!target) return { error: "This account no longer exists." };
  if (target.suspendedAt) return { error: "This account is already suspended." };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(target.id, { ban_duration: "876000h" });
  if (error) return { error: "Supabase could not suspend this account. Try again." };

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          suspendedAt: new Date(),
          suspensionReason: parsed.data.reason,
          suspendedById: actor.id,
          updatedAt: new Date(),
        })
        .where(eq(users.id, target.id));
      await tx.insert(adminAuditLogs).values({
        actorUserId: actor.id,
        action: "user.suspended",
        targetType: "user",
        targetId: target.id,
        reason: parsed.data.reason,
      });
    });
  } catch {
    await supabase.auth.admin.updateUserById(target.id, { ban_duration: "none" });
    return { error: "The account was not suspended because the audit record could not be saved." };
  }
  refreshAdminUser(target.id);
  return { success: "Account suspended." };
}

export async function restoreUserAction(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const actor = await requireAdmin();
  const parsed = adminUserActionSchema.safeParse({ userId: formData.get("userId"), reason: formData.get("reason") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the restoration details." };

  const target = await db.query.users.findFirst({ where: eq(users.id, parsed.data.userId) });
  if (!target) return { error: "This account no longer exists." };
  if (!target.suspendedAt) return { error: "This account is already active." };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(target.id, { ban_duration: "none" });
  if (error) return { error: "Supabase could not restore this account. Try again." };

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ suspendedAt: null, suspensionReason: null, suspendedById: null, updatedAt: new Date() })
        .where(eq(users.id, target.id));
      await tx.insert(adminAuditLogs).values({
        actorUserId: actor.id,
        action: "user.restored",
        targetType: "user",
        targetId: target.id,
        reason: parsed.data.reason,
      });
    });
  } catch {
    await supabase.auth.admin.updateUserById(target.id, { ban_duration: "876000h" });
    return { error: "The account was not restored because the audit record could not be saved." };
  }
  refreshAdminUser(target.id);
  return { success: "Account restored." };
}

export async function cancelSessionAction(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const actor = await requireAdmin();
  const parsed = adminSessionActionSchema.safeParse({
    sessionId: formData.get("sessionId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the cancellation details." };

  const session = await db.query.sessions.findFirst({ where: eq(sessions.id, parsed.data.sessionId) });
  if (!session) return { error: "This game no longer exists." };
  if (session.status === "cancelled") return { error: "This game is already cancelled." };
  if (session.status === "completed") return { error: "Completed games cannot be cancelled from the admin console." };

  await db.transaction(async (tx) => {
    await tx
      .update(sessions)
      .set({ status: "cancelled", updatedAt: new Date(), version: session.version + 1 })
      .where(eq(sessions.id, session.id));
    await tx.insert(adminAuditLogs).values({
      actorUserId: actor.id,
      action: "session.cancelled",
      targetType: "session",
      targetId: session.id,
      reason: parsed.data.reason,
      metadata: { title: session.title, previousStatus: session.status },
    });
  });
  revalidatePath("/admin");
  revalidatePath("/admin/sessions");
  revalidatePath(`/games/${session.id}`);
  revalidatePath(`/s/${session.slug}`);
  return { success: "Game cancelled." };
}
