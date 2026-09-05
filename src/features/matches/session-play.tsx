import { Broadcast } from "@phosphor-icons/react/dist/ssr";

import { Avatar } from "@/components/shared/avatar-stack";
import { ConfirmSubmitButton } from "@/components/shared/confirm-submit-button";
import { ButtonLink } from "@/components/ui/button";
import { PostGameFeedback } from "@/features/feedback/post-game-feedback";
import { completeSession } from "@/features/matches/actions";
import type { getLiveSession } from "@/features/matches/queries";
import { getSessionRecapData } from "@/features/memories/queries";
import { SessionRecap } from "@/features/memories/session-recap";
import { profileAvatarUrl } from "@/features/players/avatar";
import {
  AttendanceToggle,
  PlayAvailabilityControl,
} from "@/features/sessions/attendance-toggle";
import type { PostGameContinuation } from "@/features/sessions/post-game";

import { derivePersonalPlayState } from "./lifecycle";
import { LiveCourtDeck } from "./live-court";
import { MatchResults } from "./match-results";
import { PersonalPlayPanel } from "./personal-play-panel";
import {
  CourtAvailabilityControl,
  MatchCancellationControl,
  QueueOrderControls,
} from "./play-management-controls";
import { PlaySectionTabs } from "./play-section-tabs";
import { rotationDescription, rotationName } from "./rotation";
import { RoundTimer } from "./round-timer";
import { StartRotationForm } from "./start-rotation-form";

export type SessionPlayData = Omit<
  NonNullable<Awaited<ReturnType<typeof getLiveSession>>>,
  "membership"
>;

export type SessionPlayViewer = {
  playerId?: string;
  rsvp?: string;
  checkedInAt?: Date | null;
  playState?: string;
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
  showPostGameFeedback?: boolean;
};

function playerName(
  player: { guestName: string | null },
  profile: { name: string } | null
) {
  return profile?.name ?? player.guestName ?? "Guest";
}

function canScoreMatch(viewer: SessionPlayViewer, playerIds: string[]) {
  return (
    viewer.canScoreAll ||
    Boolean(
      viewer.canScoreAssigned &&
        viewer.playerId &&
        playerIds.includes(viewer.playerId)
    )
  );
}

