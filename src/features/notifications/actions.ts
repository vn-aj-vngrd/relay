"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db/client";
import { notifications } from "@/db/schema";
import { requireUser } from "@/features/auth/session";

import { notificationPresentation } from "./domain";

export async function markAllNotificationsRead() {
  const user = await requireUser();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));
  revalidatePath("/notifications");
}

export async function markNotificationRead(formData: FormData) {
  const user = await requireUser();
  const id = z.uuid().parse(formData.get("notificationId"));
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, user.id), isNull(notifications.readAt)));
  revalidatePath("/notifications");
}

export async function openNotification(formData: FormData) {
  const user = await requireUser();
  const id = z.uuid().parse(formData.get("notificationId"));
  const item = await db.query.notifications.findFirst({
    where: and(eq(notifications.id, id), eq(notifications.userId, user.id)),
  });
  if (!item) redirect("/notifications");

  if (!item.readAt)
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, item.id), eq(notifications.userId, user.id)));
  revalidatePath("/notifications");
  redirect(
    notificationPresentation({ type: item.type, sessionId: item.sessionId, sessionTitle: null, payload: item.payload })
      .href,
  );
}
