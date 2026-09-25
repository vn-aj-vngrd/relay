import "server-only";

import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  expenses,
  memories,
  memoryMedia,
  messages,
  playerPayments,
  profiles,
  sessionPlayers,
} from "@/db/schema";
import { can, sessionActor } from "@/features/auth/permissions";
import { getWorkspaceLiveSession } from "@/features/matches/queries";
import { getSessionRecapData } from "@/features/memories/queries";
import { canParticipateInWorkspace } from "@/features/sessions/session-access";
import { getAgentGameWorkspace } from "./reads";

export type GameSection = "play" | "recap" | "payments" | "chat" | "story";

function page<T>(rows: T[], offset: number, alreadyPaged = false) {
  const remaining = alreadyPaged ? rows : rows.slice(offset);
  return {
    items: remaining.slice(0, 20),
    truncated: remaining.length > 20,
    nextOffset: remaining.length > 20 && offset < 200 ? offset + 20 : null,
  };
}

export function projectAgentPlay(
  data: NonNullable<Awaited<ReturnType<typeof getWorkspaceLiveSession>>>,
  offset: number
) {
  return {
    completedMatchCount: data.completedMatchCount,
    courts: page(
      data.courts.map(({ label, availableForPlay }) => ({
        label,
        availableForPlay,
      })),
      offset
    ),
    activeMatches: page(
      data.activeMatches.map((match) => ({
        court: match.courtLabel,
        scoreA: match.teamAScore,
        scoreB: match.teamBScore,
        startedAt: match.startedAt,
        players: match.players.map(({ matchPlayer, player, profile }) => ({
          team: matchPlayer.team,
          name: profile?.name ?? player.guestName ?? "Player",
        })),
      })),
      offset
    ),
    results: page(
      data.completedMatches.map(
        ({ courtLabel, teams, scores, winningTeam, finishedAt }) => ({
          courtLabel,
          teams,
          scores,
          winningTeam,
          finishedAt,
        })
      ),
      offset
    ),
    standings: page(
      data.standings.map(
        ({
          name,
          played,
          wins,
          losses,
          pointsFor,
          pointsAgainst,
          differential,
          winPercentage,
        }) => ({
          name,
          played,
          wins,
          losses,
          pointsFor,
          pointsAgainst,
          differential,
          winPercentage,
        })
      ),
      offset
    ),
    queue: page(
      data.queue.map(({ queue, player, profile }) => ({
        name: profile?.name ?? player.guestName ?? "Player",
        position: queue.position,
        state: queue.state,
      })),
      offset
    ),
  };
}

