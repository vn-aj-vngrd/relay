"use server";

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db/client";
import {
  courts,
  matches,
  matchPlayers,
  matchScores,
  memories,
  messages,
  notifications,
  sessionPairMembers,
  sessionPairs,
  sessionPlayers,
  sessionQueue,
  sessions,
} from "@/db/schema";
import { trackSessionMilestone } from "@/features/analytics/events";
import { can, sessionActor } from "@/features/auth/permissions";
import { requireUser } from "@/features/auth/session";
import { playingExperienceWeight } from "@/features/players/playing-experience";
import { assertRateLimit } from "@/lib/rate-limit";

import { splitFinishedPlayers } from "./availability";
import {
  type PlaySetup,
  parsePlaySetup,
  planMatchFinish,
  planRotation,
  queueRuleFromConfig,
  type RotationHistory,
  rotationDescription,
} from "./rotation";

async function requirePlayManager(sessionId: string) {
  const user = await requireUser();
  await assertRateLimit(
    { scope: "play-management", limit: 120, windowSeconds: 60 },
    `user:${user.id}`,
    "Play changes are happening too quickly. Wait a moment and try again."
  );
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
  });
  if (!session) throw new Error("Session not found");
  const player = await db.query.sessionPlayers.findFirst({
    where: and(
      eq(sessionPlayers.sessionId, sessionId),
      eq(sessionPlayers.userId, user.id)
    ),
  });
  const actor = sessionActor({
    userId: user.id,
    hostId: session.hostId,
    membership: player,
  });
  if (!can(actor, "edit"))
    throw new Error("Only a host or co-host can manage live play");
  return { session, user, actor };
}

async function requireScorekeeper(sessionId: string, matchId: string) {
  const user = await requireUser();
  await assertRateLimit(
    { scope: "score-write", limit: 240, windowSeconds: 60 },
    `user:${user.id}`,
    "Score changes are happening too quickly. Wait a moment and try again."
  );
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
  });
  if (!session) throw new Error("Session not found");
  const hostActor = sessionActor({ userId: user.id, hostId: session.hostId });
  if (can(hostActor, "score")) return { session, user };
  const player = await db.query.sessionPlayers.findFirst({
    where: and(
      eq(sessionPlayers.sessionId, sessionId),
      eq(sessionPlayers.userId, user.id)
    ),
  });
  if (player?.rsvp !== "going")
    throw new Error("Only active players can change this score");
  const assignment =
    player.role === "cohost"
      ? null
      : await db.query.matchPlayers.findFirst({
          where: and(
            eq(matchPlayers.matchId, matchId),
            eq(matchPlayers.sessionPlayerId, player.id)
          ),
        });
  const actor = {
    ...sessionActor({
      userId: user.id,
      hostId: session.hostId,
      membership: player,
    }),
    assignedScorer: Boolean(assignment),
  };
  if (!can(actor, "score"))
    throw new Error("Only players on this court can change its score");
  return { session, user };
}

export type StartPlayActionState = { error?: string };

