export type MatchResult = { teamA: string[]; teamB: string[]; scoreA: number; scoreB: number; status: "completed" | "cancelled" };
export type Standing = { playerId: string; played: number; wins: number; losses: number; pointsFor: number; pointsAgainst: number; differential: number; winPercentage: number };

export function calculateStandings(matches: MatchResult[]): Standing[] {
  const rows = new Map<string, Omit<Standing, "differential" | "winPercentage">>();
  for (const match of matches) {
    if (match.status !== "completed" || match.scoreA === match.scoreB) continue;
    const aWon = match.scoreA > match.scoreB;
    for (const [players, won, pointsFor, pointsAgainst] of [[match.teamA, aWon, match.scoreA, match.scoreB], [match.teamB, !aWon, match.scoreB, match.scoreA]] as const) {
      for (const playerId of players) {
        const row = rows.get(playerId) ?? { playerId, played: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 };
        row.played += 1; row.wins += won ? 1 : 0; row.losses += won ? 0 : 1; row.pointsFor += pointsFor; row.pointsAgainst += pointsAgainst;
        rows.set(playerId, row);
      }
    }
  }
  return [...rows.values()].map((row) => ({ ...row, differential: row.pointsFor - row.pointsAgainst, winPercentage: row.played === 0 ? 0 : row.wins / row.played })).sort((a, b) => b.wins - a.wins || b.differential - a.differential);
}

export function queueTeams(queue: string[], courtCount: number): { matches: { teamA: string[]; teamB: string[] }[]; waiting: string[] } {
  const playerCount = Math.min(queue.length, Math.max(0, courtCount) * 4);
  const playing = queue.slice(0, playerCount - (playerCount % 4));
  const matches = Array.from({ length: playing.length / 4 }, (_, index) => ({ teamA: playing.slice(index * 4, index * 4 + 2), teamB: playing.slice(index * 4 + 2, index * 4 + 4) }));
  return { matches, waiting: queue.slice(playing.length) };
}