export async function readAgentGameSection(
  userId: string,
  id: string,
  section: GameSection,
  offset: number
) {
  const data = await getAgentGameWorkspace(userId, id);
  if (!data) return { unavailable: true };
  const href = `/games/${id}/${section === "recap" ? "play" : section}`;
  const asOf = new Date().toISOString();
  if (section === "play") {
    const live = await getWorkspaceLiveSession(id, userId);
    return live
      ? { href, asOf, ...projectAgentPlay(live, offset) }
      : { unavailable: true };
  }
  if (section === "recap") {
    const recap = await getSessionRecapData(id);
    return {
      href,
      asOf,
      matchCount: recap.matchCount,
      totalPoints: recap.totalPoints,
      playMinutes: recap.playMinutes,
      busiestCourt: recap.busiestCourt,
      closestMatch: recap.closestMatch,
      standout: recap.standout
        ? {
            name: recap.standout.name,
            wins: recap.standout.wins,
            differential: recap.standout.differential,
          }
        : null,
      topPair: recap.topPair
        ? {
            names: recap.topPair.names,
            played: recap.topPair.played,
            wins: recap.topPair.wins,
            differential: recap.topPair.differential,
          }
        : null,
      results: page(
        recap.results.map(({ courtLabel, teams, scores }) => ({
          courtLabel,
          teams,
          scores,
        })),
        offset
      ),
      standings: page(
        recap.standings.map(
          ({
            name,
            played,
            wins,
            losses,
            pointsFor,
            pointsAgainst,
            differential,
            winPercentage,
          }) => ({
            name,
            played,
            wins,
            losses,
            pointsFor,
            pointsAgainst,
            differential,
            winPercentage,
          })
        ),
        offset
      ),
    };
  }
  if (section === "payments") {
    if (!canParticipateInWorkspace(data.access)) return { unavailable: true };
    const organizer = can(
      sessionActor({
        userId,
        hostId: data.session.hostId,
        membership: data.membership,
      }),
      "confirm_payment"
    );
    const rows = await db
      .select({
        label: expenses.label,
        kind: expenses.kind,
        archivedAt: expenses.archivedAt,
        name: sql<string>`coalesce(${profiles.name}, ${sessionPlayers.guestName}, 'Player')`,
        amountCents: playerPayments.amountCents,
        status: playerPayments.status,
        sentAt: playerPayments.sentAt,
        confirmedAt: playerPayments.confirmedAt,
      })
      .from(playerPayments)
      .innerJoin(expenses, eq(playerPayments.expenseId, expenses.id))
      .innerJoin(
        sessionPlayers,
        eq(playerPayments.sessionPlayerId, sessionPlayers.id)
      )
      .leftJoin(profiles, eq(sessionPlayers.userId, profiles.userId))
      .where(
        and(
          eq(expenses.sessionId, id),
          sql`(${sessionPlayers.userId} is null or ${ne(sessionPlayers.userId, data.session.hostId)})`,
          organizer ? undefined : eq(sessionPlayers.userId, userId)
        )
      )
      .orderBy(asc(expenses.createdAt), asc(playerPayments.id))
      .limit(21)
      .offset(offset);
    const collections = await db
      .select({
        label: expenses.label,
        kind: expenses.kind,
        totalCents: expenses.totalCents,
        contributionMode: expenses.contributionMode,
        fixedRateCents: expenses.fixedRateCents,
        archivedAt: expenses.archivedAt,
      })
      .from(expenses)
      .where(eq(expenses.sessionId, id))
      .orderBy(asc(expenses.createdAt), asc(expenses.id))
      .limit(21)
      .offset(offset);
    return {
      href,
      asOf,
      collections: page(collections, offset, true),
      audience: organizer ? "organizer" : "own payments",
      payments: page(rows, offset, true),
    };
  }
  if (section === "chat") {
    const rows = await db
      .select({
        name: sql<string>`coalesce(${profiles.name}, ${sessionPlayers.guestName}, 'Player')`,
        body: messages.body,
        kind: messages.kind,
        createdAt: messages.createdAt,
        hasImage: sql<boolean>`${messages.imagePath} is not null`,
      })
      .from(messages)
      .leftJoin(sessionPlayers, eq(messages.sessionPlayerId, sessionPlayers.id))
      .leftJoin(profiles, eq(sessionPlayers.userId, profiles.userId))
      .where(eq(messages.sessionId, id))
      .orderBy(desc(messages.createdAt), desc(messages.id))
      .limit(21)
      .offset(offset);
    return { href, asOf, messages: page(rows, offset, true) };
  }
  const rows = await db
    .select({
      caption: memoryMedia.caption,
      altText: memoryMedia.altText,
      createdAt: memoryMedia.createdAt,
    })
    .from(memoryMedia)
    .innerJoin(memories, eq(memoryMedia.memoryId, memories.id))
    .where(eq(memories.sessionId, id))
    .orderBy(asc(memoryMedia.createdAt), asc(memoryMedia.id))
    .limit(21)
    .offset(offset);
  return {
    href,
    asOf,
    photos: page(rows, offset, true),
    note: "Photo metadata only; open Story to view images. Recorded results are in Play.",
  };
}
