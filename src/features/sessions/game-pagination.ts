import { createHash } from "node:crypto";
import { z } from "zod";
import type {
  GameCollectionPhase,
  GameCollectionScope,
} from "./game-collection-types";
import {
  type GameLibraryFilters,
  gameLibrarySearchParams,
} from "./game-library-filters";

const cursorSchema = z.object({
  at: z.iso.datetime({ offset: true }),
  id: z.uuid(),
  snapshot: z.iso.datetime({ offset: true }).optional(),
  context: z.string().max(2000).optional(),
});

export type GameCursor = {
  at: Date;
  id: string;
  snapshot?: string;
  context?: string;
};

export function gameCursorContext(
  userId: string,
  phase: GameCollectionPhase,
  scope: GameCollectionScope,
  filters: GameLibraryFilters
) {
  return createHash("sha256")
    .update(`${userId}:${phase}:${scope}:${gameLibrarySearchParams(filters)}`)
    .digest("hex");
}

export function encodeGameCursor(cursor: GameCursor) {
  return Buffer.from(
    JSON.stringify({ ...cursor, at: cursor.at.toISOString() }),
    "utf8"
  ).toString("base64url");
}

export function parseGameCursor(
  value: string | null | undefined
): GameCursor | null {
  if (!value) return null;
  try {
    const parsed = cursorSchema.safeParse(
      JSON.parse(Buffer.from(value, "base64url").toString("utf8"))
    );
    return parsed.success
      ? { ...parsed.data, at: new Date(parsed.data.at) }
      : null;
  } catch {
    return null;
  }
}