export async function startPlay(
  _: StartPlayActionState,
  formData: FormData
): Promise<StartPlayActionState> {
  const sessionId = String(formData.get("sessionId"));
  const { session, user } = await requirePlayManager(sessionId);
  let setup: PlaySetup;
  try {
    const pairCount = Math.max(
      0,
      Math.min(20, Number(formData.get("pairCount")) || 0)
    );
    const pairs = Array.from(
      { length: pairCount },
      (_, index) =>
        [
          String(formData.get(`pair-${index}-a`) ?? ""),
          String(formData.get(`pair-${index}-b`) ?? ""),
        ] as [string, string]
    );
    setup = parsePlaySetup({
      mode: formData.get("mode"),
      queueRule: formData.get("queueRule") || undefined,
      partnerPolicy: formData.get("partnerPolicy") || undefined,
      pairs,
    });
  } catch {
    const fixed =
      formData.get("mode") === "round_robin" ||
      formData.get("partnerPolicy") === "fixed";
    return {
      error: fixed
        ? "Assign each active player to one pair."
        : "Choose a valid play setup.",
    };
  }
  const rawRoundDuration = formData.get("roundDuration");
  const roundDuration =
    rawRoundDuration === null || rawRoundDuration === ""
      ? null
      : z.coerce.number().int().min(5).max(60).safeParse(rawRoundDuration);
  if (roundDuration && !roundDuration.success)
    return { error: "Choose a round timer between 5 and 60 minutes." };
  const roundDurationMinutes =
    setup.mode === "queue" ? null : (roundDuration?.data ?? null);
  if (session.status !== "draft" && session.status !== "published")
    return { error: "Play has already started." };
  const goingPlayers = await db
    .select({
      id: sessionPlayers.id,
      checkedInAt: sessionPlayers.checkedInAt,
      playState: sessionPlayers.playState,
    })
    .from(sessionPlayers)
    .where(
      and(
        eq(sessionPlayers.sessionId, sessionId),
        eq(sessionPlayers.rsvp, "going")
      )
    );
  const checkedInPlayers = goingPlayers.filter((player) => player.checkedInAt);
  const attendanceTaken =
    checkedInPlayers.length > 0 ||
    goingPlayers.some((player) => player.playState === "unavailable");
  const activePlayers = attendanceTaken ? checkedInPlayers : goingPlayers;
  const goingCount = activePlayers.length;
  if (goingCount < 4)
    return {
      error: "At least four players need to be going before Play can start.",
    };
  const setupPairs = "pairs" in setup ? setup.pairs : [];
  if (setupPairs.length) {
    const assigned = setupPairs.flat().toSorted();
    const eligible = goingPlayers.map((player) => player.id).toSorted();
    if (
      assigned.length !== eligible.length ||
      assigned.some((id, index) => id !== eligible[index])
    )
      return { error: "Assign every going player to exactly one pair." };
    const activeIds = new Set(activePlayers.map((player) => player.id));
    const completePairsHere = setupPairs.filter((pair) =>
      pair.every((playerId) => activeIds.has(playerId))
    ).length;
    if (completePairsHere < 2)
      return {
        error:
          setup.mode === "round_robin"
            ? "Team Round Robin needs at least two complete pairs here to start."
            : "Keep pairs together needs at least two complete pairs here to start.",
      };
  }
  if (
    setup.mode === "king_of_court" &&
    (session.courtCount < 2 || goingCount !== session.courtCount * 4)
  )
    return {
      error: `Court Climb needs exactly ${session.courtCount * 4} active players for ${session.courtCount} courts.`,
    };

  await db.transaction(async (tx) => {
    await tx.execute(
      sql`select id from ${sessions} where id = ${sessionId} for update`
    );
    const rotationConfig =
      setup.mode === "queue"
        ? { queueRule: setup.queueRule, partnerPolicy: setup.partnerPolicy }
        : {};
    const activated = await tx
      .update(sessions)
      .set({
        status: "live",
        rotationMode: setup.mode,
        rotationConfig,
        roundDurationMinutes,
        version: sql`${sessions.version} + 1`,
      })
      .where(
        and(
          eq(sessions.id, sessionId),
          inArray(sessions.status, ["draft", "published"])
        )
      )
      .returning({ id: sessions.id });
    if (!activated.length) throw new Error("Play has already started.");
    const players = await tx
      .select()
      .from(sessionPlayers)
      .where(
        inArray(
          sessionPlayers.id,
          activePlayers.map((player) => player.id)
        )
      )
      .orderBy(asc(sessionPlayers.createdAt));
    if (setupPairs.length) {
      const createdPairs = await tx
        .insert(sessionPairs)
        .values(
          setupPairs.map((_, index) => ({ sessionId, position: index + 1 }))
        )
        .returning({ id: sessionPairs.id, position: sessionPairs.position });
      await tx.insert(sessionPairMembers).values(
        createdPairs.flatMap((pair) =>
          setupPairs[pair.position - 1].map((sessionPlayerId, index) => ({
            pairId: pair.id,
            sessionPlayerId,
            position: index + 1,
          }))
        )
      );
    }
    const existing = await tx
      .select()
      .from(sessionQueue)
      .where(eq(sessionQueue.sessionId, sessionId));
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
      .set({
        state: "waiting",
        enteredAt: new Date(),
        version: sql`${sessionQueue.version} + 1`,
      })
      .where(
        and(
          eq(sessionQueue.sessionId, sessionId),
          inArray(
            sessionQueue.sessionPlayerId,
            players.map((player) => player.id)
          )
        )
      );
    await tx
      .update(sessionPlayers)
      .set({ checkedInAt: new Date(), playState: "waiting" })
      .where(
        inArray(
          sessionPlayers.id,
          players.map((player) => player.id)
        )
      );

    const sessionCourts = await tx
      .select()
      .from(courts)
      .where(eq(courts.sessionId, sessionId))
      .orderBy(asc(courts.position));
    const firstRotation = planRotation({
      mode: setup.mode,
      courts: sessionCourts,
      waiting: players.map((player, index) => ({
        id: player.id,
        position: index + 1,
        experience: playingExperienceWeight(player.skillLevel),
      })),
      history: [],
      fixedPairs: setupPairs,
    });
    if (!firstRotation.length)
      throw new Error("The first rotation could not be created.");
    const playingIds: string[] = [];
    for (const plan of firstRotation) {
      const [match] = await tx
        .insert(matches)
        .values({
          sessionId,
          courtId: plan.courtId,
          courtLabel: plan.courtLabel,
          status: "active",
          startedAt: new Date(),
        })
        .returning({ id: matches.id });
      const assignments = [
        ...plan.teamA.map((sessionPlayerId, index) => ({
          matchId: match.id,
          sessionPlayerId,
          team: "A" as const,
          position: index + 1,
        })),
        ...plan.teamB.map((sessionPlayerId, index) => ({
          matchId: match.id,
          sessionPlayerId,
          team: "B" as const,
          position: index + 1,
        })),
      ];
      await tx.insert(matchPlayers).values(assignments);
      playingIds.push(...plan.teamA, ...plan.teamB);
    }
    await tx
      .update(sessionQueue)
      .set({ state: "playing", version: sql`${sessionQueue.version} + 1` })
      .where(
        and(
          eq(sessionQueue.sessionId, sessionId),
          inArray(sessionQueue.sessionPlayerId, playingIds)
        )
      );
    await tx
      .update(sessionPlayers)
      .set({ playState: "playing" })
      .where(inArray(sessionPlayers.id, playingIds));
    await tx.insert(messages).values({
      sessionId,
      kind: "system",
      body: `Play started · ${rotationDescription(setup.mode, rotationConfig)}`,
    });
  });
  await trackSessionMilestone({
    name: "play_started",
    userId: user.id,
    sessionId,
    source: "authenticated",
    metadata: {
      mode: setup.mode,
      playerCount: goingCount,
      courtCount: session.courtCount,
      timed: Boolean(roundDurationMinutes),
    },
  });
  revalidatePath(`/games/${sessionId}/play`);
  revalidatePath(`/s/${session.slug}/play`);
  redirect(`/games/${sessionId}/play`);
}

