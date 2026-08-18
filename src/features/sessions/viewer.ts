import "server-only";

import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/db/client";
import { sessionPlayers } from "@/db/schema";
import { getCurrentUser } from "@/features/auth/session";

async function hashToken(token: string) {
  return crypto.subtle
    .digest("SHA-256", new TextEncoder().encode(token))
    .then((value) => Buffer.from(value).toString("hex"));
}

export async function getSessionViewer(sessionId: string, slug: string) {
  const user = await getCurrentUser();
  if (user) {
    const player = await db.query.sessionPlayers.findFirst({
      where: and(eq(sessionPlayers.sessionId, sessionId), eq(sessionPlayers.userId, user.id)),
    });
    if (player) return { user, player, isGuest: false as const };
  }
  const token = (await cookies()).get(`relay_guest_${sessionId}`)?.value;
  if (!token) return null;
  const tokenHash = await hashToken(token);
  const player = await db.query.sessionPlayers.findFirst({
    where: and(eq(sessionPlayers.sessionId, sessionId), eq(sessionPlayers.guestTokenHash, tokenHash)),
  });
  if (!player) return null;
  return { user: null, player, isGuest: true as const, slug };
}

export function canParticipate(rsvp: string) {
  return ["going", "maybe", "waitlisted"].includes(rsvp);
}
