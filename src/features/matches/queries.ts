import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { courts, matches, matchPlayers, profiles, sessionPlayers, sessionQueue } from "@/db/schema";
import { getPublicSession, getSessionForParticipant } from "@/features/sessions/queries";
import { calculateStandings } from "./domain";

async function getLiveDetails(sessionId: string) {
  const [sessionCourts, sessionMatches, queue] = await Promise.all([
    db.select().from(courts).where(eq(courts.sessionId, sessionId)).orderBy(asc(courts.position)),
    db.select().from(matches).where(and(eq(matches.sessionId, sessionId), inArray(matches.status, ["active", "completed"]))),
    db.select({ queue: sessionQueue, player: sessionPlayers, profile: profiles }).from(sessionQueue).innerJoin(sessionPlayers, eq(sessionQueue.sessionPlayerId, sessionPlayers.id)).leftJoin(profiles, eq(sessionPlayers.userId, profiles.userId)).where(eq(sessionQueue.sessionId, sessionId)).orderBy(asc(sessionQueue.position)),
  ]);
  const activeMatches = sessionMatches.filter((match) => match.status === "active");
  const completedMatchCount = sessionMatches.filter((match) => match.status === "completed").length;
  const matchIds = sessionMatches.map((match) => match.id);
  const players = matchIds.length ? await db.select({ matchPlayer: matchPlayers, player: sessionPlayers, profile: profiles }).from(matchPlayers).innerJoin(sessionPlayers, eq(matchPlayers.sessionPlayerId, sessionPlayers.id)).leftJoin(profiles, eq(sessionPlayers.userId, profiles.userId)).where(inArray(matchPlayers.matchId, matchIds)) : [];
  const standings = calculateStandings(sessionMatches.filter((match) => match.status === "completed").map((match) => { const members = players.filter((item) => item.matchPlayer.matchId === match.id); return { teamA: members.filter((item) => item.matchPlayer.team === "A").map((item) => item.player.id), teamB: members.filter((item) => item.matchPlayer.team === "B").map((item) => item.player.id), scoreA: match.teamAScore, scoreB: match.teamBScore, status: "completed" as const }; })).map((row) => { const member = players.find((item) => item.player.id === row.playerId); return { ...row, name: member?.profile?.name ?? member?.player.guestName ?? "Guest" }; });
  return { courts: sessionCourts, activeMatches: activeMatches.map((match) => ({ ...match, players: players.filter((item) => item.matchPlayer.matchId === match.id) })), completedMatchCount, queue, standings };
}

export async function getLiveSession(sessionId: string, userId: string) {
  const base = await getSessionForParticipant(sessionId, userId);
  if (!base) return null;
  return { ...base, ...await getLiveDetails(sessionId) };
}

export async function getPublicLiveSession(slug: string) {
  const base = await getPublicSession(slug);
  if (!base) return null;
  return { ...base, ...await getLiveDetails(base.session.id) };
}
