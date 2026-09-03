import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "@/db/client";
import { matches, matchPlayers, memories, memoryMedia, profiles, sessionPlayers } from "@/db/schema";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { buildSessionRecap } from "./recap";

export async function getSessionMemory(sessionId: string) {
  const memory = await db.query.memories.findFirst({ where: eq(memories.sessionId, sessionId) });
  if (!memory) return null;
  const media = await db
    .select()
    .from(memoryMedia)
    .where(eq(memoryMedia.memoryId, memory.id))
    .orderBy(asc(memoryMedia.createdAt));
  const supabase = createSupabaseAdminClient();
  const withUrls = await Promise.all(
    media.map(async (item) => ({
      ...item,
      url:
        (await supabase.storage.from("session-memories").createSignedUrl(item.storagePath, 3600)).data?.signedUrl ??
        null,
    })),
  );
  return { memory, media: withUrls };
}

export async function getSessionRecapData(sessionId: string) {
  const sessionMatches = await db
    .select()
    .from(matches)
    .where(and(eq(matches.sessionId, sessionId), eq(matches.status, "completed")))
    .orderBy(asc(matches.finishedAt));
  const matchIds = sessionMatches.map((match) => match.id);
  const members = matchIds.length
    ? await db
        .select({ matchPlayer: matchPlayers, player: sessionPlayers, profile: profiles })
        .from(matchPlayers)
        .innerJoin(sessionPlayers, eq(sessionPlayers.id, matchPlayers.sessionPlayerId))
        .leftJoin(profiles, eq(profiles.userId, sessionPlayers.userId))
        .where(inArray(matchPlayers.matchId, matchIds))
    : [];
  const playerById = new Map(
    members.map(({ player, profile }) => [
      player.id,
      { id: player.id, name: profile?.name ?? player.guestName ?? "Guest" },
    ]),
  );
  const recap = buildSessionRecap(
    sessionMatches.map((match) => ({
      id: match.id,
      courtLabel: match.courtLabel,
      teamA: members
        .filter(({ matchPlayer }) => matchPlayer.matchId === match.id && matchPlayer.team === "A")
        .sort((a, b) => a.matchPlayer.position - b.matchPlayer.position)
        .map(({ player }) => player.id),
      teamB: members
        .filter(({ matchPlayer }) => matchPlayer.matchId === match.id && matchPlayer.team === "B")
        .sort((a, b) => a.matchPlayer.position - b.matchPlayer.position)
        .map(({ player }) => player.id),
      scoreA: match.teamAScore,
      scoreB: match.teamBScore,
      status: "completed" as const,
      startedAt: match.startedAt,
      finishedAt: match.finishedAt,
      version: match.version,
    })),
    [...playerById.values()],
  );
  return recap;
}

export async function getSessionRecap(sessionId: string) {
  const [recap, memory] = await Promise.all([getSessionRecapData(sessionId), getSessionMemory(sessionId)]);
  return { recap, memory };
}
