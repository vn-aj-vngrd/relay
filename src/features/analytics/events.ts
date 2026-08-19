import "server-only";

import { z } from "zod";

import { db } from "@/db/client";
import { productEvents } from "@/db/schema";

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
] as const;

const productEventSchema = z.object({
  name: z.enum(productEventNames),
  userId: z.uuid().nullable().optional(),
  sessionId: z.uuid().nullable().optional(),
  source: z.enum(["server", "authenticated", "guest"]).default("server"),
  metadata: z.record(z.string(), z.union([z.string().max(120), z.number(), z.boolean(), z.null()])).default({}),
});

export type ProductEvent = z.input<typeof productEventSchema>;

/** Analytics is best-effort and must never block the game workflow it measures. */
export async function trackProductEvent(input: ProductEvent) {
  const parsed = productEventSchema.parse(input);
  try {
    await db.insert(productEvents).values(parsed);
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
