import "server-only";

import { z } from "zod";

import { db } from "@/db/client";
import { productEvents } from "@/db/schema";

import { sessionMilestoneDedupeKey } from "./milestones";

export const productEventNames = [
  "session_published",
  "invite_shared",
  "rsvp_saved",
  "fourth_player_joined",
  "play_started",
  "first_match_completed",
  "session_completed",
  "recap_shared",
  "play_again_published",
  "group_saved",
  "open_games_viewed",
  "public_game_opened",
  "public_join_submitted",
  "invitation_responded",
] as const;

const productEventSchema = z.object({
  name: z.enum(productEventNames),
  userId: z.uuid().nullable().optional(),
  sessionId: z.uuid().nullable().optional(),
  source: z.enum(["server", "authenticated", "guest"]).default("server"),
  metadata: z.record(z.string(), z.union([z.string().max(120), z.number(), z.boolean(), z.null()])).default({}),
  dedupeKey: z.string().max(180).nullable().optional(),
});

const sessionMilestoneNames = [
  "session_published",
  "invite_shared",
  "fourth_player_joined",
  "play_started",
  "first_match_completed",
  "session_completed",
  "recap_shared",
  "play_again_published",
  "group_saved",
] as const satisfies readonly (typeof productEventNames)[number][];

const sessionMilestoneSchema = productEventSchema.extend({
  name: z.enum(sessionMilestoneNames),
  sessionId: z.uuid(),
});

export type ProductEvent = z.input<typeof productEventSchema>;
type SessionMilestone = Omit<z.input<typeof sessionMilestoneSchema>, "dedupeKey">;

/** Analytics is best-effort and must never block the game workflow it measures. */
export async function trackProductEvent(input: ProductEvent) {
  const parsed = productEventSchema.parse(input);
  try {
    await db.insert(productEvents).values(parsed).onConflictDoNothing({ target: productEvents.dedupeKey });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "product_event_write_failed",
        eventName: parsed.name,
        errorName: error instanceof Error ? error.name : "UnknownError",
      }),
    );
  }
}

/** Records a once-per-game lifecycle milestone, safely ignoring retries. */
export function trackSessionMilestone(input: SessionMilestone) {
  const parsed = sessionMilestoneSchema.parse(input);
  return trackProductEvent({
    ...parsed,
    dedupeKey: sessionMilestoneDedupeKey(parsed.sessionId, parsed.name),
  });
}