export type CreateMatchActionState = { error?: string };

export async function createQueueMatch(
  _: CreateMatchActionState,
  formData: FormData
): Promise<CreateMatchActionState> {
  const sessionId = String(formData.get("sessionId"));
  const { session } = await requirePlayManager(sessionId);
  try {
    await db.transaction(async (tx) => {
      await tx.execute(
        sql`select id from ${sessions} where id = ${sessionId} for update`
      );
      const [active, sessionCourts, waiting, completed, pairRows] =
        await Promise.all([
          tx
            .select()
            .from(matches)
            .where(
              and(
                eq(matches.sessionId, sessionId),
                eq(matches.status, "active")
              )
            ),
          tx
            .select()
            .from(courts)
            .where(eq(courts.sessionId, sessionId))
            .orderBy(asc(courts.position)),
          tx
            .select({
              sessionPlayerId: sessionQueue.sessionPlayerId,
              position: sessionQueue.position,
              skillLevel: sessionPlayers.skillLevel,
            })
            .from(sessionQueue)
            .innerJoin(
              sessionPlayers,
              eq(sessionPlayers.id, sessionQueue.sessionPlayerId)
            )
            .where(
              and(
                eq(sessionQueue.sessionId, sessionId),
                eq(sessionQueue.state, "waiting")
              )
            )
            .orderBy(asc(sessionQueue.position)),
          tx
            .select()
            .from(matches)
            .where(
              and(
                eq(matches.sessionId, sessionId),
                eq(matches.status, "completed")
              )
            )
            .orderBy(asc(matches.finishedAt)),
          tx
            .select({
              pairId: sessionPairs.id,
              pairPosition: sessionPairs.position,
              sessionPlayerId: sessionPairMembers.sessionPlayerId,
              memberPosition: sessionPairMembers.position,
            })
            .from(sessionPairs)
            .innerJoin(
              sessionPairMembers,
              eq(sessionPairMembers.pairId, sessionPairs.id)
            )
            .where(eq(sessionPairs.sessionId, sessionId))
            .orderBy(
              asc(sessionPairs.position),
              asc(sessionPairMembers.position)
            ),
        ]);
      if (session.rotationMode !== "queue" && active.length)
        throw new Error("Finish every court before starting the next round.");
      const used = new Set(active.map((match) => match.courtId));
      const availableCourts =
        session.rotationMode === "queue"
          ? sessionCourts.filter((court) => !used.has(court.id))
          : sessionCourts;
      if (!availableCourts.length)
        throw new Error("Every court already has an active match.");
      if (
        session.rotationMode === "king_of_court" &&
        waiting.length !== sessionCourts.length * 4
      )
        throw new Error(
          "Court Climb needs exactly four active players per court."
        );
      if (waiting.length < 4)
        throw new Error("Four waiting players are required.");

      const completedIds = completed.map((match) => match.id);
      const historyPlayers = completedIds.length
        ? await tx
            .select()
            .from(matchPlayers)
            .where(inArray(matchPlayers.matchId, completedIds))
        : [];
      const courtPositions = new Map(
        sessionCourts.map((court) => [court.id, court.position])
      );
      const history: RotationHistory[] = completed.map((match) => ({
        courtId: match.courtId ?? "",
        courtPosition: courtPositions.get(match.courtId ?? "") ?? 0,
        teamA: historyPlayers
          .filter(
            (player) => player.matchId === match.id && player.team === "A"
          )
          .sort((a, b) => a.position - b.position)
          .map((player) => player.sessionPlayerId),
        teamB: historyPlayers
          .filter(
            (player) => player.matchId === match.id && player.team === "B"
          )
          .sort((a, b) => a.position - b.position)
          .map((player) => player.sessionPlayerId),
        winner: match.winningTeam === "B" ? "B" : "A",
        finishedAt: match.finishedAt?.getTime() ?? 0,
      }));
      const pairIds = [...new Set(pairRows.map((row) => row.pairId))];
      const fixedPairs = pairIds.map(
        (pairId) =>
          pairRows
            .filter((row) => row.pairId === pairId)
            .map((row) => row.sessionPlayerId) as [string, string]
      );
      const mode =
        session.rotationMode === "random" ||
        session.rotationMode === "balanced" ||
        session.rotationMode === "king_of_court" ||
        session.rotationMode === "round_robin"
          ? session.rotationMode
          : "queue";
      const plans = planRotation({
        mode,
        courts: availableCourts,
        waiting: waiting.map((item) => ({
          id: item.sessionPlayerId,
          position: item.position,
          experience: playingExperienceWeight(item.skillLevel),
        })),
        history,
        fixedPairs,
      });
      if (!plans.length)
        throw new Error(
          mode === "round_robin"
            ? "Every pair has completed the round robin."
            : "There are not enough waiting players for another match."
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
          ...plan.teamA.map((id, index) => ({
            matchId: match.id,
            sessionPlayerId: id,
            team: "A",
            position: index + 1,
          })),
          ...plan.teamB.map((id, index) => ({
            matchId: match.id,
            sessionPlayerId: id,
            team: "B",
            position: index + 1,
          })),
        ];
        await tx.insert(matchPlayers).values(assignments);
        playingIds.push(...plan.teamA, ...plan.teamB);
        for (const playerId of [...plan.teamA, ...plan.teamB])
          assignedCourt.set(playerId, plan.courtLabel);
      }
      const assignedPlayers = await tx
        .select({ id: sessionPlayers.id, userId: sessionPlayers.userId })
        .from(sessionPlayers)
        .where(inArray(sessionPlayers.id, playingIds));
      const recipients = assignedPlayers.filter(
        (player) => player.userId && player.userId !== session.hostId
      );
      if (recipients.length)
        await tx.insert(notifications).values(
          recipients.map((player) => ({
            userId: player.userId!,
            sessionId,
            type: "match_assignment",
            payload: { courtLabel: assignedCourt.get(player.id) },
          }))
        );
      await tx
        .update(sessionQueue)
        .set({ state: "playing", version: sql`${sessionQueue.version} + 1` })
        .where(
          and(
            eq(sessionQueue.sessionId, sessionId),
            inArray(sessionQueue.sessionPlayerId, playingIds)
          )
        );
      await tx
        .update(sessionPlayers)
        .set({ playState: "playing" })
        .where(inArray(sessionPlayers.id, playingIds));
      await tx.insert(messages).values({
        sessionId,
        kind: "system",
        body:
          plans.length === 1
            ? `${plans[0].courtLabel} match started.`
            : `A new ${plans.length}-court round started.`,
      });
    });
  } catch (error) {
    const expectedMessages = new Set([
      "Finish every court before starting the next round.",
      "Every court already has an active match.",
      "Court Climb needs exactly four active players per court.",
      "Four waiting players are required.",
      "Every pair has completed the round robin.",
      "There are not enough waiting players for another match.",
    ]);
    if (error instanceof Error && expectedMessages.has(error.message))
      return { error: error.message };
    console.error(
      "Starting the next Play rotation failed",
      error instanceof Error ? error.name : "UnknownError"
    );
    return {
      error: "The next rotation couldn’t start. Refresh and try again.",
    };
  }
  revalidatePath(`/games/${sessionId}/play`);
  revalidatePath(`/s/${session.slug}/play`);
  return {};
}

