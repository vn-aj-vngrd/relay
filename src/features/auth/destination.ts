import "server-only";

import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/db/client";
import { notifications, profiles, sessionPlayers, sessions } from "@/db/schema";
import { trackProductEvent } from "@/features/analytics/events";

import {
  onboardingDestination,
  safeNextPath,
  sharedSessionSlug,
} from "./destination-path";

async function tokenHash(value: string) {
  return crypto.subtle
    .digest("SHA-256", new TextEncoder().encode(value))
    .then((digest) => Buffer.from(digest).toString("hex"));
}

/** Claims a guest RSVP when possible and opens the account version of that same game. */
export async function resolvePostAuthDestination(
  next: unknown,
  userId: string
) {
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
        columns: { id: true, rsvp: true },
        where: and(
          eq(sessionPlayers.sessionId, session.id),
          eq(sessionPlayers.userId, userId)
        ),
      });
      if (membership) destination = `/games/${session.id}`;

      const cookieStore = await cookies();
      const guestToken = cookieStore.get(`relay_guest_${session.id}`)?.value;
      if (guestToken && (!membership || membership.rsvp === "invited")) {
        const guestTokenHash = await tokenHash(guestToken);
        const guest = await db.query.sessionPlayers.findFirst({
          columns: { id: true },
          where: and(
            eq(sessionPlayers.sessionId, session.id),
            eq(sessionPlayers.guestTokenHash, guestTokenHash)
          ),
        });
        if (guest) {
          try {
            const claimedGuestId = await db.transaction(async (tx) => {
              if (membership) {
                const removedInvite = await tx
                  .delete(sessionPlayers)
                  .where(
                    and(
                      eq(sessionPlayers.id, membership.id),
                      eq(sessionPlayers.sessionId, session.id),
                      eq(sessionPlayers.userId, userId),
                      eq(sessionPlayers.rsvp, "invited")
                    )
                  )
                  .returning({ id: sessionPlayers.id });
                if (!removedInvite.length)
                  throw new Error(
                    "Account invitation changed before guest claim"
                  );
              }
              const claimed = await tx
                .update(sessionPlayers)
                .set({ userId, guestTokenHash: null, updatedAt: new Date() })
                .where(
                  and(
                    eq(sessionPlayers.id, guest.id),
                    eq(sessionPlayers.sessionId, session.id),
                    eq(sessionPlayers.guestTokenHash, guestTokenHash)
                  )
                )
                .returning({ id: sessionPlayers.id });
              if (!claimed.length)
                throw new Error("Guest response changed before account claim");
              await tx
                .update(notifications)
                .set({ readAt: new Date() })
                .where(
                  and(
                    eq(notifications.userId, userId),
                    eq(notifications.sessionId, session.id),
                    eq(notifications.type, "session_invite")
                  )
                );
              return claimed[0].id;
            });
            cookieStore.delete(`relay_guest_${session.id}`);
            destination = `/games/${session.id}`;
            await trackProductEvent({
              name: "guest_rsvp_claimed",
              userId,
              sessionId: session.id,
              source: "authenticated",
              dedupeKey: `guest-rsvp-claimed:${claimedGuestId}`,
            });
          } catch (error) {
            console.error(
              "Guest RSVP claim failed",
              error instanceof Error ? error.name : "UnknownError"
            );
          }
        }
      }
    }
  }

  const profile = await profilePromise;
  return onboardingDestination(
    destination,
    Boolean(profile?.onboardingCompletedAt)
  );
}
