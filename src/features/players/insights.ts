import "server-only";

import { and, count, desc, eq, isNotNull, ne, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { matches, matchPlayers, sessionPlayers, sessions } from "@/db/schema";
import { resolveSessionWorkspaceAccess } from "@/features/sessions/session-access";

const scoredMatch = and(
  eq(matches.status, "completed"),
  isNotNull(matches.winningTeam),
  ne(matches.teamAScore, matches.teamBScore)
);

const pointsFor = sql<number>`case when ${matchPlayers.team} = 'A' then ${matches.teamAScore} else ${matches.teamBScore} end`;
const pointsAgainst = sql<number>`case when ${matchPlayers.team} = 'A' then ${matches.teamBScore} else ${matches.teamAScore} end`;

export async function getPlayerInsights(userId: string) {
  const [hostedGames, [totals], recentGames] = await Promise.all([
    db.$count(
      sessions,
      and(eq(sessions.hostId, userId), eq(sessions.status, "completed"))
    ),
    db
      .select({
        gamesPlayed: sql<number>`count(distinct ${matches.sessionId})::int`,
        matchesPlayed: count(),
        wins: sql<number>`count(*) filter (where ${matches.winningTeam} = ${matchPlayers.team})::int`,
        pointsFor: sql<number>`coalesce(sum(${pointsFor}), 0)::int`,
        pointsAgainst: sql<number>`coalesce(sum(${pointsAgainst}), 0)::int`,
      })
      .from(matchPlayers)
      .innerJoin(matches, eq(matchPlayers.matchId, matches.id))
      .innerJoin(
        sessionPlayers,
        eq(matchPlayers.sessionPlayerId, sessionPlayers.id)
      )
      .where(and(eq(sessionPlayers.userId, userId), scoredMatch)),
    db
      .select({
        id: sessions.id,
        title: sessions.title,
        startsAt: sessions.startsAt,
        timezone: sessions.timezone,
        hostId: sessions.hostId,
        visibility: sessions.visibility,
        status: sessions.status,
        endsAt: sessions.endsAt,
        playerPriceCents: sessions.playerPriceCents,
        playerRole: sessionPlayers.role,
        playerRsvp: sessionPlayers.rsvp,
        matches: sql<number>`count(*)::int`,
        wins: sql<number>`count(*) filter (where ${matches.winningTeam} = ${matchPlayers.team})::int`,
      })
      .from(matchPlayers)
      .innerJoin(matches, eq(matchPlayers.matchId, matches.id))
      .innerJoin(
        sessionPlayers,
        eq(matchPlayers.sessionPlayerId, sessionPlayers.id)
      )
      .innerJoin(sessions, eq(matches.sessionId, sessions.id))
      .where(and(eq(sessionPlayers.userId, userId), scoredMatch))
      .groupBy(sessions.id, sessionPlayers.role, sessionPlayers.rsvp)
      .orderBy(desc(sessions.startsAt), desc(sessions.id))
      .limit(5),
  ]);

  const matchesPlayed = Number(totals?.matchesPlayed ?? 0);
  const wins = Number(totals?.wins ?? 0);

  return {
    hostedGames,
    gamesPlayed: Number(totals?.gamesPlayed ?? 0),
    matchesPlayed,
    wins,
    losses: matchesPlayed - wins,
    winRate: matchesPlayed ? Math.round((wins / matchesPlayed) * 100) : 0,
    pointsFor: Number(totals?.pointsFor ?? 0),
    pointsAgainst: Number(totals?.pointsAgainst ?? 0),
    recentGames: recentGames.map((game) => ({
      id: game.id,
      title: game.title,
      startsAt: game.startsAt,
      timezone: game.timezone,
      matches: Number(game.matches),
      wins: Number(game.wins),
      losses: Number(game.matches) - Number(game.wins),
      canOpen: Boolean(
        resolveSessionWorkspaceAccess({
          userId,
          hostId: game.hostId,
          visibility: game.visibility,
          status: game.status,
          endsAt: game.endsAt,
          playerPriceCents: game.playerPriceCents,
          membership: { role: game.playerRole, rsvp: game.playerRsvp },
        })
      ),
    })),
  };
}
