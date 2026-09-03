"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db/client";
import { type NotificationCategoryPreferences, notificationPreferences, pushSubscriptions } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { assertRateLimit } from "@/lib/rate-limit";

import { notificationCategories } from "./preferences";

export type NotificationSettingsState = { success?: string; error?: string };

const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
  .nullable();

function checked(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function validTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export async function saveNotificationSettings(
  _: NotificationSettingsState,
  formData: FormData,
): Promise<NotificationSettingsState> {
  const user = await requireUser("/preferences");
  await assertRateLimit(
    { scope: "notification-preferences", limit: 20, windowSeconds: 60 },
    `user:${user.id}`,
    "Notification preferences are changing too quickly. Wait a moment and try again.",
  );
  const quietStart = time.safeParse(formData.get("quietHoursStart") || null);
  const quietEnd = time.safeParse(formData.get("quietHoursEnd") || null);
  const timeZone = String(formData.get("timeZone") || "Asia/Manila");
  if (!quietStart.success || !quietEnd.success || !validTimeZone(timeZone))
    return { error: "Choose valid quiet hours and time zone." };

  const emailCategories = Object.fromEntries(
    notificationCategories.map((category) => [category, checked(formData, `email-${category}`)]),
  ) as NotificationCategoryPreferences;
  const pushCategories = Object.fromEntries(
    notificationCategories.map((category) => [category, checked(formData, `push-${category}`)]),
  ) as NotificationCategoryPreferences;
  const values = {
    emailEnabled: checked(formData, "emailEnabled"),
    pushEnabled: checked(formData, "pushEnabled"),
    emailCategories,
    pushCategories,
    dayBeforeReminder: checked(formData, "dayBeforeReminder"),
    hourBeforeReminder: checked(formData, "hourBeforeReminder"),
    quietHoursStart: quietStart.data,
    quietHoursEnd: quietEnd.data,
    timeZone,
    updatedAt: new Date(),
  };
  await db
    .insert(notificationPreferences)
    .values({ userId: user.id, ...values })
    .onConflictDoUpdate({ target: notificationPreferences.userId, set: values });
  revalidatePath("/preferences");
  return { success: "Notification preferences saved." };
}

export async function removePushDevice(formData: FormData) {
  const user = await requireUser("/preferences");
  await assertRateLimit(
    { scope: "push-device-remove", limit: 20, windowSeconds: 60 },
    `user:${user.id}`,
    "Device changes are happening too quickly. Wait a moment and try again.",
  );
  const deviceId = z.uuid().parse(formData.get("deviceId"));
  await db
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.id, deviceId), eq(pushSubscriptions.userId, user.id)));
  revalidatePath("/preferences");
}
