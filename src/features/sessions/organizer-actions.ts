"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db/client";
import { messages, sessionPlayers, sessions } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { assertRateLimit } from "@/lib/rate-limit";

export type OrganizerActionState = { error?: string; message?: string };

const inputSchema = z.object({
  sessionId: z.uuid(),
  version: z.coerce.number().int().positive(),
  leadOrganizerId: z.union([z.uuid(), z.literal("")]),
});

export async function setLeadOrganizerAction(
  _: OrganizerActionState,
  formData: FormData
): Promise<OrganizerActionState> {
  const user = await requireUser();
  await assertRateLimit(
    { scope: "organizer-management", limit: 30, windowSeconds: 60 },
    `user:${user.id}`,
    "Organizer changes are happening too quickly. Wait and try again."
  );
  const parsed = inputSchema.safeParse({
    sessionId: formData.get("sessionId"),
    version: formData.get("version"),
    leadOrganizerId: formData.get("leadOrganizerId") ?? "",
  });
  if (!parsed.success)
    return { error: "Choose a current co-host and try again." };
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, parsed.data.sessionId),
  });
  if (!session || session.hostId !== user.id)
    return { error: "Only the host can choose the lead organizer." };

  const lead = parsed.data.leadOrganizerId
    ? await db.query.sessionPlayers.findFirst({
        where: and(
          eq(sessionPlayers.sessionId, session.id),
          eq(sessionPlayers.userId, parsed.data.leadOrganizerId),
          eq(sessionPlayers.role, "cohost")
        ),
      })
    : null;
  if (parsed.data.leadOrganizerId && !lead)
    return { error: "That player is no longer a co-host." };

  const updated = await db.transaction(async (tx) => {
    await tx.execute(
      sql`select id from ${sessions} where id = ${session.id} for update`
    );
    const [changed] = await tx
      .update(sessions)
      .set({
        leadOrganizerId: lead?.userId ?? null,
        version: sql`${sessions.version} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(sessions.id, session.id),
          eq(sessions.version, parsed.data.version)
        )
      )
      .returning({ id: sessions.id });
    if (!changed) return false;
    await tx.insert(messages).values({
      sessionId: session.id,
      kind: "system",
      body: lead
        ? "The host assigned a lead organizer for Play."
        : "The host removed the lead organizer assignment.",
    });
    return true;
  });
  if (!updated)
    return {
      error: "The game changed on another device. Refresh and try again.",
    };
  revalidatePath(`/games/${session.id}/settings`);
  revalidatePath(`/games/${session.id}/play`);
  revalidatePath(`/s/${session.slug}/play`);
  return {
    message: lead ? "Lead organizer assigned." : "Lead organizer removed.",
  };
}
