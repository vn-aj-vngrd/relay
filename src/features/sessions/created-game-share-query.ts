import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { productEvents } from "@/db/schema";

export function createdGameDismissalKey(userId: string, sessionId: string) {
  return `session:${sessionId}:created-game-dismissed:${userId}`;
}

/** The URL marker is not state: every Overview load reads durable dismissal. */
export async function shouldShowCreatedGameShare({
  userId,
  sessionId,
  status,
  canManage,
}: {
  userId: string;
  sessionId: string;
  status: string;
  canManage: boolean;
}) {
  if (!canManage || status !== "published") return false;
  const dismissal = await db.query.productEvents.findFirst({
    columns: { id: true },
    where: eq(
      productEvents.dedupeKey,
      createdGameDismissalKey(userId, sessionId)
    ),
  });
  return !dismissal;
}
