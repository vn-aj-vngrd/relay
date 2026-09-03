"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/client";
import { sessions } from "@/db/schema";
import { getCurrentUser } from "@/features/auth/session";
import { checkRateLimit, requestIdentity } from "@/lib/rate-limit";

import { trackProductEvent, trackSessionMilestone } from "./events";

const sharedEventInput = z.object({
  sessionId: z.uuid(),
  event: z.enum(["invite_shared", "recap_shared"]),
});

const discoveryEventInput = z.object({
  event: z.enum(["open_games_viewed", "public_game_opened"]),
  sessionId: z.uuid().optional(),
  source: z.enum(["open-games", "search"]),
});

export async function trackDiscoveryEvent(input: z.input<typeof discoveryEventInput>) {
  const parsed = discoveryEventInput.safeParse(input);
  if (!parsed.success || (parsed.data.event === "public_game_opened" && !parsed.data.sessionId)) return;
  const user = await getCurrentUser();
  if (!user) return;
  const session = parsed.data.sessionId
    ? await db.query.sessions.findFirst({
        columns: { id: true },
        where: and(eq(sessions.id, parsed.data.sessionId), eq(sessions.visibility, "public")),
      })
    : null;
  if (parsed.data.sessionId && !session) return;
  const limit = await checkRateLimit({ scope: "discovery-event", limit: 60, windowSeconds: 60 }, `user:${user.id}`);
  if (!limit.allowed) return;
  await trackProductEvent({
    name: parsed.data.event,
    userId: user.id,
    sessionId: session?.id,
    source: "authenticated",
    metadata: { discoverySource: parsed.data.source },
  });
}

export async function trackSharedSessionEvent(input: z.input<typeof sharedEventInput>) {
  const parsed = sharedEventInput.safeParse(input);
  if (!parsed.success) return;
  const [session, user] = await Promise.all([
    db.query.sessions.findFirst({ columns: { id: true }, where: eq(sessions.id, parsed.data.sessionId) }),
    getCurrentUser(),
  ]);
  if (!session) return;
  const limit = await checkRateLimit(
    { scope: "shared-event", limit: 60, windowSeconds: 60 },
    user ? `user:${user.id}` : await requestIdentity(),
  );
  if (!limit.allowed) return;
  await trackSessionMilestone({
    name: parsed.data.event,
    sessionId: session.id,
    userId: user?.id,
    source: user ? "authenticated" : "guest",
  });
}
