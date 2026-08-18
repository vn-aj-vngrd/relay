"use server";

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import {
  courts,
  matches,
  matchPlayers,
  memories,
  messages,
  notifications,
  sessionPairMembers,
  sessionPairs,
  sessionPlayers,
  sessionQueue,
  sessions,
} from "@/db/schema";
import { requireUser } from "@/features/auth/session";

import {
  parsePlaySetup,
  planRotation,
  queueRuleFromConfig,
  rotationDescription,
  type RotationHistory,
} from "./rotation";

async function requireHost(sessionId: string) {
  const user = await requireUser();
  const session = await db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) });
  if (!session) throw new Error("Session not found");
  const player = await db.query.sessionPlayers.findFirst({
    where: and(eq(sessionPlayers.sessionId, sessionId), eq(sessionPlayers.userId, user.id)),
  });
  if (session.hostId !== user.id && player?.role !== "cohost") throw new Error("Only a host can manage live play");
  return session;
}

export type StartPlayActionState = { error?: string };

export async function startPlay(_: StartPlayActionState, formData: FormData): Promise<StartPlayActionState> {
  const sessionId = String(formData.get("sessionId"));
  const session = await requireHost(sessionId);
  let setup;
  try {
    const pairCount = Math.max(0, Math.min(20, Number(formData.get("pairCount")) || 0));
    const pairs = Array.from(
      { length: pairCount },
      (_, index) =>
        [String(formData.get(`pair-${index}-a`) ?? ""), String(formData.get(`pair-${index}-b`) ?? "")] as [
          string,
          string,
        ],
    );
    setup = parsePlaySetup({
      mode: formData.get("mode"),
      queueRule: formData.get("queueRule") || undefined,
      partnerPolicy: formData.get("partnerPolicy") || undefined,
      pairs,
    });
  } catch {
    const fixed = formData.get("mode") === "round_robin" || formData.get("partnerPolicy") === "fixed";
    return { error: fixed ? "Assign each active player to one pair." : "Choose a valid play setup." };
  }
  if (session.status !== "draft" && session.status !== "published") return { error: "Play has already started." };
  const goingPlayers = await db
    .select({ id: sessionPlayers.id })
    .from(sessionPlayers)
    .where(and(eq(sessionPlayers.sessionId, sessionId), eq(sessionPlayers.rsvp, "going")));
  const goingCount = goingPlayers.length;
  if (goingCount < 4) return { error: "At least four players need to be going before Play can start." };
  const setupPairs = "pairs" in setup ? setup.pairs : [];
  if (setupPairs.length) {
    const assigned = setupPairs.flat().toSorted();
    const eligible = goingPlayers.map((player) => player.id).toSorted();
    if (assigned.length !== eligible.length || assigned.some((id, index) => id !== eligible[index]))
      return { error: "Assign every active player to exactly one pair." };
  }
  if (setup.mode === "king_of_court" && (session.courtCount < 2 || goingCount !== session.courtCount * 4))
    return {
      error: `Court Climb needs exactly ${session.courtCount * 4} active players for ${session.courtCount} courts.`,
    };

  await db.transaction(async (tx) => {
    await tx.execute(sql`select id from ${sessions} where id = ${sessionId} for update`);
    const rotationConfig =
      setup.mode === "queue" ? { queueRule: setup.queueRule, partnerPolicy: setup.partnerPolicy } : {};
    const activated = await tx
      .update(sessions)
      .set({ status: "live", rotationMode: setup.mode, rotationConfig, version: sql`${sessions.version} + 1` })
      .where(and(eq(sessions.id, sessionId), inArray(sessions.status, ["draft", "published"])))
      .returning({ id: sessions.id });
    if (!activated.length) throw new Error("Play has already started.");
    const players = await tx
      .select()
      .from(sessionPlayers)
      .where(and(eq(sessionPlayers.sessionId, sessionId), eq(sessionPlayers.rsvp, "going")))
      .orderBy(asc(sessionPlayers.createdAt));
    if (setupPairs.length) {
      const createdPairs = await tx
        .insert(sessionPairs)
        .values(setupPairs.map((_, index) => ({ sessionId, position: index + 1 })))
        .returning({ id: sessionPairs.id, position: sessionPairs.position });
      await tx.insert(sessionPairMembers).values(
        createdPairs.flatMap((pair) =>
          setupPairs[pair.position - 1].map((sessionPlayerId, index) => ({
            pairId: pair.id,
            sessionPlayerId,
            position: index + 1,
          })),
        ),
      );
    }
    const existing = await tx.select().from(sessionQueue).where(eq(sessionQueue.sessionId, sessionId));
    const existingIds = new Set(existing.map((item) => item.sessionPlayerId));
    const additions = players
      .filter((item) => !existingIds.has(item.id))
      .map((item, index) => ({
        sessionId,
        sessionPlayerId: item.id,
        position: existing.length + index + 1,
        state: "waiting" as const,
      }));
    if (additions.length) await tx.insert(sessionQueue).values(additions);
    await tx
      .update(sessionQueue)
      .set({ state: "waiting", enteredAt: new Date(), version: sql`${sessionQueue.version} + 1` })
      .where(
        and(
          eq(sessionQueue.sessionId, sessionId),
          inArray(
            sessionQueue.sessionPlayerId,
            players.map((player) => player.id),
          ),
        ),
      );
    await tx
      .update(sessionPlayers)
      .set({ playState: "waiting" })
      .where(and(eq(sessionPlayers.sessionId, sessionId), eq(sessionPlayers.rsvp, "going")));
    await tx
      .insert(messages)
      .values({ sessionId, kind: "system", body: `Play started · ${rotationDescription(setup.mode, rotationConfig)}` });
  });
  revalidatePath(`/games/${sessionId}/play`);
  revalidatePath(`/s/${session.slug}/play`);
  return {};
}

