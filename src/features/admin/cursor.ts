import { z } from "zod";

const cursorSchema = z.object({
  at: z.iso.datetime({ offset: true }),
  id: z.uuid(),
  priority: z.int().optional(),
});
export type AdminCursor = { at: Date; id: string; priority?: number };

export function encodeAdminCursor(cursor: AdminCursor) {
  return Buffer.from(
    JSON.stringify({
      at: cursor.at.toISOString(),
      id: cursor.id,
      priority: cursor.priority,
    }),
    "utf8"
  ).toString("base64url");
}

export function parseAdminCursor(
  value: string | null | undefined
): AdminCursor | null {
  if (!value) return null;
  try {
    const parsed = cursorSchema.safeParse(
      JSON.parse(Buffer.from(value, "base64url").toString("utf8"))
    );
    return parsed.success
      ? {
          at: new Date(parsed.data.at),
          id: parsed.data.id,
          ...(parsed.data.priority === undefined
            ? {}
            : { priority: parsed.data.priority }),
        }
      : null;
  } catch {
    return null;
  }
}
