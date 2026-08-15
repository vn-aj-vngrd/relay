"use server";

import { and, asc, eq, inArray, max, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { courts, matches, matchPlayers, memories, sessionPlayers, sessionQueue, sessions } from "@/db/schema";
import { requireUser } from "@/features/auth/session";

async function requireHost(sessionId: string) {
  const user = await requireUser();
  const session = await db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) });
  if (!session) throw new Error("Session not found");
  const player = await db.query.sessionPlayers.findFirst({ where: and(eq(sessionPlayers.sessionId, sessionId), eq(sessionPlayers.userId, user.id)) });
  if (session.hostId !== user.id && player?.role !== "cohost") throw new Error("Only a host can manage live play");
  return session;
}

export async function startLiveMode(formData: FormData) {
  const sessionId = String(formData.get("sessionId"));
  await requireHost(sessionId);
  await db.transaction(async (tx) => {
    await tx.update(sessions).set({ status: "live", version: sql`${sessions.version} + 1` }).where(eq(sessions.id, sessionId));
    const players = await tx.select().from(sessionPlayers).where(and(eq(sessionPlayers.sessionId, sessionId), eq(sessionPlayers.rsvp, "going")));
    const existing = await tx.select().from(sessionQueue).where(eq(sessionQueue.sessionId, sessionId));
    const existingIds = new Set(existing.map((item) => item.sessionPlayerId));
    const additions = players.filter((item) => !existingIds.has(item.id)).map((item, index) => ({ sessionId, sessionPlayerId: item.id, position: existing.length + index + 1, state: "waiting" as const }));
    if (additions.length) await tx.insert(sessionQueue).values(additions);
    await tx.update(sessionPlayers).set({ playState: "waiting" }).where(and(eq(sessionPlayers.sessionId, sessionId), eq(sessionPlayers.rsvp, "going")));
  });
  revalidatePath(`/games/${sessionId}/live`);
}

export async function createQueueMatch(formData: FormData) {
  const sessionId = String(formData.get("sessionId"));
  await requireHost(sessionId);
  await db.transaction(async (tx) => {
    await tx.execute(sql`select id from ${sessions} where id = ${sessionId} for update`);
    const active = await tx.select().from(matches).where(and(eq(matches.sessionId, sessionId), eq(matches.status, "active")));
    const sessionCourts = await tx.select().from(courts).where(eq(courts.sessionId, sessionId)).orderBy(asc(courts.position));
    const used = new Set(active.map((match) => match.courtId));
    const court = sessionCourts.find((item) => !used.has(item.id));
    if (!court) throw new Error("Every court already has an active match");
    const waiting = await tx.select().from(sessionQueue).where(and(eq(sessionQueue.sessionId, sessionId), eq(sessionQueue.state, "waiting"))).orderBy(asc(sessionQueue.position)).limit(4);
    if (waiting.length < 4) throw new Error("Four waiting players are required");
    const [match] = await tx.insert(matches).values({ sessionId, courtId: court.id, courtLabel: court.label, status: "active", startedAt: new Date() }).returning();
    await tx.insert(matchPlayers).values(waiting.map((item, index) => ({ matchId: match.id, sessionPlayerId: item.sessionPlayerId, team: index < 2 ? "A" : "B", position: index % 2 + 1 })));
    await tx.update(sessionQueue).set({ state: "playing" }).where(and(eq(sessionQueue.sessionId, sessionId), inArray(sessionQueue.sessionPlayerId, waiting.map((item) => item.sessionPlayerId))));
    await tx.update(sessionPlayers).set({ playState: "playing" }).where(inArray(sessionPlayers.id, waiting.map((item) => item.sessionPlayerId)));
  });
  revalidatePath(`/games/${sessionId}/live`);
}

export async function changeScore(formData: FormData) {
  const sessionId = String(formData.get("sessionId"));
  await requireHost(sessionId);
  const matchId = String(formData.get("matchId"));
  const team = formData.get("team") === "B" ? "B" : "A";
  const amount = Number(formData.get("amount")) === -1 ? -1 : 1;
  const version = Number(formData.get("version"));
  const scoreColumn = team === "A" ? matches.teamAScore : matches.teamBScore;
  const updated = await db.update(matches).set({ [team === "A" ? "teamAScore" : "teamBScore"]: sql`greatest(0, ${scoreColumn} + ${amount})`, version: sql`${matches.version} + 1` }).where(and(eq(matches.id, matchId), eq(matches.sessionId, sessionId), eq(matches.status, "active"), eq(matches.version, version))).returning({ id: matches.id });
  if (!updated.length) throw new Error("Score changed on another device. Refresh and try again.");
  revalidatePath(`/games/${sessionId}/live`);
}

export async function completeSession(formData: FormData) {
  const sessionId = String(formData.get("sessionId"));
  await requireHost(sessionId);
  const activeCount = await db.$count(matches, and(eq(matches.sessionId, sessionId), eq(matches.status, "active")));
  if (activeCount) throw new Error("Finish active matches before ending the session");
  await db.transaction(async (tx) => {
    await tx.update(sessions).set({ status: "completed", completedAt: new Date(), version: sql`${sessions.version} + 1` }).where(eq(sessions.id, sessionId));
    await tx.insert(memories).values({ sessionId }).onConflictDoNothing({ target: memories.sessionId });
  });
  revalidatePath(`/games/${sessionId}/live`);
  revalidatePath(`/games/${sessionId}`);
}

export async function finishMatch(formData: FormData) {
  const sessionId = String(formData.get("sessionId"));
  await requireHost(sessionId);
  const matchId = String(formData.get("matchId"));
  await db.transaction(async (tx) => {
    const match = await tx.query.matches.findFirst({ where: and(eq(matches.id, matchId), eq(matches.sessionId, sessionId), eq(matches.status, "active")) });
    if (!match) throw new Error("Match is no longer active");
    if (match.teamAScore === match.teamBScore) throw new Error("Enter a winner before finishing");
    await tx.update(matches).set({ status: "completed", finishedAt: new Date(), winningTeam: match.teamAScore > match.teamBScore ? "A" : "B", version: sql`${matches.version} + 1` }).where(eq(matches.id, matchId));
    const players = await tx.select().from(matchPlayers).where(eq(matchPlayers.matchId, matchId));
    const [{ lastPosition }] = await tx.select({ lastPosition: max(sessionQueue.position) }).from(sessionQueue).where(eq(sessionQueue.sessionId, sessionId));
    for (const [index, player] of players.entries()) await tx.update(sessionQueue).set({ state: "waiting", position: (lastPosition ?? 0) + index + 1, enteredAt: new Date(), version: sql`${sessionQueue.version} + 1` }).where(and(eq(sessionQueue.sessionId, sessionId), eq(sessionQueue.sessionPlayerId, player.sessionPlayerId)));
    await tx.update(sessionPlayers).set({ playState: "waiting" }).where(inArray(sessionPlayers.id, players.map((item) => item.sessionPlayerId)));
  });
  revalidatePath(`/games/${sessionId}/live`);
}