const scoreInput = z.object({
  sessionId: z.uuid(),
  matchId: z.uuid(),
  teamAScore: z.number().int().min(0).max(99),
  teamBScore: z.number().int().min(0).max(99),
  version: z.number().int().positive(),
});

const completedScoreInput = z.object({
  sessionId: z.uuid(),
  matchId: z.uuid(),
  teamAScore: z.coerce.number().int().min(0).max(99),
  teamBScore: z.coerce.number().int().min(0).max(99),
  version: z.coerce.number().int().positive(),
});

export type CorrectCompletedScoreState = { success?: string; error?: string };

export async function saveScore(input: z.input<typeof scoreInput>) {
  const parsed = scoreInput.parse(input);
  const { session, user } = await requireScorekeeper(
    parsed.sessionId,
    parsed.matchId
  );
  try {
    return await db.transaction(async (tx) => {
      const [match] = await tx
        .update(matches)
        .set({
          teamAScore: parsed.teamAScore,
          teamBScore: parsed.teamBScore,
          version: sql`${matches.version} + 1`,
        })
        .where(
          and(
            eq(matches.id, parsed.matchId),
            eq(matches.sessionId, parsed.sessionId),
            eq(matches.status, "active"),
            eq(matches.version, parsed.version)
          )
        )
        .returning({
          teamAScore: matches.teamAScore,
          teamBScore: matches.teamBScore,
          version: matches.version,
        });
      if (!match) throw new Error("SCORE_CONFLICT");
      await tx.insert(matchScores).values({
        matchId: parsed.matchId,
        teamAScore: match.teamAScore,
        teamBScore: match.teamBScore,
        recordedById: user.id,
        sequence: match.version,
      });
      return match;
    });
  } catch (error) {
    if (!(error instanceof Error && error.message === "SCORE_CONFLICT"))
      throw error;
    const latest = await db.query.matches.findFirst({
      columns: { teamAScore: true, teamBScore: true, version: true },
      where: and(
        eq(matches.id, parsed.matchId),
        eq(matches.sessionId, parsed.sessionId),
        eq(matches.status, "active")
      ),
    });
    if (!latest) throw error;
    return { ...latest, conflict: true as const };
  } finally {
    revalidatePath(`/games/${parsed.sessionId}/play`);
    revalidatePath(`/s/${session.slug}/play`);
  }
}

