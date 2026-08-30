import { z } from "zod";

const groupCursorSchema = z.object({ at: z.iso.datetime({ offset: true }), id: z.uuid() });

export type GroupCursor = { at: Date; id: string };

export function encodeGroupCursor(cursor: GroupCursor) {
  return Buffer.from(JSON.stringify({ at: cursor.at.toISOString(), id: cursor.id }), "utf8").toString("base64url");
}

export function parseGroupCursor(value: string | null): GroupCursor | null {
  if (!value) return null;
  try {
    const parsed = groupCursorSchema.safeParse(JSON.parse(Buffer.from(value, "base64url").toString("utf8")));
    return parsed.success ? { at: new Date(parsed.data.at), id: parsed.data.id } : null;
  } catch {
    return null;
  }
}