export async function createQueueMatch(formData: FormData) {
  const sessionId = String(formData.get("sessionId"));
  const session = await requireHost(sessionId);
  await db.transaction(async (tx) => {
    await tx.execute(sql`select id from ${sessions} where id = ${sessionId} for update`);
    const [active, sessionCourts, waiting, completed, pairRows] = await Promise.all([
      tx
        .select()
        .from(matches)
        .where(and(eq(matches.sessionId, sessionId), eq(matches.status, "active"))),
      tx.select().from(courts).where(eq(courts.sessionId, sessionId)).orderBy(asc(courts.position)),
      tx
        .select()
        .from(sessionQueue)
        .where(and(eq(sessionQueue.sessionId, sessionId), eq(sessionQueue.state, "waiting")))
        .orderBy(asc(sessionQueue.position)),
      tx
        .select()
        .from(matches)
        .where(and(eq(matches.sessionId, sessionId), eq(matches.status, "completed")))
        .orderBy(asc(matches.finishedAt)),
      tx
        .select({
          pairId: sessionPairs.id,
          pairPosition: sessionPairs.position,
          sessionPlayerId: sessionPairMembers.sessionPlayerId,
          memberPosition: sessionPairMembers.position,
        })
        .from(sessionPairs)
        .innerJoin(sessionPairMembers, eq(sessionPairMembers.pairId, sessionPairs.id))
        .where(eq(sessionPairs.sessionId, sessionId))
        .orderBy(asc(sessionPairs.position), asc(sessionPairMembers.position)),
    ]);
    if (session.rotationMode !== "queue" && active.length)
      throw new Error("Finish every court before starting the next round.");
    const used = new Set(active.map((match) => match.courtId));
    const availableCourts =
      session.rotationMode === "queue" ? sessionCourts.filter((court) => !used.has(court.id)) : sessionCourts;
    if (!availableCourts.length) throw new Error("Every court already has an active match.");
    if (session.rotationMode === "king_of_court" && waiting.length !== sessionCourts.length * 4)
      throw new Error("Court Climb needs exactly four active players per court.");
    if (waiting.length < 4) throw new Error("Four waiting players are required.");

    const completedIds = completed.map((match) => match.id);
    const historyPlayers = completedIds.length
      ? await tx.select().from(matchPlayers).where(inArray(matchPlayers.matchId, completedIds))
      : [];
    const courtPositions = new Map(sessionCourts.map((court) => [court.id, court.position]));
    const history: RotationHistory[] = completed.map((match) => ({
      courtId: match.courtId ?? "",
      courtPosition: courtPositions.get(match.courtId ?? "") ?? 0,
      teamA: historyPlayers
        .filter((player) => player.matchId === match.id && player.team === "A")
        .sort((a, b) => a.position - b.position)
        .map((player) => player.sessionPlayerId),
      teamB: historyPlayers
        .filter((player) => player.matchId === match.id && player.team === "B")
        .sort((a, b) => a.position - b.position)
        .map((player) => player.sessionPlayerId),
      winner: match.winningTeam === "B" ? "B" : "A",
      finishedAt: match.finishedAt?.getTime() ?? 0,
    }));
    const pairIds = [...new Set(pairRows.map((row) => row.pairId))];
    const fixedPairs = pairIds.map(
      (pairId) => pairRows.filter((row) => row.pairId === pairId).map((row) => row.sessionPlayerId) as [string, string],
    );
    const mode =
      session.rotationMode === "random" ||
      session.rotationMode === "king_of_court" ||
      session.rotationMode === "round_robin"
        ? session.rotationMode
        : "queue";
    const plans = planRotation({
      mode,
      courts: availableCourts,
      waiting: waiting.map((item) => ({ id: item.sessionPlayerId, position: item.position })),
      history,
      fixedPairs,
    });
    if (!plans.length)
      throw new Error(
        mode === "round_robin"
          ? "Every pair has completed the round robin."
          : "There are not enough waiting players for another match.",
      );

    const playingIds: string[] = [];
    const assignedCourt = new Map<string, string>();
    for (const plan of plans) {
      const [match] = await tx
        .insert(matches)
        .values({
          sessionId,
          courtId: plan.courtId,
          courtLabel: plan.courtLabel,
          status: "active",
          startedAt: new Date(),
        })
        .returning();
      const assignments = [
        ...plan.teamA.map((id, index) => ({ matchId: match.id, sessionPlayerId: id, team: "A", position: index + 1 })),
        ...plan.teamB.map((id, index) => ({ matchId: match.id, sessionPlayerId: id, team: "B", position: index + 1 })),
      ];
      await tx.insert(matchPlayers).values(assignments);
      playingIds.push(...plan.teamA, ...plan.teamB);
      for (const playerId of [...plan.teamA, ...plan.teamB]) assignedCourt.set(playerId, plan.courtLabel);
    }
    const assignedPlayers = await tx
      .select({ id: sessionPlayers.id, userId: sessionPlayers.userId })
      .from(sessionPlayers)
      .where(inArray(sessionPlayers.id, playingIds));
    const recipients = assignedPlayers.filter((player) => player.userId && player.userId !== session.hostId);
    if (recipients.length)
      await tx.insert(notifications).values(
        recipients.map((player) => ({
          userId: player.userId!,
          sessionId,
          type: "match_assignment",
          payload: { courtLabel: assignedCourt.get(player.id) },
        })),
      );
    await tx
      .update(sessionQueue)
      .set({ state: "playing", version: sql`${sessionQueue.version} + 1` })
      .where(and(eq(sessionQueue.sessionId, sessionId), inArray(sessionQueue.sessionPlayerId, playingIds)));
    await tx.update(sessionPlayers).set({ playState: "playing" }).where(inArray(sessionPlayers.id, playingIds));
    await tx.insert(messages).values({
      sessionId,
      kind: "system",
      body: plans.length === 1 ? `${plans[0].courtLabel} match started.` : `A new ${plans.length}-court round started.`,
    });
  });
  revalidatePath(`/games/${sessionId}/play`);
  revalidatePath(`/s/${session.slug}/play`);
}

