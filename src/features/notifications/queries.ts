import "server-only";

import { and, desc, eq, isNull, lt, or } from "drizzle-orm";

import { db } from "@/db/client";
import { notifications, sessions } from "@/db/schema";

import { encodeNotificationCursor, type NotificationCursor } from "./pagination";

export type NotificationFilter = "all" | "unread";
export type NotificationFeedItem = {
  id: string;
  sessionId: string | null;
  type: string;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
  sessionTitle: string | null;
};
export type NotificationPage = { items: NotificationFeedItem[]; nextCursor: string | null };

const NOTIFICATION_PAGE_SIZE = 30;

export async function getNotificationPage(
  userId: string,
  filter: NotificationFilter,
  cursor: NotificationCursor | null = null,
): Promise<NotificationPage> {
  const cursorCondition = cursor
    ? or(
        lt(notifications.createdAt, cursor.at),
        and(eq(notifications.createdAt, cursor.at), lt(notifications.id, cursor.id)),
      )
    : undefined;
  const rows = await db
    .select({ notification: notifications, sessionTitle: sessions.title })
    .from(notifications)
    .leftJoin(sessions, eq(notifications.sessionId, sessions.id))
    .where(
      and(
        eq(notifications.userId, userId),
        filter === "unread" ? isNull(notifications.readAt) : undefined,
        cursorCondition,
      ),
    )
    .orderBy(desc(notifications.createdAt), desc(notifications.id))
    .limit(NOTIFICATION_PAGE_SIZE + 1);
  const hasMore = rows.length > NOTIFICATION_PAGE_SIZE;
  const pageRows = rows.slice(0, NOTIFICATION_PAGE_SIZE);
  const last = pageRows.at(-1)?.notification;

  return {
    items: pageRows.map(({ notification, sessionTitle }) => ({
      id: notification.id,
      sessionId: notification.sessionId,
      type: notification.type,
      payload: notification.payload,
      readAt: notification.readAt?.toISOString() ?? null,
      createdAt: notification.createdAt.toISOString(),
      sessionTitle,
    })),
    nextCursor: hasMore && last ? encodeNotificationCursor({ at: last.createdAt, id: last.id }) : null,
  };
}
