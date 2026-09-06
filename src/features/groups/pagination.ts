import { z } from "zod";

const groupCursorSchema = z.object({
  at: z.iso.datetime({ offset: true }),
  id: z.uuid(),
  upcoming: z.boolean().optional(),
  context: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .optional(),
  snapshot: z.iso.datetime({ offset: true }).optional(),
});

export type GroupCursor = {
  at: Date;
  id: string;
  upcoming?: boolean;
  context?: string;
  snapshot?: string;
};

export function encodeGroupCursor(cursor: GroupCursor) {
  return Buffer.from(
    JSON.stringify({ ...cursor, at: cursor.at.toISOString() }),
    "utf8"
  ).toString("base64url");
}

export function parseGroupCursor(value: string | null): GroupCursor | null {
  if (!value) return null;
  try {
    const parsed = groupCursorSchema.safeParse(
      JSON.parse(Buffer.from(value, "base64url").toString("utf8"))
    );
    return parsed.success
      ? { ...parsed.data, at: new Date(parsed.data.at) }
      : null;
  } catch {
    return null;
  }
}
