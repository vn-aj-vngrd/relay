"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { groupMembers, groups, profiles, sessionPlayers, sessions } from "@/db/schema";
import { requireUser } from "@/features/auth/session";

import { addGroupMemberSchema, createGroupSchema, groupSlug } from "./domain";

export type GroupActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  values?: Record<string, string>;
};

export async function createGroupAction(_: GroupActionState, formData: FormData): Promise<GroupActionState> {
  const user = await requireUser();
  const parsed = createGroupSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    sourceSessionId: formData.get("sourceSessionId") || undefined,
  });
  if (!parsed.success)
    return {
      error: "Check the group details below.",
      values: { name: String(formData.get("name") ?? ""), description: String(formData.get("description") ?? "") },
      fieldErrors: parsed.error.flatten().fieldErrors,
    };

  let sourcePlayerIds: string[] = [];
  if (parsed.data.sourceSessionId) {
    const source = await db.query.sessions.findFirst({
      where: and(eq(sessions.id, parsed.data.sourceSessionId), eq(sessions.hostId, user.id)),
    });
    if (!source) return { error: "Only the session host can save this crew as a group." };
    if (source.groupId) return { error: "This session already belongs to a group." };
    const players = await db
      .select({ userId: sessionPlayers.userId })
      .from(sessionPlayers)
      .where(and(eq(sessionPlayers.sessionId, source.id), eq(sessionPlayers.rsvp, "going")));
    sourcePlayerIds = players.map(({ userId }) => userId).filter((id): id is string => Boolean(id));
  }

  const group = await db.transaction(async (tx) => {
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
      })),
    );
    if (parsed.data.sourceSessionId)
      await tx
        .update(sessions)
        .set({ groupId: created.id, version: sql`${sessions.version} + 1`, updatedAt: new Date() })
        .where(eq(sessions.id, parsed.data.sourceSessionId));
    return created;
  });

  revalidatePath("/groups");
  if (parsed.data.sourceSessionId) revalidatePath(`/games/${parsed.data.sourceSessionId}`);
  redirect(`/groups/${group.slug}`);
}

export async function addGroupMemberAction(_: GroupActionState, formData: FormData): Promise<GroupActionState> {
  const user = await requireUser();
  const parsed = addGroupMemberSchema.safeParse({
    groupId: formData.get("groupId"),
    username: formData.get("username"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a valid username." };
  const group = await db.query.groups.findFirst({
    where: and(eq(groups.id, parsed.data.groupId), eq(groups.ownerId, user.id)),
  });
  if (!group) return { error: "Only the group owner can add members." };
  const profile = await db.query.profiles.findFirst({ where: eq(profiles.username, parsed.data.username) });
  if (!profile) return { error: `No Relay player found for @${parsed.data.username}.` };
  const existing = await db.query.groupMembers.findFirst({
    where: and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, profile.userId)),
  });
  if (existing) return { error: `${profile.name} is already in this group.` };
  await db.insert(groupMembers).values({ groupId: group.id, userId: profile.userId, role: "member" });
  revalidatePath(`/groups/${group.slug}`);
  return {};
}
