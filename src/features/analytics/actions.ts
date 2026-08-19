"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/client";
import { sessions } from "@/db/schema";
import { getCurrentUser } from "@/features/auth/session";

import { trackProductEvent } from "./events";

const sharedEventInput = z.object({
  sessionId: z.uuid(),
  event: z.enum(["invite_shared", "recap_shared"]),
});

export async function trackSharedSessionEvent(input: z.input<typeof sharedEventInput>) {
  const parsed = sharedEventInput.safeParse(input);
  if (!parsed.success) return;
  const [session, user] = await Promise.all([
    db.query.sessions.findFirst({ columns: { id: true }, where: eq(sessions.id, parsed.data.sessionId) }),
    getCurrentUser(),
  ]);
  if (!session) return;
  await trackProductEvent({
    name: parsed.data.event,
    sessionId: session.id,
    userId: user?.id,
    source: user ? "authenticated" : "guest",
  });
}
