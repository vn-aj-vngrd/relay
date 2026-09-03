import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { notificationPreferences, pushSubscriptions } from "@/db/schema";

import { defaultCategoryPreferences } from "./preferences";

export async function getNotificationSettings(userId: string) {
  const [preferences, devices] = await Promise.all([
    db.query.notificationPreferences.findFirst({ where: eq(notificationPreferences.userId, userId) }),
    db.query.pushSubscriptions.findMany({
      columns: { id: true, deviceLabel: true, createdAt: true, lastUsedAt: true },
      where: eq(pushSubscriptions.userId, userId),
      orderBy: desc(pushSubscriptions.lastUsedAt),
    }),
  ]);
  return {
    preferences: preferences ?? {
      userId,
      emailEnabled: false,
      pushEnabled: false,
      emailCategories: defaultCategoryPreferences,
      pushCategories: defaultCategoryPreferences,
      dayBeforeReminder: true,
      hourBeforeReminder: true,
      quietHoursStart: null,
      quietHoursEnd: null,
      timeZone: "Asia/Manila",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    devices,
  };
}
