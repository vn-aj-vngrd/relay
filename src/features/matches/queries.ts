import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "@/db/client";
import {
  courts,
  matches,
  matchPlayers,
  profiles,
  sessionPairMembers,
  sessionPairs,
  sessionPlayers,
  sessionQueue,
} from "@/db/schema";
import { getPublicSession, getSessionForParticipant } from "@/features/sessions/queries";

import { calculateStandings } from "./domain";
import { deriveLiveState } from "./live-state";

async function getLiveDetails(sessionId: string, rotationMode: string) {
  const [sessionCourts, sessionMatches, queue, pairRows] = await Promise.all([
    db.select().from(courts).where(eq(courts.sessionId, sessionId)).orderBy(asc(courts.position)),
    db
      .select()
      .from(matches)
      .where(and(eq(matches.sessionId, sessionId), inArray(matches.status, ["active", "completed"]))),
    db
      .select({ queue: sessionQueue, player: sessionPlayers, profile: profiles })
      .from(sessionQueue)
      .innerJoin(sessionPlayers, eq(sessionQueue.sessionPlayerId, sessionPlayers.id))
      .leftJoin(profiles, eq(sessionPlayers.userId, profiles.userId))
      .where(eq(sessionQueue.sessionId, sessionId))
      .orderBy(asc(sessionQueue.position)),
    db
      .select({
        id: sessionPairs.id,
        position: sessionPairs.position,
        sessionPlayerId: sessionPairMembers.sessionPlayerId,
        memberPosition: sessionPairMembers.position,
      })
      .from(sessionPairs)
      .innerJoin(sessionPairMembers, eq(sessionPairMembers.pairId, sessionPairs.id))
      .where(eq(sessionPairs.sessionId, sessionId))
      .orderBy(asc(sessionPairs.position), asc(sessionPairMembers.position)),
  ]);
  const activeMatches = sessionMatches.filter((match) => match.status === "active");
  const completedMatchCount = sessionMatches.filter((match) => match.status === "completed").length;
  const matchIds = sessionMatches.map((match) => match.id);
  const players = matchIds.length
    ? await db
        .select({ matchPlayer: matchPlayers, player: sessionPlayers, profile: profiles })
        .from(matchPlayers)
        .innerJoin(sessionPlayers, eq(matchPlayers.sessionPlayerId, sessionPlayers.id))
        .leftJoin(profiles, eq(sessionPlayers.userId, profiles.userId))
        .where(inArray(matchPlayers.matchId, matchIds))
    : [];
  const standings = calculateStandings(
    sessionMatches
      .filter((match) => match.status === "completed")
      .map((match) => {
        const members = players.filter((item) => item.matchPlayer.matchId === match.id);
        return {
          teamA: members.filter((item) => item.matchPlayer.team === "A").map((item) => item.player.id),
          teamB: members.filter((item) => item.matchPlayer.team === "B").map((item) => item.player.id),
          scoreA: match.teamAScore,
          scoreB: match.teamBScore,
          status: "completed" as const,
        };
      }),
  ).map((row) => {
    const member = players.find((item) => item.player.id === row.playerId);
    return { ...row, name: member?.profile?.name ?? member?.player.guestName ?? "Guest" };
  });
  const pairIds = [...new Set(pairRows.map((row) => row.id))];
  const pairs = pairIds.map((id) => ({
    id,
    position: pairRows.find((row) => row.id === id)?.position ?? 0,
    members: pairRows.filter((row) => row.id === id).map((row) => row.sessionPlayerId),
  }));
  const liveDetails = {
    courts: sessionCourts,
    activeMatches: activeMatches.map((match) => ({
      ...match,
      players: players.filter((item) => item.matchPlayer.matchId === match.id),
    })),
    completedMatchCount,
    queue,
    pairs,
    standings,
  };
  return {
    ...liveDetails,
    play: deriveLiveState({
      rotationMode,
      queue,
      pairs,
      activeMatches: liveDetails.activeMatches,
      courtCount: sessionCourts.length,
      completedMatchCount,
    }),
  };
}

export async function getLiveSession(sessionId: string, userId: string) {
  const base = await getSessionForParticipant(sessionId, userId);
  if (!base) return null;
  return { ...base, ...(await getLiveDetails(sessionId, base.session.rotationMode)) };
}

export async function getPublicLiveSession(slug: string) {
  const base = await getPublicSession(slug);
  if (!base) return null;
  return { ...base, ...(await getLiveDetails(base.session.id, base.session.rotationMode)) };
}
