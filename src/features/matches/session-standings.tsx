import type { Standing } from "./domain";

export function SessionStandings({
  standings,
}: {
  standings: Array<Standing & { name: string }>;
}) {
  if (!standings.length) return null;
  return (
    <section aria-labelledby="session-standings-title">
      <h2 id="session-standings-title" className="text-lg font-bold">
        Session Standings
      </h2>
      <p className="mt-1 hidden text-sm text-muted lg:block">
        Only this game. Never a player rating.
      </p>
      <div className="mt-3 border-y border-line">
        <table className="w-full table-fixed text-sm">
          <thead className="text-left text-xs text-muted">
            <tr>
              <th className="w-[55%] py-3 font-medium lg:w-[40%]">Player</th>
              <th className="hidden py-3 text-right font-medium lg:table-cell">
                Played
              </th>
              <th className="py-3 text-right font-medium">W</th>
              <th className="py-3 text-right font-medium">L</th>
              <th className="py-3 text-right font-medium">+/−</th>
              <th className="hidden py-3 text-right font-medium lg:table-cell">
                Win %
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {standings.map((row) => (
              <tr key={row.playerId}>
                <td className="break-words py-3 pr-3 font-medium">
                  {row.name}
                </td>
                <td className="score hidden py-3 text-right lg:table-cell">
                  {row.played}
                </td>
                <td className="score py-3 text-right">{row.wins}</td>
                <td className="score py-3 text-right">{row.losses}</td>
                <td className="score py-3 text-right">
                  {row.differential > 0 ? "+" : ""}
                  {row.differential}
                </td>
                <td className="score hidden py-3 text-right lg:table-cell">
                  {Math.round(row.winPercentage * 100)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