export async function SessionPlay({
  data,
  viewer,
  setupHref,
  storyHref,
  continuation,
  showPostGameFeedback = false,
}: SessionPlayProps) {
  if (data.session.status === "completed") {
    const recap = await getSessionRecapData(data.session.id);
    return (
      <SessionRecap
        session={data.session}
        recap={recap}
        storyHref={storyHref}
        continuation={continuation}
        canCorrectScores={viewer.canManagePlay}
        feedback={
          showPostGameFeedback ? (
            <PostGameFeedback
              sessionId={data.session.id}
              issueHref={`/feedback?session=${data.session.id}`}
            />
          ) : undefined
        }
      />
    );
  }

  const {
    canStartRotation,
    rotationLabel,
    roundMode,
    roundRobinComplete,
    roundStartedAt,
    waiting,
    waitingPairs,
  } = data.play;
  const going = data.roster.filter(({ player }) => player.rsvp === "going");
  const queueByPlayerId = new Map(
    data.queue.map(({ queue }) => [queue.sessionPlayerId, queue])
  );
  const readyCount = going.filter(({ player }) => {
    const state = queueByPlayerId.get(player.id)?.state;
    return (
      player.playState !== "resting" &&
      (state === "playing" || state === "waiting")
    );
  }).length;
  const acknowledgedCount = data.queue.filter(
    ({ queue }) => queue.state === "waiting" && queue.readyAt
  ).length;
  const personalState = derivePersonalPlayState({
    playerId: viewer.playerId,
    rsvp: viewer.rsvp,
    checkedInAt: viewer.checkedInAt,
    playState: viewer.playState,
    queue: data.queue.map(({ queue }) => ({
      playerId: queue.sessionPlayerId,
      position: queue.position,
      state: queue.state,
      readyAt: queue.readyAt,
    })),
    activeMatches: data.activeMatches.map((match) => ({
      id: match.id,
      courtLabel: match.courtLabel,
      players: match.players.map(({ matchPlayer, player, profile }) => ({
        id: player.id,
        name: playerName(player, profile),
        team: matchPlayer.team,
      })),
    })),
    pairs: data.pairs,
  });
  const recentResult = viewer.playerId
    ? data.completedMatches.find(
        (match) =>
          match.teamAPlayerIds.includes(viewer.playerId!) ||
          match.teamBPlayerIds.includes(viewer.playerId!)
      )
    : null;
  const personalResult =
    viewer.playerId && recentResult
      ? {
          courtLabel: recentResult.courtLabel,
          score: `${recentResult.scores[0]}–${recentResult.scores[1]}`,
          won:
            (recentResult.teamAPlayerIds.includes(viewer.playerId) &&
              recentResult.winningTeam === "A") ||
            (recentResult.teamBPlayerIds.includes(viewer.playerId) &&
              recentResult.winningTeam === "B"),
        }
      : null;

  if (data.session.status === "cancelled") {
    return (
      <section className="mx-auto w-full max-w-2xl border-y border-line py-10 text-center sm:mt-8 sm:py-14">
        <h2 className="text-2xl font-bold">This game was cancelled</h2>
        <p className="mx-auto mt-2 max-w-lg break-words text-sm leading-6 text-muted sm:text-base">
          {data.session.cancellationReason ??
            "The organizer cancelled the game before Play started."}
        </p>
      </section>
    );
  }

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
            <p className="mb-2 text-center text-sm text-muted">
              At the court? Mark yourself here.
            </p>
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
    <div>
      {viewer.playerId && personalState.kind !== "not_participating" ? (
        <PersonalPlayPanel
          sessionId={data.session.id}
          playerId={viewer.playerId}
          state={personalState}
          queueState={queueByPlayerId.get(viewer.playerId)?.state}
          playerState={viewer.playState ?? "unavailable"}
          recentResult={personalResult}
        />
      ) : null}
      <PlaySectionTabs
        courts={
          <section>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">Active courts</h2>
                <p className="mt-1 text-sm text-muted">
                  {rotationName(data.session.rotationMode)} · scores update for
                  everyone
                </p>
              </div>
              {viewer.canManagePlay &&
              canStartRotation &&
              data.activeMatches.length > 0 ? (
                <StartRotationForm
                  sessionId={data.session.id}
                  label={rotationLabel}
                  pendingLabel="Creating match…"
                  secondary
                />
              ) : null}
            </div>
            {data.session.roundDurationMinutes && roundStartedAt ? (
              <div className="mb-5">
                <RoundTimer
                  startedAt={roundStartedAt.toISOString()}
                  durationMinutes={data.session.roundDurationMinutes}
                />
              </div>
            ) : null}
            {data.activeMatches.length ? (
              <LiveCourtDeck
                courts={data.activeMatches.map((match) => {
                  const playerIds = match.players.map(
                    ({ player }) => player.id
                  );
                  return {
                    sessionId: data.session.id,
                    matchId: match.id,
                    number: match.courtLabel,
                    teams: [
                      match.players
                        .filter(({ matchPlayer }) => matchPlayer.team === "A")
                        .map(({ player, profile }) =>
                          playerName(player, profile)
                        )
                        .join(" + "),
                      match.players
                        .filter(({ matchPlayer }) => matchPlayer.team === "B")
                        .map(({ player, profile }) =>
                          playerName(player, profile)
                        )
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
                  <div className="mt-5">
                    <StartRotationForm
                      sessionId={data.session.id}
                      label={rotationLabel}
                      pendingLabel={
                        roundMode ? "Starting round…" : "Starting match…"
                      }
                    />
                  </div>
                ) : null}
              </div>
            )}
          </section>
        }
        queue={
          <section aria-labelledby="live-queue-title">
            <div className="flex items-end justify-between">
              <div>
                <h2 id="live-queue-title" className="text-lg font-bold">
                  {data.pairs.length
                    ? "Team queue"
                    : roundMode
                      ? "Waiting & resting"
                      : "Paddle stack"}
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
                    const names = pair.players.map(({ player, profile }) =>
                      playerName(player, profile)
                    );
                    return (
                      <li
                        key={pair.id}
                        className="flex min-h-16 items-center gap-3 py-2"
                      >
                        <span className="score w-5 text-center text-sm font-bold text-muted">
                          {index + 1}
                        </span>
                        <span className="flex -space-x-2">
                          {pair.players.map(
                            ({ player, profile }, playerIndex) => (
                              <Avatar
                                key={player.id}
                                name={names[playerIndex]}
                                imageUrl={profileAvatarUrl(profile?.avatarPath)}
                                index={playerIndex}
                                size="sm"
                              />
                            )
                          )}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                          {names.join(" + ")}
                          {viewer.playerId &&
                          pair.players.some(
                            ({ player }) => player.id === viewer.playerId
                          )
                            ? " · You"
                            : ""}
                        </span>
                        {viewer.canManagePlay && pair.players[0] ? (
                          <QueueOrderControls
                            sessionId={data.session.id}
                            sessionPlayerId={pair.players[0].player.id}
                            version={pair.players[0].queue.version}
                            name={names.join(" and ")}
                          />
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="mt-3 border-y border-line py-7 text-sm text-muted">
                  Every pair is currently playing.
                </p>
              )
            ) : waiting.length ? (
              <ol className="mt-3 divide-y divide-line border-y border-line">
                {waiting.map(({ queue, player, profile }, index) => {
                  const name = playerName(player, profile);
                  return (
                    <li
                      key={queue.sessionPlayerId}
                      className="flex min-h-16 items-center gap-3 py-2"
                    >
                      <span className="score w-5 text-center text-sm font-bold text-muted">
                        {index + 1}
                      </span>
                      <Avatar
                        name={name}
                        imageUrl={profileAvatarUrl(profile?.avatarPath)}
                        index={index + 1}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                        {name}
                        {viewer.playerId === player.id ? " · You" : ""}
                      </span>
                      {viewer.canManagePlay ? (
                        <QueueOrderControls
                          sessionId={data.session.id}
                          sessionPlayerId={player.id}
                          version={queue.version}
                          name={name}
                        />
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="mt-3 border-y border-line py-7 text-sm text-muted">
                Everyone is currently playing.
              </p>
            )}

            <div className="mt-7 rounded-lg bg-primary-soft p-4">
              <p className="text-sm font-semibold">
                {rotationName(data.session.rotationMode)}
              </p>
              <p className="mt-1 text-sm leading-5 text-muted">
                {rotationDescription(
                  data.session.rotationMode,
                  data.session.rotationConfig
                )}
              </p>
            </div>
          </section>
        }
        results={
          data.completedMatches.length ? (
            <section aria-label="Completed match results">
              <MatchResults
                sessionId={data.session.id}
                results={data.completedMatches}
                canCorrect={viewer.canManagePlay}
              />
            </section>
          ) : undefined
        }
        standings={
          data.standings.length ? (
            <section aria-labelledby="live-standings-title">
              <h2 id="live-standings-title" className="text-lg font-bold">
                Session Standings
              </h2>
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
          ) : undefined
        }
        manage={
          viewer.canManagePlay ? (
            <div className="space-y-8 sm:space-y-9">
              <section aria-labelledby="live-availability-title">
                <h2 id="live-availability-title" className="text-lg font-bold">
                  Player availability
                </h2>
                <p className="mt-1 text-sm leading-5 text-muted">
                  {readyCount} of {going.length} available
                  {acknowledgedCount
                    ? ` · ${acknowledgedCount} confirmed ready`
                    : ""}{" "}
                  · late arrivals and returning players join the end.
                </p>
                <div className="mt-3 divide-y divide-line border-y border-line">
                  {going.map(({ player, profile }) => (
                    <PlayAvailabilityControl
                      key={player.id}
                      sessionId={data.session.id}
                      sessionPlayerId={player.id}
                      name={playerName(player, profile)}
                      queueState={queueByPlayerId.get(player.id)?.state}
                      playerState={player.playState}
                    />
                  ))}
                </div>
              </section>
              <section aria-labelledby="court-availability-title">
                <h2 id="court-availability-title" className="text-lg font-bold">
                  Court availability
                </h2>
                <p className="mt-1 text-sm leading-5 text-muted">
                  Closing an occupied court lets its current match finish and
                  blocks the next assignment.
                </p>
                <div className="mt-3 divide-y divide-line border-y border-line">
                  {data.courts.map((court) => (
                    <CourtAvailabilityControl
                      key={court.id}
                      sessionId={data.session.id}
                      courtId={court.id}
                      label={court.label}
                      version={court.version}
                      available={court.availableForPlay}
                      active={data.activeMatches.some(
                        (match) => match.courtId === court.id
                      )}
                    />
                  ))}
                </div>
              </section>
              {data.activeMatches.length ? (
                <section aria-labelledby="match-controls-title">
                  <h2 id="match-controls-title" className="text-lg font-bold">
                    Match controls
                  </h2>
                  <div className="mt-3 divide-y divide-line border-y border-line">
                    {data.activeMatches.map((match) => (
                      <div
                        key={match.id}
                        className="flex min-h-14 flex-wrap items-center justify-between gap-2 py-2"
                      >
                        <span className="mr-auto text-sm font-semibold">
                          {match.courtLabel}
                        </span>
                        <MatchCancellationControl
                          sessionId={data.session.id}
                          matchId={match.id}
                          courtLabel={match.courtLabel}
                          version={match.version}
                          synchronized={roundMode}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
              {viewer.canCompleteSession && !data.activeMatches.length ? (
                <form
                  noValidate
                  action={completeSession}
                  className="border-t border-line pt-5"
                >
                  <input
                    type="hidden"
                    name="sessionId"
                    value={data.session.id}
                  />
                  <ConfirmSubmitButton
                    variant="secondary"
                    className="w-full"
                    confirmTitle="End this session?"
                    confirmText="You won’t be able to add more matches or scores. Play will become the final Recap, and Story will keep sharing and game photos available."
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
            </div>
          ) : undefined
        }
      />
    </div>
  );
}
