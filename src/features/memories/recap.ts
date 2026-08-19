import { calculateStandings, type MatchResult } from "@/features/matches/domain";

export type RecapMatch = MatchResult & {
  id: string;
  courtLabel: string;
  startedAt: Date | null;
  finishedAt: Date | null;
};

export type RecapPlayer = { id: string; name: string };

export function buildSessionRecap(matches: RecapMatch[], players: RecapPlayer[]) {
  const completed = matches.filter((match) => match.status === "completed" && match.scoreA !== match.scoreB);
  const nameById = new Map(players.map((player) => [player.id, player.name]));
  const standings = calculateStandings(completed).map((row) => ({
    ...row,
    name: nameById.get(row.playerId) ?? "Guest",
  }));
  const pairRows = new Map<string, { ids: string[]; played: number; wins: number; differential: number }>();
  const courtCounts = new Map<string, number>();
  for (const match of completed) {
    courtCounts.set(match.courtLabel, (courtCounts.get(match.courtLabel) ?? 0) + 1);
    const aWon = match.scoreA > match.scoreB;
    for (const [team, won, differential] of [
      [match.teamA, aWon, match.scoreA - match.scoreB],
      [match.teamB, !aWon, match.scoreB - match.scoreA],
    ] as const) {
      const ids = [...team].sort();
      const key = ids.join(":");
      const row = pairRows.get(key) ?? { ids, played: 0, wins: 0, differential: 0 };
      row.played += 1;
      row.wins += won ? 1 : 0;
      row.differential += differential;
      pairRows.set(key, row);
    }
  }
  const topPair = [...pairRows.values()]
    .filter((pair) => pair.ids.length === 2)
    .sort((a, b) => b.wins - a.wins || b.differential - a.differential || b.played - a.played)[0];
  const closestMatch = completed.toSorted(
    (a, b) =>
      Math.abs(a.scoreA - a.scoreB) - Math.abs(b.scoreA - b.scoreB) ||
      (b.finishedAt?.getTime() ?? 0) - (a.finishedAt?.getTime() ?? 0),
  )[0];
  const firstStart = completed
    .map((match) => match.startedAt?.getTime())
    .filter((value): value is number => Boolean(value))
    .sort((a, b) => a - b)[0];
  const lastFinish = completed
    .map((match) => match.finishedAt?.getTime())
    .filter((value): value is number => Boolean(value))
    .sort((a, b) => b - a)[0];
  const busiestCourt = [...courtCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];

  return {
    matchCount: completed.length,
    totalPoints: completed.reduce((total, match) => total + match.scoreA + match.scoreB, 0),
    playMinutes: firstStart && lastFinish ? Math.max(1, Math.round((lastFinish - firstStart) / 60_000)) : 0,
    standings,
    standout: standings[0] ?? null,
    topPair: topPair ? { ...topPair, names: topPair.ids.map((id) => nameById.get(id) ?? "Guest") } : null,
    closestMatch: closestMatch
      ? {
          courtLabel: closestMatch.courtLabel,
          score: `${closestMatch.scoreA}–${closestMatch.scoreB}`,
          scoreA: closestMatch.scoreA,
          scoreB: closestMatch.scoreB,
          teamA: closestMatch.teamA.map((id) => nameById.get(id) ?? "Guest"),
          teamB: closestMatch.teamB.map((id) => nameById.get(id) ?? "Guest"),
          margin: Math.abs(closestMatch.scoreA - closestMatch.scoreB),
        }
      : null,
    busiestCourt: busiestCourt ? { label: busiestCourt[0], matches: busiestCourt[1] } : null,
  };
}

export type SessionRecap = ReturnType<typeof buildSessionRecap>;
