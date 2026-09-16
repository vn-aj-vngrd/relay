import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db as defaultDb } from "@/db/client";
import { groupMembers, groups, sessionPlayers, sessions } from "@/db/schema";
import { trackSessionMilestone } from "@/features/analytics/events";
import type { requireUser } from "@/features/auth/session";
import type { CreationHooks } from "@/features/sessions/create-session-command";
import { assertRateLimit } from "@/lib/rate-limit";
import type { GroupActionState } from "./actions";
import { createGroupSchema, groupSlug } from "./domain";

export async function createGroupCommand(
  user: Awaited<ReturnType<typeof requireUser>>,
  formData: FormData,
  hooks?: CreationHooks
): Promise<GroupActionState & { destination?: string }> {
  const db = defaultDb;
  await assertRateLimit(
    { scope: "group-mutation", limit: 30, windowSeconds: 60 },
    `user:${user.id}`,
    "Group changes are happening too quickly. Wait a moment and try again."
  );
  const parsed = createGroupSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    sourceSessionId: formData.get("sourceSessionId") || undefined,
  });
  if (!parsed.success)
    return {
      error: "Check the group details below.",
      values: {
        name: String(formData.get("name") ?? ""),
        description: String(formData.get("description") ?? ""),
      },
      fieldErrors: parsed.error.flatten().fieldErrors,
    };

  let sourcePlayerIds: string[] = [];
  if (parsed.data.sourceSessionId) {
    const source = await db.query.sessions.findFirst({
      where: and(
        eq(sessions.id, parsed.data.sourceSessionId),
        eq(sessions.hostId, user.id)
      ),
    });
    if (!source)
      return { error: "Only the session host can save this crew as a group." };
    if (source.status !== "completed")
      return { error: "Finish the game before saving its crew as a group." };
    if (source.groupId)
      return { error: "This session already belongs to a group." };
    const players = await db
      .select({ userId: sessionPlayers.userId })
      .from(sessionPlayers)
      .where(
        and(
          eq(sessionPlayers.sessionId, source.id),
          eq(sessionPlayers.rsvp, "going")
        )
      );
    sourcePlayerIds = players
      .map(({ userId }) => userId)
      .filter((id): id is string => Boolean(id));
  }

  const group = await db.transaction(async (tx) => {
    await hooks?.beforeCreate(tx);
    if (parsed.data.sourceSessionId) {
      const [current] = await tx
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.id, parsed.data.sourceSessionId),
            eq(sessions.hostId, user.id)
          )
        )
        .for("update");
      if (!current || current.groupId || current.status !== "completed")
        throw new Error(
          "This game must be completed, available, and not already in a group."
        );
      const currentPlayers = await tx
        .select({ id: sessionPlayers.userId })
        .from(sessionPlayers)
        .where(
          and(
            eq(sessionPlayers.sessionId, current.id),
            eq(sessionPlayers.rsvp, "going")
          )
        );
      const currentIds = currentPlayers
        .flatMap(({ id }) => (id ? [id] : []))
        .sort();
      if (
        JSON.stringify(currentIds) !==
        JSON.stringify([...sourcePlayerIds].sort())
      )
        throw new Error("The crew changed. Prepare a fresh preview.");
    }
    const [created] = await tx
      .insert(groups)
      .values({
        slug: groupSlug(parsed.data.name),
        ownerId: user.id,
        name: parsed.data.name,
        description: parsed.data.description || null,
      })
      .returning();
    const memberIds = [...new Set([user.id, ...sourcePlayerIds])];
    await tx.insert(groupMembers).values(
      memberIds.map((userId) => ({
        groupId: created.id,
        userId,
        role: userId === user.id ? ("owner" as const) : ("member" as const),
      }))
    );
    if (parsed.data.sourceSessionId)
      await tx
        .update(sessions)
        .set({
          groupId: created.id,
          version: sql`${sessions.version} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(sessions.id, parsed.data.sourceSessionId));
    await hooks?.afterCreate(tx, `/groups/${created.slug}`);
    return created;
  });

  if (parsed.data.sourceSessionId)
    await trackSessionMilestone({
      name: "group_saved",
      userId: user.id,
      sessionId: parsed.data.sourceSessionId,
      source: "authenticated",
      metadata: { memberCount: sourcePlayerIds.length },
    });
  revalidatePath("/groups");
  if (parsed.data.sourceSessionId)
    revalidatePath(`/games/${parsed.data.sourceSessionId}`);
  return { destination: `/groups/${group.slug}` };
}
