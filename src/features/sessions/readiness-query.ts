import "server-only";

import { and, eq, isNull, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { sessionPlayers, type sessions } from "@/db/schema";

import { eligiblePlayPlayers, sessionReadiness } from "./readiness";

// Mirrors eligiblePlayPlayers for batched Home/Games summaries.
export const eligiblePlayerCount = sql<number>`case
  when count(*) filter (where ${sessionPlayers.rsvp} = 'going' and ${sessionPlayers.leftAt} is null
    and (${sessionPlayers.checkedInAt} is not null or ${sessionPlayers.playState} = 'unavailable')) > 0
  then count(*) filter (where ${sessionPlayers.rsvp} = 'going' and ${sessionPlayers.leftAt} is null
    and ${sessionPlayers.checkedInAt} is not null)
  else count(*) filter (where ${sessionPlayers.rsvp} = 'going' and ${sessionPlayers.leftAt} is null)
end`;

export async function loadPlayReadiness(
  session: Pick<
    typeof sessions.$inferSelect,
    "id" | "bookedAt" | "bookingNotRequired"
  >,
  reader: Pick<typeof db, "select"> = db
) {
  const goingPlayers = await reader
    .select()
    .from(sessionPlayers)
    .where(
      and(
        eq(sessionPlayers.sessionId, session.id),
        eq(sessionPlayers.rsvp, "going"),
        isNull(sessionPlayers.leftAt)
      )
    );
  const activePlayers = eligiblePlayPlayers(goingPlayers);
  return {
    goingPlayers,
    activePlayers,
    readiness: sessionReadiness({
      goingCount: activePlayers.length,
      booked: Boolean(session.bookedAt),
      bookingNotRequired: session.bookingNotRequired,
    }),
  };
}
