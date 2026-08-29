import { z } from "zod";

const cursorSchema = z.object({ at: z.iso.datetime({ offset: true }), id: z.uuid() });

export type GameCursor = { at: Date; id: string };

export function encodeGameCursor(cursor: GameCursor) {
  return Buffer.from(JSON.stringify({ at: cursor.at.toISOString(), id: cursor.id }), "utf8").toString("base64url");
}

export function parseGameCursor(value: string | null | undefined): GameCursor | null {
  if (!value) return null;
  try {
    const parsed = cursorSchema.safeParse(JSON.parse(Buffer.from(value, "base64url").toString("utf8")));
    return parsed.success ? { at: new Date(parsed.data.at), id: parsed.data.id } : null;
  } catch {
    return null;
  }
}
