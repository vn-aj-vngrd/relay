import { Heart } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";

import { PendingSubmit } from "@/components/ui/pending-submit";
import { sessionAccent } from "@/features/sessions/accent";
import { formatSessionDateLong } from "@/features/sessions/format";

import { addMemoryComment, toggleMemoryReaction } from "./actions";
import { MemoryPhotoForm } from "./memory-photo-form";
import type { SessionRecap as SessionRecapData } from "./recap";
import { RecapShareCard } from "./recap-share-card";

type MemoryData = {
  media: Array<{ id: string; url: string | null; altText: string | null; caption: string | null }>;
  comments: Array<{ comment: { id: string; body: string }; profile: { name: string } | null }>;
  reactionCount: number;
} | null;

export function SessionRecap({
  session,
  recap,
  memory,
  canContribute,
  viewerPlayerId,
}: {
  session: {
    id: string;
    title: string;
    venueName: string;
    startsAt: Date;
    accentColor: string;
    status: "draft" | "published" | "live" | "completed" | "cancelled";
  };
  recap: SessionRecapData;
  memory: MemoryData;
  canContribute: boolean;
  viewerPlayerId?: string | null;
}) {
  const photos = (memory?.media ?? []).flatMap((item) =>
    item.url ? [{ id: item.id, url: item.url, alt: item.altText ?? `Photo from ${session.title}` }] : [],
  );
  const date = formatSessionDateLong(session.startsAt);
  const accent = sessionAccent(session.accentColor);
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
          <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-[-0.035em] sm:text-5xl">
            {completed
              ? `That was ${session.title}.`
              : inProgress
                ? `${session.title} is taking shape.`
                : `${session.title} starts here.`}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
            {completed
              ? "The rallies, pairings, and moments the crew made together."
              : inProgress
                ? "Completed matches are already becoming part of the night’s story."
                : "Scores, pairings, photos, and shareable stories will collect here as the game unfolds."}
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
                    ? `${recap.matchCount} completed ${recap.matchCount === 1 ? "match is" : "matches are"} included so far. The final recap unlocks when the host ends the session.`
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
              <dd className="mt-2 text-lg font-bold">{recap.topPair?.names.join(" + ") ?? "Mixing all night"}</dd>
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
              ? "Add a crew photo and keep the session as a memory without inventing results."
              : "This space will update after the first final score. Nothing needs to be prepared here."}
          </p>
        </section>
      )}

      {recap.standings.length ? (
        <section aria-labelledby="recap-standings-title">
          <h2 id="recap-standings-title" className="text-xl font-bold">
            Session Standings
          </h2>
          <p className="mt-1 text-sm text-muted">Only this game night. Never a player rating.</p>
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

      {completed ? (
        <>
          <section aria-labelledby="share-recap-title">
            <div>
              <h2 id="share-recap-title" className="text-xl font-bold">
                Share the night
              </h2>
              <p className="mt-1 text-sm text-muted">
                Choose a true highlight, add a background, and share it in a story-ready format.
              </p>
            </div>
            <div className="mt-5 border-y border-line py-6">
              <RecapShareCard
                title={session.title}
                venue={session.venueName}
                date={date}
                accent={accent.solid}
                recap={recap}
                photos={photos}
                viewerPlayerId={viewerPlayerId}
              />
            </div>
          </section>

          <section aria-labelledby="memory-photos-title">
            <div>
              <h2 id="memory-photos-title" className="text-xl font-bold">
                Photos from the game
              </h2>
              <p className="mt-1 text-sm text-muted">
                The session itself is the memory. Add moments from the crew here.
              </p>
            </div>
            {photos.length ? (
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {memory?.media.map((item) =>
                  item.url ? (
                    <figure key={item.id}>
                      <Image
                        src={item.url}
                        alt={item.altText ?? "Session photo"}
                        width={640}
                        height={640}
                        className="aspect-square w-full rounded-[10px] object-cover"
                      />
                      {item.caption ? (
                        <figcaption className="mt-1 text-xs text-muted">{item.caption}</figcaption>
                      ) : null}
                    </figure>
                  ) : null,
                )}
              </div>
            ) : (
              <p className="mt-4 border-y border-line py-7 text-sm text-muted">
                No photos yet. Add the first memory from the night.
              </p>
            )}
            {canContribute ? (
              <div className="mt-5">
                <MemoryPhotoForm sessionId={session.id} />
              </div>
            ) : null}
          </section>

          <section aria-labelledby="recap-reactions-title" className="pb-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 id="recap-reactions-title" className="text-xl font-bold">
                  From the crew
                </h2>
                <p className="mt-1 text-sm text-muted">Small reactions and the details people want to remember.</p>
              </div>
              {canContribute ? (
                <form action={toggleMemoryReaction}>
                  <input type="hidden" name="sessionId" value={session.id} />
                  <PendingSubmit
                    pendingLabel="Saving…"
                    aria-label="React to this session"
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold text-primary hover:bg-primary-soft"
                  >
                    <Heart aria-hidden size={18} />
                    {memory?.reactionCount ?? 0}
                  </PendingSubmit>
                </form>
              ) : (
                <span className="inline-flex items-center gap-1 text-sm text-muted">
                  <Heart aria-hidden size={16} />
                  {memory?.reactionCount ?? 0}
                </span>
              )}
            </div>
            {memory?.comments.length ? (
              <ul className="mt-4 divide-y divide-line border-y border-line">
                {memory.comments.map(({ comment, profile }) => (
                  <li key={comment.id} className="py-4">
                    <p className="text-sm font-semibold">{profile?.name ?? "Player"}</p>
                    <p className="mt-1 break-words text-sm leading-6 text-muted">{comment.body}</p>
                  </li>
                ))}
              </ul>
            ) : null}
            {canContribute ? (
              <form action={addMemoryComment} className="mt-4 flex gap-2">
                <input type="hidden" name="sessionId" value={session.id} />
                <label className="sr-only" htmlFor="recap-comment">
                  Comment
                </label>
                <input
                  id="recap-comment"
                  name="body"
                  required
                  maxLength={500}
                  autoComplete="off"
                  placeholder="Add something worth remembering…"
                  className="h-11 min-w-0 flex-1 rounded-[10px] border border-line bg-canvas px-3 placeholder:text-muted"
                />
                <SubmitButtonProxy />
              </form>
            ) : null}
          </section>
        </>
      ) : (
        <section className="border-y border-line py-8" aria-labelledby="recap-final-title">
          <h2 id="recap-final-title" className="text-lg font-bold">
            The final story comes after play
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            When the host ends the session, Relay will lock the final standings and open portrait sharing, photos, and
            crew reactions here.
          </p>
        </section>
      )}
    </div>
  );
}

function SubmitButtonProxy() {
  return (
    <PendingSubmit
      pendingLabel="Posting…"
      className="inline-flex min-h-9 items-center rounded-lg border border-line px-3 text-[13px] font-semibold"
    >
      Post
    </PendingSubmit>
  );
}
