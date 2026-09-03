import { ArrowClockwise, ArrowRight, ShareNetwork, UsersThree } from "@phosphor-icons/react/dist/ssr";

import { ButtonLink } from "@/components/ui/button";
import { formatSessionDateLong } from "@/features/sessions/format";
import type { PostGameContinuation } from "@/features/sessions/post-game";

import type { SessionRecap as SessionRecapData } from "./recap";

export function SessionRecap({
  session,
  recap,
  storyHref,
  continuation,
}: {
  session: {
    id: string;
    title: string;
    venueName: string;
    startsAt: Date;
    status: "draft" | "published" | "live" | "completed" | "cancelled";
  };
  recap: SessionRecapData;
  storyHref: string;
  continuation?: PostGameContinuation;
}) {
  const date = formatSessionDateLong(session.startsAt);
  const completed = session.status === "completed";
  const inProgress = session.status === "live";

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-xl bg-[var(--scoreboard-field)] text-white">
        <div className="border-b border-white/15 px-5 py-4 sm:px-8">
          <p className="sport-label text-[var(--scoreboard-line)]">
            {completed ? "Final recap" : inProgress ? "Recap in progress" : "Recap preview"}
          </p>
        </div>
        <div className="px-5 py-8 sm:px-8 sm:py-10">
          <p className="text-sm font-medium text-white/65">
            {date} · {session.venueName}
          </p>
          <h2 className="mt-3 line-clamp-2 max-w-2xl break-words text-3xl font-bold tracking-[-0.035em] sm:text-5xl">
            {completed
              ? `That was ${session.title}.`
              : inProgress
                ? `${session.title} is taking shape.`
                : `${session.title} starts here.`}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
            {completed
              ? "The final scores, pairings, and court time from the game."
              : inProgress
                ? "Completed matches are already filling the game’s results."
                : "Scores, pairings, and standings will collect here as the game unfolds."}
          </p>
          <div className="mt-8 grid grid-cols-3 border-y border-white/15 py-5 text-center sm:max-w-2xl sm:text-left">
            <div>
              <strong className="score block text-3xl sm:text-4xl">{recap.matchCount}</strong>
              <span className="mt-1 block text-xs text-white/60">matches</span>
            </div>
            <div className="border-x border-white/15 px-3 sm:px-6">
              <strong className="score block text-3xl sm:text-4xl">{recap.totalPoints}</strong>
              <span className="mt-1 block text-xs text-white/60">points played</span>
            </div>
            <div className="pl-3 sm:pl-6">
              <strong className="score block text-3xl sm:text-4xl">{recap.playMinutes || "—"}</strong>
              <span className="mt-1 block text-xs text-white/60">court minutes</span>
            </div>
          </div>
        </div>
      </section>

      {!completed ? (
        <section className="border-y border-line py-5" aria-label="Recap status">
          <div className="flex items-start gap-3">
            <span
              className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${inProgress ? "bg-live" : "bg-surface-raised"}`}
            />
            <div>
              <h2 className="font-bold">{inProgress ? "Building as you play" : "Waiting for the first result"}</h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                {inProgress
                  ? recap.matchCount
                    ? `${recap.matchCount} completed ${recap.matchCount === 1 ? "match is" : "matches are"} included so far. The final recap locks when the host ends the session.`
                    : "Finish the first match to start filling the highlights and standings."
                  : "Once play begins, completed matches will fill the highlights and standings automatically."}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {recap.matchCount ? (
        <section aria-labelledby="recap-highlights-title">
          <div>
            <h2 id="recap-highlights-title" className="text-xl font-bold">
              {completed ? "Session highlights" : "Highlights so far"}
            </h2>
            <p className="mt-1 text-sm text-muted">A few true stories from the scores—not a competitive rating.</p>
          </div>
          <dl className="mt-4 divide-y divide-line border-y border-line sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="py-5 sm:pr-6">
              <dt className="text-xs font-semibold text-muted">Top of the table</dt>
              <dd className="mt-2 text-lg font-bold">{recap.standout?.name ?? "The whole crew"}</dd>
              <dd className="mt-1 text-sm text-muted">
                {recap.standout
                  ? `${recap.standout.wins} wins · ${Math.round(recap.standout.winPercentage * 100)}%`
                  : "No standings yet"}
              </dd>
            </div>
            <div className="py-5 sm:px-6">
              <dt className="text-xs font-semibold text-muted">Pair that clicked</dt>
              <dd className="mt-2 text-lg font-bold">{recap.topPair?.names.join(" + ") ?? "Partners kept rotating"}</dd>
              <dd className="mt-1 text-sm text-muted">
                {recap.topPair ? `${recap.topPair.wins} wins together` : "No repeated pair"}
              </dd>
            </div>
            <div className="py-5 sm:pl-6">
              <dt className="text-xs font-semibold text-muted">Closest finish</dt>
              <dd className="score mt-2 text-lg font-bold">{recap.closestMatch?.score ?? "—"}</dd>
              <dd className="mt-1 text-sm text-muted">
                {recap.closestMatch
                  ? `${recap.closestMatch.courtLabel} · ${recap.closestMatch.margin}-point margin`
                  : "No result yet"}
              </dd>
            </div>
          </dl>
          {recap.busiestCourt ? (
            <p className="mt-3 text-sm text-muted">
              <strong className="text-ink">{recap.busiestCourt.label}</strong> stayed busiest with{" "}
              {recap.busiestCourt.matches} {recap.busiestCourt.matches === 1 ? "match" : "matches"}.
            </p>
          ) : null}
        </section>
      ) : (
        <section className="border-y border-line py-8">
          <h2 className="text-lg font-bold">
            {completed ? "The scores stayed off—and that’s okay" : "No completed matches yet"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {completed
              ? "The crew can still keep photos and notes in Story without inventing results."
              : "This space will update after the first final score. Nothing needs to be prepared here."}
          </p>
        </section>
      )}

      {recap.standings.length ? (
        <section aria-labelledby="recap-standings-title">
          <h2 id="recap-standings-title" className="text-xl font-bold">
            Session Standings
          </h2>
          <p className="mt-1 text-sm text-muted">Only this game. Never a player rating.</p>
          <div className="mt-4 overflow-x-auto border-y border-line">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="py-3 font-medium">Player</th>
                  <th className="py-3 text-right font-medium">Played</th>
                  <th className="py-3 text-right font-medium">W</th>
                  <th className="py-3 text-right font-medium">L</th>
                  <th className="py-3 text-right font-medium">+/−</th>
                  <th className="py-3 text-right font-medium">Win %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recap.standings.map((row, index) => (
                  <tr key={row.playerId}>
                    <td className="py-3 font-semibold">
                      <span className="score mr-3 text-xs text-muted">{index + 1}</span>
                      {row.name}
                    </td>
                    <td className="score py-3 text-right">{row.played}</td>
                    <td className="score py-3 text-right">{row.wins}</td>
                    <td className="score py-3 text-right">{row.losses}</td>
                    <td className="score py-3 text-right">
                      {row.differential > 0 ? "+" : ""}
                      {row.differential}
                    </td>
                    <td className="score py-3 text-right">{Math.round(row.winPercentage * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {completed && continuation ? (
        <section className="border-y border-line py-7 sm:py-8" aria-labelledby="post-game-title">
          <p className="sport-label text-primary">Next game</p>
          <h2 id="post-game-title" className="mt-2 text-2xl font-bold tracking-[-0.025em] text-balance">
            Keep this crew moving.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Replay copies the plan and brings signed-in players forward as fresh invitations. Previous responses and
            scores stay with this game.
          </p>
          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            <ButtonLink href={continuation.replayHref} size="large" className="sm:min-w-36">
              <ArrowClockwise aria-hidden size={17} /> Play again
            </ButtonLink>
            {continuation.saveCrewHref ? (
              <ButtonLink href={continuation.saveCrewHref} variant="secondary" size="large" className="sm:min-w-36">
                <UsersThree aria-hidden size={17} /> Save this crew
              </ButtonLink>
            ) : null}
            <ButtonLink href={storyHref} variant="quiet" size="large" className="sm:min-w-36">
              <ShareNetwork aria-hidden size={17} /> Share recap
            </ButtonLink>
          </div>
        </section>
      ) : (
        <section className="border-t border-line pb-8 pt-6" aria-labelledby="recap-story-title">
          <h2 id="recap-story-title" className="text-lg font-bold">
            {completed ? "Keep what happened off the scoreboard" : "Story opens after the last point"}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            {completed
              ? "Build a story-ready highlight, add photos, and leave notes with the crew in Story."
              : "When the host ends the session, Story shows the final scores and game photos."}
          </p>
          <ButtonLink href={storyHref} variant="secondary" className="mt-4">
            Open story <ArrowRight aria-hidden size={16} />
          </ButtonLink>
        </section>
      )}
    </div>
  );
}
