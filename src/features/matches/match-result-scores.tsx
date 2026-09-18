import { Trophy } from "@phosphor-icons/react";

export function MatchResultScores({
  teams,
  scores,
}: {
  teams: [string, string];
  scores: [number, number];
}) {
  const winner = scores[0] === scores[1] ? null : scores[0] > scores[1] ? 0 : 1;
  return (
    <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 text-sm">
      {teams.map((team, index) => (
        <div key={`${index}:${team}`} className="contents">
          <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={`min-w-0 break-words ${winner === index ? "font-bold" : "font-medium text-muted"}`}
            >
              {team}
            </span>
            {winner === index ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary-soft px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                <Trophy aria-hidden size={12} /> Winner
              </span>
            ) : null}
          </span>
          <strong
            className={`score text-base ${winner === index ? "text-ink" : "text-muted"}`}
          >
            {scores[index]}
          </strong>
        </div>
      ))}
    </div>
  );
}