export async function changeScore(formData: FormData) {
  const sessionId = String(formData.get("sessionId"));
  await requireHost(sessionId);
  const matchId = String(formData.get("matchId"));
  const team = formData.get("team") === "B" ? "B" : "A";
  const amount = Number(formData.get("amount")) === -1 ? -1 : 1;
  const version = Number(formData.get("version"));
  const scoreColumn = team === "A" ? matches.teamAScore : matches.teamBScore;
  const updated = await db
    .update(matches)
    .set({
      [team === "A" ? "teamAScore" : "teamBScore"]: sql`greatest(0, ${scoreColumn} + ${amount})`,
      version: sql`${matches.version} + 1`,
    })
    .where(
      and(
        eq(matches.id, matchId),
        eq(matches.sessionId, sessionId),
        eq(matches.status, "active"),
        eq(matches.version, version),
      ),
    )
    .returning({ id: matches.id });
  if (!updated.length) throw new Error("Score changed on another device. Refresh and try again.");
  revalidatePath(`/games/${sessionId}/play`);
}

export async function completeSession(formData: FormData) {
  const sessionId = String(formData.get("sessionId"));
  const session = await requireHost(sessionId);
  const activeCount = await db.$count(matches, and(eq(matches.sessionId, sessionId), eq(matches.status, "active")));
  if (activeCount) throw new Error("Finish active matches before ending the session");
  await db.transaction(async (tx) => {
    await tx
      .update(sessions)
      .set({ status: "completed", completedAt: new Date(), version: sql`${sessions.version} + 1` })
      .where(eq(sessions.id, sessionId));
    await tx.insert(memories).values({ sessionId }).onConflictDoNothing({ target: memories.sessionId });
    const players = await tx
      .select({ userId: sessionPlayers.userId })
      .from(sessionPlayers)
      .where(and(eq(sessionPlayers.sessionId, sessionId), eq(sessionPlayers.rsvp, "going")));
    const recipients = players.flatMap((player) =>
      player.userId && player.userId !== session.hostId ? [player.userId] : [],
    );
    if (recipients.length)
      await tx
        .insert(notifications)
        .values(recipients.map((userId) => ({ userId, sessionId, type: "session_completed", payload: {} })));
  });
  revalidatePath(`/games/${sessionId}/play`);
  revalidatePath(`/games/${sessionId}`);
  redirect(`/s/${session.slug}`);
}

