import { z } from "zod";

const notificationCursorSchema = z.object({
  at: z.iso.datetime({ offset: true }),
  id: z.uuid(),
});

export type NotificationCursor = { at: Date; id: string };

export function encodeNotificationCursor(cursor: NotificationCursor) {
  return Buffer.from(
    JSON.stringify({ at: cursor.at.toISOString(), id: cursor.id }),
    "utf8"
  ).toString("base64url");
}

export function parseNotificationCursor(
  value: string | null
): NotificationCursor | null {
  if (!value) return null;
  try {
    const parsed = notificationCursorSchema.safeParse(
      JSON.parse(Buffer.from(value, "base64url").toString("utf8"))
    );
    return parsed.success
      ? { at: new Date(parsed.data.at), id: parsed.data.id }
      : null;
  } catch {
    return null;
  }
}
