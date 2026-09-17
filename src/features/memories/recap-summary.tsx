import type { SessionRecap } from "./recap";

export function RecapOverview({
  recap,
  title,
  context,
  description,
  statusLabel,
}: {
  recap: SessionRecap;
  title: string;
  context: string;
  description: string;
  statusLabel: string;
}) {
  return (
    <section
      aria-label="Recap summary"
      className="overflow-hidden rounded-xl bg-[var(--scoreboard-field)] text-white"
    >
      <div className="border-b border-white/15 px-4 py-3 sm:px-8 sm:py-4">
        <p className="sport-label text-[var(--scoreboard-line)]">
          {statusLabel}
        </p>
      </div>
      <div className="px-4 py-4 sm:px-8 sm:py-8">
        <p className="text-sm font-medium text-white/65">{context}</p>
        <h2 className="mt-3 max-w-2xl break-words text-2xl leading-tight font-bold tracking-[-0.035em] lg:text-5xl sm:leading-tight">
          {title}
        </h2>
        <p className="mt-3 hidden max-w-xl text-sm leading-6 text-white/70 lg:block lg:text-base">
          {description}
        </p>
        <div className="mt-4 grid grid-cols-3 border-y border-white/15 py-3 text-center sm:max-w-2xl sm:text-left lg:mt-8 lg:py-5">
          <div>
            <strong className="score block text-2xl sm:text-4xl">
              {recap.matchCount}
            </strong>
            <span className="mt-1 block text-xs text-white/60">
              {recap.matchCount === 1 ? "match" : "matches"}
            </span>
          </div>
          <div className="border-x border-white/15 px-3 sm:px-6">
            <strong className="score block text-2xl sm:text-4xl">
              {recap.totalPoints}
            </strong>
            <span className="mt-1 block text-xs text-white/60">
              points played
            </span>
          </div>
          <div className="pl-3 sm:pl-6">
            <strong className="score block text-2xl sm:text-4xl">
              {recap.playMinutes || "—"}
            </strong>
            <span className="mt-1 block text-xs text-white/60">
              {recap.playMinutes === 1 ? "court minute" : "court minutes"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function RecapHighlights({
  recap,
  completed = true,
}: {
  recap: SessionRecap;
  completed?: boolean;
}) {
  if (!recap.matchCount) return null;
  return (
    <section aria-labelledby="recap-highlights-title">
      <div>
        <h2 id="recap-highlights-title" className="text-xl font-bold">
          {completed ? "Session highlights" : "Highlights so far"}
        </h2>
        <p className="mt-1 hidden text-sm text-muted lg:block">
          A few true stories from the scores—not a competitive rating.
        </p>
      </div>
      <dl className="mt-4 divide-y divide-line border-y border-line sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="py-3 sm:py-5 sm:pr-6">
          <dt className="text-xs font-semibold text-muted">Top of the table</dt>
          <dd className="mt-2 break-words text-lg font-bold">
            {recap.standout?.name ?? "The whole crew"}
          </dd>
          <dd className="mt-1 text-sm text-muted">
            {recap.standout
              ? `${recap.standout.wins} ${recap.standout.wins === 1 ? "win" : "wins"} · ${Math.round(recap.standout.winPercentage * 100)}%`
              : "No standings yet"}
          </dd>
        </div>
        <div className="py-3 sm:px-6 sm:py-5">
          <dt className="text-xs font-semibold text-muted">
            Pair that clicked
          </dt>
          <dd className="mt-2 break-words text-lg font-bold">
            {recap.topPair?.names.join(" + ") ?? "Partners kept rotating"}
          </dd>
          <dd className="mt-1 text-sm text-muted">
            {recap.topPair
              ? `${recap.topPair.wins} ${recap.topPair.wins === 1 ? "win" : "wins"} together`
              : "No repeated pair"}
          </dd>
        </div>
        <div className="py-3 sm:py-5 sm:pl-6">
          <dt className="text-xs font-semibold text-muted">Closest finish</dt>
          <dd className="score mt-2 text-lg font-bold">
            {recap.closestMatch?.score ?? "—"}
          </dd>
          <dd className="mt-1 text-sm text-muted">
            {recap.closestMatch
              ? `${recap.closestMatch.courtLabel} · ${recap.closestMatch.margin}-point margin`
              : "No result yet"}
          </dd>
        </div>
      </dl>
      {recap.busiestCourt ? (
        <p className="mt-3 text-sm text-muted">
          <strong className="text-ink">{recap.busiestCourt.label}</strong>{" "}
          stayed busiest with {recap.busiestCourt.matches}{" "}
          {recap.busiestCourt.matches === 1 ? "match" : "matches"}.
        </p>
      ) : null}
    </section>
  );
}
