import "server-only";

import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/db/client";
import { sessionPlayers, sessions } from "@/db/schema";

import { safeNextPath, sharedSessionSlug } from "./destination-path";

async function tokenHash(value: string) {
  return crypto.subtle
    .digest("SHA-256", new TextEncoder().encode(value))
    .then((digest) => Buffer.from(digest).toString("hex"));
}

/** Claims a guest RSVP when possible and opens the account version of that same game. */
export async function resolvePostAuthDestination(next: unknown, userId: string) {
  const path = safeNextPath(next);
  const slug = sharedSessionSlug(path);
  if (!slug) return path;

  const session = await db.query.sessions.findFirst({
    columns: { id: true, slug: true },
    where: eq(sessions.slug, slug),
  });
  if (!session) return path;

  const membership = await db.query.sessionPlayers.findFirst({
    columns: { id: true },
    where: and(eq(sessionPlayers.sessionId, session.id), eq(sessionPlayers.userId, userId)),
  });
  if (membership) return `/games/${session.id}`;

  const cookieStore = await cookies();
  const guestToken = cookieStore.get(`relay_guest_${session.id}`)?.value;
  if (!guestToken) return path;
  const guest = await db.query.sessionPlayers.findFirst({
    columns: { id: true },
    where: and(
      eq(sessionPlayers.sessionId, session.id),
      eq(sessionPlayers.guestTokenHash, await tokenHash(guestToken)),
    ),
  });
  if (!guest) return path;

  const claimed = await db
    .update(sessionPlayers)
    .set({ userId, guestTokenHash: null, updatedAt: new Date() })
    .where(and(eq(sessionPlayers.id, guest.id), eq(sessionPlayers.sessionId, session.id)))
    .returning({ id: sessionPlayers.id });
  if (!claimed.length) return path;
  cookieStore.delete(`relay_guest_${session.id}`);
  return `/games/${session.id}`;
}
