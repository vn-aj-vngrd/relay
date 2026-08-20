import "server-only";

import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/db/client";
import { profiles, sessionPlayers, sessions } from "@/db/schema";

import { onboardingDestination, safeNextPath, sharedSessionSlug } from "./destination-path";

async function tokenHash(value: string) {
  return crypto.subtle
    .digest("SHA-256", new TextEncoder().encode(value))
    .then((digest) => Buffer.from(digest).toString("hex"));
}

/** Claims a guest RSVP when possible and opens the account version of that same game. */
export async function resolvePostAuthDestination(next: unknown, userId: string) {
  const path = safeNextPath(next);
  const profilePromise = db.query.profiles.findFirst({
    columns: { onboardingCompletedAt: true },
    where: eq(profiles.userId, userId),
  });
  const slug = sharedSessionSlug(path);
  let destination = path;

  if (slug) {
    const session = await db.query.sessions.findFirst({
      columns: { id: true, slug: true },
      where: eq(sessions.slug, slug),
    });
    if (session) {
      const membership = await db.query.sessionPlayers.findFirst({
        columns: { id: true },
        where: and(eq(sessionPlayers.sessionId, session.id), eq(sessionPlayers.userId, userId)),
      });
      if (membership) destination = `/games/${session.id}`;
      else {
        const cookieStore = await cookies();
        const guestToken = cookieStore.get(`relay_guest_${session.id}`)?.value;
        if (guestToken) {
          const guest = await db.query.sessionPlayers.findFirst({
            columns: { id: true },
            where: and(
              eq(sessionPlayers.sessionId, session.id),
              eq(sessionPlayers.guestTokenHash, await tokenHash(guestToken)),
            ),
          });
          if (guest) {
            const claimed = await db
              .update(sessionPlayers)
              .set({ userId, guestTokenHash: null, updatedAt: new Date() })
              .where(and(eq(sessionPlayers.id, guest.id), eq(sessionPlayers.sessionId, session.id)))
              .returning({ id: sessionPlayers.id });
            if (claimed.length) {
              cookieStore.delete(`relay_guest_${session.id}`);
              destination = `/games/${session.id}`;
            }
          }
        }
      }
    }
  }

  const profile = await profilePromise;
  return onboardingDestination(destination, Boolean(profile?.onboardingCompletedAt));
}
