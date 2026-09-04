import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { venueChangeRequests, venues } from "@/db/schema";

export async function getOwnVenueChangeRequests(userId: string) {
  const rows = await db
    .select({
      id: venueChangeRequests.id,
      requestType: venueChangeRequests.requestType,
      status: venueChangeRequests.status,
      proposedChanges: venueChangeRequests.proposedChanges,
      resolutionNote: venueChangeRequests.resolutionNote,
      createdAt: venueChangeRequests.createdAt,
      updatedAt: venueChangeRequests.updatedAt,
      venueName: venues.name,
    })
    .from(venueChangeRequests)
    .leftJoin(venues, eq(venues.id, venueChangeRequests.venueId))
    .where(eq(venueChangeRequests.submittedById, userId))
    .orderBy(desc(venueChangeRequests.createdAt))
    .limit(20);

  return rows.map((row) => ({
    ...row,
    name:
      row.venueName ??
      (typeof row.proposedChanges.name === "string"
        ? row.proposedChanges.name
        : "Court suggestion"),
  }));
}