export async function finishMatch(formData: FormData) {
  const sessionId = String(formData.get("sessionId"));
  const session = await requireHost(sessionId);
  const matchId = String(formData.get("matchId"));
  await db.transaction(async (tx) => {
    await tx.execute(sql`select id from ${sessions} where id = ${sessionId} for update`);
    const match = await tx.query.matches.findFirst({
      where: and(eq(matches.id, matchId), eq(matches.sessionId, sessionId), eq(matches.status, "active")),
    });
    if (!match) throw new Error("Match is no longer active");
    if (match.teamAScore === match.teamBScore) throw new Error("Enter a winner before finishing");
    const winningTeam = match.teamAScore > match.teamBScore ? "A" : "B";
    const players = await tx
      .select()
      .from(matchPlayers)
      .where(eq(matchPlayers.matchId, matchId))
      .orderBy(asc(matchPlayers.team), asc(matchPlayers.position));
    const winners = players.filter((player) => player.team === winningTeam).map((player) => player.sessionPlayerId);
    const losers = players.filter((player) => player.team !== winningTeam).map((player) => player.sessionPlayerId);
    const waitingBefore = await tx
      .select()
      .from(sessionQueue)
      .where(and(eq(sessionQueue.sessionId, sessionId), eq(sessionQueue.state, "waiting")))
      .orderBy(asc(sessionQueue.position));

    let winnersStay = false;
    if (session.rotationMode === "queue" && waitingBefore.length >= 2) {
      const queueRule = queueRuleFromConfig(session.rotationConfig);
      const requested = queueRule === "winner_stays" || (queueRule === "adaptive" && waitingBefore.length < 4);
      if (requested && match.courtId) {
        const [previous] = await tx
          .select()
          .from(matches)
          .where(
            and(eq(matches.sessionId, sessionId), eq(matches.courtId, match.courtId), eq(matches.status, "completed")),
          )
          .orderBy(desc(matches.finishedAt))
          .limit(1);
        const previousPlayers = previous
          ? await tx.select().from(matchPlayers).where(eq(matchPlayers.matchId, previous.id))
          : [];
        winnersStay = !winners.every((id) => previousPlayers.some((player) => player.sessionPlayerId === id));
      }
    }

    await tx
      .update(matches)
      .set({ status: "completed", finishedAt: new Date(), winningTeam, version: sql`${matches.version} + 1` })
      .where(eq(matches.id, matchId));
    const returned = players.map((player) => player.sessionPlayerId);
    const desiredWaiting = winnersStay
      ? [...winners, ...waitingBefore.map((item) => item.sessionPlayerId), ...losers]
      : [...waitingBefore.map((item) => item.sessionPlayerId), ...returned];
    const uniqueWaiting = [...new Set(desiredWaiting)];
    const allQueue = await tx
      .select()
      .from(sessionQueue)
      .where(eq(sessionQueue.sessionId, sessionId))
      .orderBy(asc(sessionQueue.position));
    const remaining = allQueue.map((item) => item.sessionPlayerId).filter((id) => !uniqueWaiting.includes(id));
    await tx
      .update(sessionQueue)
      .set({ position: sql`${sessionQueue.position} + 100000` })
      .where(eq(sessionQueue.sessionId, sessionId));
    for (const [index, id] of [...uniqueWaiting, ...remaining].entries()) {
      const isReturning = returned.includes(id);
      await tx
        .update(sessionQueue)
        .set({
          position: index + 1,
          ...(isReturning ? { state: "waiting" as const, enteredAt: new Date() } : {}),
          version: sql`${sessionQueue.version} + 1`,
        })
        .where(and(eq(sessionQueue.sessionId, sessionId), eq(sessionQueue.sessionPlayerId, id)));
    }
    await tx.update(sessionPlayers).set({ playState: "waiting" }).where(inArray(sessionPlayers.id, returned));
    await tx.insert(messages).values({
      sessionId,
      kind: "system",
      body: `${match.courtLabel} finished ${match.teamAScore}–${match.teamBScore}.`,
    });
  });
  revalidatePath(`/games/${sessionId}/play`);
  revalidatePath(`/s/${session.slug}/play`);
}
