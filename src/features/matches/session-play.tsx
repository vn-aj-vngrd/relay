import { Broadcast, DotsSixVertical, Shuffle } from "@phosphor-icons/react/dist/ssr";

import { Avatar } from "@/components/shared/avatar-stack";
import { ConfirmSubmitButton } from "@/components/shared/confirm-submit-button";
import { ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { completeSession, createQueueMatch } from "@/features/matches/actions";
import { getLiveSession } from "@/features/matches/queries";
import { getSessionRecapData } from "@/features/memories/queries";
import { SessionRecap } from "@/features/memories/session-recap";
import { profileAvatarUrl } from "@/features/players/avatar";
import { AttendanceToggle } from "@/features/sessions/attendance-toggle";
import type { PostGameContinuation } from "@/features/sessions/post-game";

import { LiveCourtDeck } from "./live-court";
import { rotationDescription, rotationName } from "./rotation";
import { RoundTimer } from "./round-timer";

export type SessionPlayData = Omit<NonNullable<Awaited<ReturnType<typeof getLiveSession>>>, "membership">;

export type SessionPlayViewer = {
  playerId?: string;
  rsvp?: string;
  checkedInAt?: Date | null;
  canManagePlay: boolean;
  canCompleteSession: boolean;
  canScoreAll: boolean;
  canScoreAssigned: boolean;
};

type SessionPlayProps = {
  data: SessionPlayData;
  viewer: SessionPlayViewer;
  setupHref?: string;
  storyHref: string;
  continuation?: PostGameContinuation;
};

function playerName(player: { guestName: string | null }, profile: { name: string } | null) {
  return profile?.name ?? player.guestName ?? "Guest";
}

function canScoreMatch(viewer: SessionPlayViewer, playerIds: string[]) {
  return (
    viewer.canScoreAll || Boolean(viewer.canScoreAssigned && viewer.playerId && playerIds.includes(viewer.playerId))
  );
}

export async function SessionPlay({ data, viewer, setupHref, storyHref, continuation }: SessionPlayProps) {
  if (data.session.status === "completed") {
    const recap = await getSessionRecapData(data.session.id);
    return <SessionRecap session={data.session} recap={recap} storyHref={storyHref} continuation={continuation} />;
  }

  const { canStartRotation, rotationLabel, roundMode, roundRobinComplete, roundStartedAt, waiting, waitingPairs } =
    data.play;
  const going = data.roster.filter(({ player }) => player.rsvp === "going");
  const checkedIn = going.filter(({ player }) => player.checkedInAt);

  if (data.session.status !== "live") {
    return (
      <section className="mx-auto w-full max-w-2xl border-y border-line py-10 text-center sm:mt-8 sm:py-14">
        <Broadcast aria-hidden className="mx-auto text-primary" size={26} />
        <h2 className="mt-4 text-2xl font-bold">Play hasn’t started</h2>
        <p className="mx-auto mt-2 max-w-lg text-pretty text-sm leading-6 text-muted sm:text-base">
          {viewer.canManagePlay
            ? "Confirm who’s here, choose the court flow, and start the first rotation."
            : "The host will start courts and the queue when the group is ready."}
        </p>
        {viewer.canManagePlay && setupHref ? (
          <ButtonLink href={setupHref} className="mt-6">
            Start Play
          </ButtonLink>
        ) : viewer.rsvp === "going" && viewer.playerId ? (
          <div className="mx-auto mt-6 max-w-xs border-t border-line pt-5 text-center">
            <p className="mb-2 text-center text-sm text-muted">At the court? Mark yourself here.</p>
            <AttendanceToggle
              sessionId={data.session.id}
              sessionPlayerId={viewer.playerId}
              name="yourself"
              present={Boolean(viewer.checkedInAt)}
              compact
            />
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <div className="grid gap-7 sm:pt-6 lg:grid-cols-[1fr_330px]">
      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Active courts</h2>
            <p className="mt-1 text-sm text-muted">
              {rotationName(data.session.rotationMode)} · scores update for everyone
            </p>
          </div>
          {viewer.canManagePlay && canStartRotation && data.activeMatches.length > 0 ? (
            <form noValidate action={createQueueMatch}>
              <input type="hidden" name="sessionId" value={data.session.id} />
              <SubmitButton pendingLabel="Creating match…" variant="secondary" className="whitespace-nowrap">
                <Shuffle size={17} />
                {rotationLabel}
              </SubmitButton>
            </form>
          ) : null}
        </div>
        {data.session.roundDurationMinutes && roundStartedAt ? (
          <div className="mb-5">
            <RoundTimer startedAt={roundStartedAt.toISOString()} durationMinutes={data.session.roundDurationMinutes} />
          </div>
        ) : null}
        {data.activeMatches.length ? (
          <LiveCourtDeck
            courts={data.activeMatches.map((match) => {
              const playerIds = match.players.map(({ player }) => player.id);
              return {
                sessionId: data.session.id,
                matchId: match.id,
                number: match.courtLabel,
                teams: [
                  match.players
                    .filter(({ matchPlayer }) => matchPlayer.team === "A")
                    .map(({ player, profile }) => playerName(player, profile))
                    .join(" + "),
                  match.players
                    .filter(({ matchPlayer }) => matchPlayer.team === "B")
                    .map(({ player, profile }) => playerName(player, profile))
                    .join(" + "),
                ],
                scores: [match.teamAScore, match.teamBScore],
                version: match.version,
                canScore: canScoreMatch(viewer, playerIds),
              };
            })}
          />
        ) : (
          <div className="border-y border-line py-10">
            <h3 className="font-bold">
              {roundRobinComplete
                ? "Round robin complete"
                : data.completedMatchCount
                  ? "Ready for what’s next"
                  : "Courts are open"}
            </h3>
            <p className="mt-2 text-sm text-muted">
              {roundRobinComplete
                ? "Every pair has played each other once."
                : waiting.length < 4
                  ? `Waiting for ${4 - waiting.length} more ${4 - waiting.length === 1 ? "player" : "players"}.`
                  : roundMode
                    ? "Every court is ready for the next round."
                    : "The next four players are ready."}
            </p>
            {viewer.canManagePlay && canStartRotation ? (
              <form noValidate action={createQueueMatch} className="mt-5">
                <input type="hidden" name="sessionId" value={data.session.id} />
                <SubmitButton pendingLabel={roundMode ? "Starting round…" : "Starting match…"}>
                  <Shuffle size={17} />
                  {rotationLabel}
                </SubmitButton>
              </form>
            ) : null}
          </div>
        )}
      </section>

      <aside>
        <section aria-labelledby="live-arrivals-title">
          <h2 id="live-arrivals-title" className="text-lg font-bold">
            Arrivals
          </h2>
          <p className="mt-1 text-sm leading-5 text-muted">
            {checkedIn.length} of {going.length} here · late arrivals join the end of the queue.
          </p>
          {viewer.canManagePlay ? (
            <div className="mt-3 divide-y divide-line border-y border-line">
              {going.map(({ player, profile }) => (
                <AttendanceToggle
                  key={player.id}
                  sessionId={data.session.id}
                  sessionPlayerId={player.id}
                  name={playerName(player, profile)}
                  present={Boolean(player.checkedInAt)}
                />
              ))}
            </div>
          ) : viewer.rsvp === "going" && viewer.playerId ? (
            <div className="mt-3 border-y border-line py-3">
              <AttendanceToggle
                sessionId={data.session.id}
                sessionPlayerId={viewer.playerId}
                name="yourself"
                present={Boolean(viewer.checkedInAt)}
                compact
              />
            </div>
          ) : null}
        </section>

        <div className="mt-9 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-bold">
              {data.pairs.length ? "Team queue" : roundMode ? "Waiting & resting" : "Paddle stack"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {data.session.rotationMode === "round_robin"
                ? "Fixed pairs · next unplayed matchup"
                : data.pairs.length
                  ? "Pairs stay together · longest waiting first"
                  : roundMode
                    ? "Fair rests are prioritized next round"
                    : "Up next · longest waiting first"}
            </p>
          </div>
        </div>

        {data.pairs.length ? (
          waitingPairs.length ? (
            <ol className="mt-3 divide-y divide-line border-y border-line">
              {waitingPairs.map((pair, index) => {
                const names = pair.players.map(({ player, profile }) => playerName(player, profile));
                return (
                  <li key={pair.id} className="flex min-h-16 items-center gap-3 py-2">
                    <span className="score w-5 text-center text-sm font-bold text-muted">{index + 1}</span>
                    <span className="flex -space-x-2">
                      {pair.players.map(({ player, profile }, playerIndex) => (
                        <Avatar
                          key={player.id}
                          name={names[playerIndex]}
                          imageUrl={profileAvatarUrl(profile?.avatarPath)}
                          index={playerIndex}
                          size="sm"
                        />
                      ))}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{names.join(" + ")}</span>
                    {viewer.canManagePlay ? (
                      <DotsSixVertical aria-label={`Move ${names.join(" and ")}`} className="text-muted" size={18} />
                    ) : null}
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="mt-3 border-y border-line py-7 text-sm text-muted">Every pair is currently playing.</p>
          )
        ) : waiting.length ? (
          <ol className="mt-3 divide-y divide-line border-y border-line">
            {waiting.map(({ queue, player, profile }, index) => {
              const name = playerName(player, profile);
              return (
                <li key={queue.sessionPlayerId} className="flex min-h-16 items-center gap-3 py-2">
                  <span className="score w-5 text-center text-sm font-bold text-muted">{index + 1}</span>
                  <Avatar name={name} imageUrl={profileAvatarUrl(profile?.avatarPath)} index={index + 1} size="sm" />
                  <span className="flex-1 text-sm font-semibold">{name}</span>
                  {viewer.canManagePlay ? (
                    <DotsSixVertical aria-label={`Move ${name}`} className="text-muted" size={18} />
                  ) : null}
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="mt-3 border-y border-line py-7 text-sm text-muted">Everyone is currently playing.</p>
        )}

        <div className="mt-7 rounded-lg bg-primary-soft p-4">
          <p className="text-sm font-semibold">{rotationName(data.session.rotationMode)}</p>
          <p className="mt-1 text-sm leading-5 text-muted">
            {rotationDescription(data.session.rotationMode, data.session.rotationConfig)}
          </p>
        </div>

        {data.standings.length ? (
          <section className="mt-9">
            <h2 className="text-lg font-bold">Session Standings</h2>
            <div className="mt-3 overflow-hidden border-y border-line">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted">
                  <tr>
                    <th className="py-2 font-medium">Player</th>
                    <th className="py-2 text-right font-medium">W</th>
                    <th className="py-2 text-right font-medium">L</th>
                    <th className="py-2 text-right font-medium">+/−</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.standings.map((row) => (
                    <tr key={row.playerId}>
                      <td className="py-3 font-medium">{row.name}</td>
                      <td className="score py-3 text-right">{row.wins}</td>
                      <td className="score py-3 text-right">{row.losses}</td>
                      <td className="score py-3 text-right">
                        {row.differential > 0 ? "+" : ""}
                        {row.differential}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {viewer.canCompleteSession && !data.activeMatches.length ? (
          <form noValidate action={completeSession} className="mt-9 border-t border-line pt-5">
            <input type="hidden" name="sessionId" value={data.session.id} />
            <ConfirmSubmitButton
              variant="secondary"
              className="w-full"
              confirmTitle="End this session?"
              confirmText="You won’t be able to add more matches or scores. Play will become the final Recap, and Story will unlock sharing, photos, and crew notes."
              confirmLabel="End session"
              cancelLabel="Keep playing"
              pendingLabel="Ending session…"
            >
              End session
            </ConfirmSubmitButton>
            <p className="mt-2 text-center text-xs text-muted">
              This marks the game as ended and locks the final results.
            </p>
          </form>
        ) : null}
      </aside>
    </div>
  );
}