export async function correctCompletedScore(
  _: CorrectCompletedScoreState,
  formData: FormData
): Promise<CorrectCompletedScoreState> {
  const parsed = completedScoreInput.safeParse({
    sessionId: formData.get("sessionId"),
    matchId: formData.get("matchId"),
    teamAScore: formData.get("teamAScore"),
    teamBScore: formData.get("teamBScore"),
    version: formData.get("version"),
  });
  if (!parsed.success)
    return { error: "Enter a score from 0 to 99 for both teams." };
  if (parsed.data.teamAScore === parsed.data.teamBScore)
    return { error: "A completed match needs a winner." };

  const { session, user } = await requirePlayManager(parsed.data.sessionId);
  try {
    await db.transaction(async (tx) => {
      const current = await tx.query.matches.findFirst({
        columns: {
          courtLabel: true,
          teamAScore: true,
          teamBScore: true,
          version: true,
        },
        where: and(
          eq(matches.id, parsed.data.matchId),
          eq(matches.sessionId, parsed.data.sessionId),
          eq(matches.status, "completed")
        ),
      });
      if (!current) throw new Error("MATCH_NOT_COMPLETED");
      if (current.version !== parsed.data.version)
        throw new Error("SCORE_CONFLICT");
      if (
        current.teamAScore === parsed.data.teamAScore &&
        current.teamBScore === parsed.data.teamBScore
      )
        throw new Error("SCORE_UNCHANGED");

      const [updated] = await tx
        .update(matches)
        .set({
          teamAScore: parsed.data.teamAScore,
          teamBScore: parsed.data.teamBScore,
          winningTeam:
            parsed.data.teamAScore > parsed.data.teamBScore ? "A" : "B",
          version: sql`${matches.version} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(matches.id, parsed.data.matchId),
            eq(matches.sessionId, parsed.data.sessionId),
            eq(matches.status, "completed"),
            eq(matches.version, parsed.data.version)
          )
        )
        .returning({ version: matches.version });
      if (!updated) throw new Error("SCORE_CONFLICT");
      await tx.insert(matchScores).values({
        matchId: parsed.data.matchId,
        teamAScore: parsed.data.teamAScore,
        teamBScore: parsed.data.teamBScore,
        recordedById: user.id,
        sequence: updated.version,
      });
      await tx.insert(messages).values({
        sessionId: parsed.data.sessionId,
        kind: "system",
        body: `${current.courtLabel} score corrected from ${current.teamAScore}–${current.teamBScore} to ${parsed.data.teamAScore}–${parsed.data.teamBScore}. Later court assignments stay unchanged.`,
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SCORE_CONFLICT")
      return {
        error:
          "This result changed on another device. Review the latest score and try again.",
      };
    if (error instanceof Error && error.message === "SCORE_UNCHANGED")
      return { error: "Change at least one score before saving." };
    if (error instanceof Error && error.message === "MATCH_NOT_COMPLETED")
      return { error: "This match is no longer available for correction." };
    console.error(
      "Completed score correction failed",
      error instanceof Error ? error.name : "UnknownError"
    );
    return { error: "The corrected score couldn’t be saved. Try again." };
  }

  revalidatePath(`/games/${parsed.data.sessionId}/play`);
  revalidatePath(`/games/${parsed.data.sessionId}/story`);
  revalidatePath(`/s/${session.slug}/play`);
  revalidatePath(`/s/${session.slug}/story`);
  return { success: "Score corrected. Standings and recap are up to date." };
}

export async function completeSession(formData: FormData) {
  const sessionId = String(formData.get("sessionId"));
  const { session, user, actor } = await requirePlayManager(sessionId);
  if (!can(actor, "complete"))
    throw new Error("Only the host can end this session");
  const activeCount = await db.$count(
    matches,
    and(eq(matches.sessionId, sessionId), eq(matches.status, "active"))
  );
  if (activeCount)
    throw new Error("Finish active matches before ending the session");
  await db.transaction(async (tx) => {
    await tx
      .update(sessions)
      .set({
        status: "completed",
        completedAt: new Date(),
        version: sql`${sessions.version} + 1`,
      })
      .where(eq(sessions.id, sessionId));
    await tx
      .insert(memories)
      .values({ sessionId })
      .onConflictDoNothing({ target: memories.sessionId });
    const players = await tx
      .select({ userId: sessionPlayers.userId })
      .from(sessionPlayers)
      .where(
        and(
          eq(sessionPlayers.sessionId, sessionId),
          eq(sessionPlayers.rsvp, "going")
        )
      );
    const recipients = players.flatMap((player) =>
      player.userId && player.userId !== session.hostId ? [player.userId] : []
    );
    if (recipients.length)
      await tx.insert(notifications).values(
        recipients.map((userId) => ({
          userId,
          sessionId,
          type: "session_completed",
          payload: {},
        }))
      );
  });
  await trackSessionMilestone({
    name: "session_completed",
    userId: user.id,
    sessionId,
    source: "authenticated",
  });
  revalidatePath(`/games/${sessionId}/play`);
  revalidatePath(`/games/${sessionId}/story`);
  revalidatePath(`/games/${sessionId}`);
  revalidatePath(`/s/${session.slug}/play`);
  revalidatePath(`/s/${session.slug}/story`);
  revalidatePath(`/s/${session.slug}`);
  redirect(`/games/${session.id}/play`);
}

export async function finishMatch(formData: FormData) {
  const sessionId = String(formData.get("sessionId"));
  const matchId = String(formData.get("matchId"));
  const { session, user } = await requireScorekeeper(sessionId, matchId);
  const wasFirstCompletedMatch = await db.transaction(async (tx) => {
    await tx.execute(
      sql`select id from ${sessions} where id = ${sessionId} for update`
    );
    const [{ completedCount }] = await tx
      .select({ completedCount: sql<number>`count(*)::int` })
      .from(matches)
      .where(
        and(eq(matches.sessionId, sessionId), eq(matches.status, "completed"))
      );
    const match = await tx.query.matches.findFirst({
      where: and(
        eq(matches.id, matchId),
        eq(matches.sessionId, sessionId),
        eq(matches.status, "active")
      ),
    });
    if (!match) throw new Error("Match is no longer active");
    if (match.teamAScore === match.teamBScore)
      throw new Error("Enter a winner before finishing");
    const winningTeam = match.teamAScore > match.teamBScore ? "A" : "B";
    const players = await tx
      .select()
      .from(matchPlayers)
      .where(eq(matchPlayers.matchId, matchId))
      .orderBy(asc(matchPlayers.team), asc(matchPlayers.position));
    const waitingBefore = await tx
      .select()
      .from(sessionQueue)
      .where(
        and(
          eq(sessionQueue.sessionId, sessionId),
          eq(sessionQueue.state, "waiting")
        )
      )
      .orderBy(asc(sessionQueue.position));
    const [previous] =
      session.rotationMode === "queue" && match.courtId
        ? await tx
            .select()
            .from(matches)
            .where(
              and(
                eq(matches.sessionId, sessionId),
                eq(matches.courtId, match.courtId),
                eq(matches.status, "completed")
              )
            )
            .orderBy(desc(matches.finishedAt))
            .limit(1)
        : [];
    const previousPlayers = previous
      ? await tx
          .select()
          .from(matchPlayers)
          .where(eq(matchPlayers.matchId, previous.id))
      : [];
    const finishPlan = planMatchFinish({
      mode: session.rotationMode,
      queueRule: queueRuleFromConfig(session.rotationConfig),
      waitingPlayerIds: waitingBefore.map((item) => item.sessionPlayerId),
      teamA: players
        .filter((player) => player.team === "A")
        .map((player) => player.sessionPlayerId),
      teamB: players
        .filter((player) => player.team === "B")
        .map((player) => player.sessionPlayerId),
      winner: winningTeam,
      previousCourtPlayerIds: match.courtId
        ? previousPlayers.map((player) => player.sessionPlayerId)
        : null,
    });
    const resting = await tx
      .select({ id: sessionPlayers.id })
      .from(sessionPlayers)
      .where(
        and(
          inArray(sessionPlayers.id, finishPlan.returnedPlayerIds),
          eq(sessionPlayers.playState, "resting")
        )
      );
    const availability = splitFinishedPlayers(
      finishPlan.returnedPlayerIds,
      new Set(resting.map(({ id }) => id))
    );

    await tx
      .update(matches)
      .set({
        status: "completed",
        finishedAt: new Date(),
        winningTeam,
        version: sql`${matches.version} + 1`,
      })
      .where(eq(matches.id, matchId));
    const allQueue = await tx
      .select()
      .from(sessionQueue)
      .where(eq(sessionQueue.sessionId, sessionId))
      .orderBy(asc(sessionQueue.position));
    const remaining = allQueue
      .map((item) => item.sessionPlayerId)
      .filter((id) => !finishPlan.orderedPlayerIds.includes(id));
    await tx
      .update(sessionQueue)
      .set({ position: sql`${sessionQueue.position} + 100000` })
      .where(eq(sessionQueue.sessionId, sessionId));
    for (const [index, id] of [
      ...finishPlan.orderedPlayerIds,
      ...remaining,
    ].entries()) {
      const isWaiting = availability.waitingPlayerIds.includes(id);
      const isResting = availability.restingPlayerIds.includes(id);
      await tx
        .update(sessionQueue)
        .set({
          position: index + 1,
          ...(isWaiting
            ? { state: "waiting" as const, enteredAt: new Date() }
            : {}),
          ...(isResting ? { state: "resting" as const } : {}),
          version: sql`${sessionQueue.version} + 1`,
        })
        .where(
          and(
            eq(sessionQueue.sessionId, sessionId),
            eq(sessionQueue.sessionPlayerId, id)
          )
        );
    }
    if (availability.waitingPlayerIds.length)
      await tx
        .update(sessionPlayers)
        .set({ playState: "waiting" })
        .where(inArray(sessionPlayers.id, availability.waitingPlayerIds));
    await tx.insert(messages).values({
      sessionId,
      kind: "system",
      body: `${match.courtLabel} finished ${match.teamAScore}–${match.teamBScore}.`,
    });
    return completedCount === 0;
  });
  if (wasFirstCompletedMatch)
    await trackSessionMilestone({
      name: "first_match_completed",
      userId: user.id,
      sessionId,
      source: "authenticated",
    });
  revalidatePath(`/games/${sessionId}/play`);
  revalidatePath(`/s/${session.slug}/play`);
}
