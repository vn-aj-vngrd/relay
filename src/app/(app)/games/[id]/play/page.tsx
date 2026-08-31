import { Broadcast, DotsSixVertical, Shuffle } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";

import { Avatar } from "@/components/shared/avatar-stack";
import { ConfirmSubmitButton } from "@/components/shared/confirm-submit-button";
import { GamePageIntro } from "@/components/shared/game-page-intro";
import { ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { can, sessionActor } from "@/features/auth/permissions";
import { requireUser } from "@/features/auth/session";
import { completeSession, createQueueMatch } from "@/features/matches/actions";
import { LiveCourt } from "@/features/matches/live-court";
import { getLiveSession } from "@/features/matches/queries";
import { rotationDescription, rotationName } from "@/features/matches/rotation";
import { RoundTimer } from "@/features/matches/round-timer";
import { getSessionRecapData } from "@/features/memories/queries";
import { SessionRecap } from "@/features/memories/session-recap";
import { profileAvatarUrl } from "@/features/players/avatar";
import { AttendanceToggle } from "@/features/sessions/attendance-toggle";

function playerName(player: { guestName: string | null }, profile: { name: string } | null) {
  return profile?.name ?? player.guestName ?? "Guest";
}

export default async function PlayPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const data = await getLiveSession((await params).id, user.id);
  if (!data) notFound();

  if (data.session.status === "completed") {
    const recap = await getSessionRecapData(data.session.id);
    return (
      <>
        <GamePageIntro
          title="Recap"
          description="The final scores, pairings, highlights, and standings from this game."
        />
        <div className="mx-auto w-full max-w-6xl sm:pt-6">
          <SessionRecap session={data.session} recap={recap} storyHref={`/games/${data.session.id}/story`} />
        </div>
      </>
    );
  }

  const actor = sessionActor({ userId: user.id, hostId: data.session.hostId, membership: data.membership });
  const canManagePlay = can(actor, "edit");
  const canCompleteSession = can(actor, "complete");
  const { canStartRotation, rotationLabel, roundMode, roundRobinComplete, roundStartedAt, waiting, waitingPairs } =
    data.play;
  const going = data.roster.filter(({ player }) => player.rsvp === "going");
  const checkedIn = going.filter(({ player }) => player.checkedInAt);

  return (
    <>
      <GamePageIntro
        title="Play"
        description="Court assignments, scores, partner rotations, and who plays next."
        action={
          <div className="flex items-center gap-2">
            {data.session.status === "live" ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-live">
                <Broadcast aria-hidden size={17} />
                Play in progress
              </span>
            ) : null}
          </div>
        }
      />
      {data.session.status !== "live" ? (
        <section className="mx-auto w-full max-w-2xl border-y border-line py-10 text-center sm:mt-8 sm:py-14">
          <Broadcast aria-hidden className="mx-auto text-primary" size={26} />
          <h2 className="mt-4 text-2xl font-bold">Play hasn’t started</h2>
          <p className="mx-auto mt-2 max-w-lg text-pretty text-sm leading-6 text-muted sm:text-base">
            {canManagePlay
              ? "Confirm who’s here, choose the court flow, and start the first rotation."
              : "The host will start courts and the queue when the group is ready."}
          </p>
          {canManagePlay ? (
            <ButtonLink href={`/games/${data.session.id}/play/setup`} className="mt-6">
              Start Play
            </ButtonLink>
          ) : data.membership?.rsvp === "going" ? (
            <div className="mx-auto mt-6 max-w-xs border-t border-line pt-5 text-left">
              <p className="mb-2 text-center text-sm text-muted">At the court? Mark yourself here.</p>
              <AttendanceToggle
                sessionId={data.session.id}
                sessionPlayerId={data.membership.id}
                name="yourself"
                present={Boolean(data.membership.checkedInAt)}
                compact
              />
            </div>
          ) : null}
        </section>
      ) : (
        <div className="grid gap-7 sm:pt-6 lg:grid-cols-[1fr_330px]">
          <section>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">Active courts</h2>
                <p className="mt-1 text-sm text-muted">
                  {rotationName(data.session.rotationMode)} · scores update for everyone
                </p>
              </div>
              {canManagePlay && canStartRotation && data.activeMatches.length > 0 ? (
                <form action={createQueueMatch}>
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
                <RoundTimer
                  startedAt={roundStartedAt.toISOString()}
                  durationMinutes={data.session.roundDurationMinutes}
                />
              </div>
            ) : null}
            {data.activeMatches.length ? (
              <div className="grid gap-5">
                {data.activeMatches.map((match) => {
                  const teamA = match.players
                    .filter(({ matchPlayer }) => matchPlayer.team === "A")
                    .map(({ player, profile }) => playerName(player, profile))
                    .join(" + ");
                  const teamB = match.players
                    .filter(({ matchPlayer }) => matchPlayer.team === "B")
                    .map(({ player, profile }) => playerName(player, profile))
                    .join(" + ");
                  return (
                    <LiveCourt
                      key={match.id}
                      sessionId={data.session.id}
                      matchId={match.id}
                      number={match.courtLabel}
                      teams={[teamA, teamB]}
                      scores={[match.teamAScore, match.teamBScore]}
                      version={match.version}
                      canScore={can(
                        {
                          ...actor,
                          assignedScorer: Boolean(
                            data.membership && match.players.some(({ player }) => player.id === data.membership?.id),
                          ),
                        },
                        "score",
                      )}
                    />
                  );
                })}
              </div>
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
                {canManagePlay && canStartRotation ? (
                  <form action={createQueueMatch} className="mt-5">
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
              {canManagePlay ? (
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
              ) : data.membership?.rsvp === "going" ? (
                <div className="mt-3 border-y border-line py-3">
                  <AttendanceToggle
                    sessionId={data.session.id}
                    sessionPlayerId={data.membership.id}
                    name="yourself"
                    present={Boolean(data.membership.checkedInAt)}
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
                        {canManagePlay ? (
                          <DotsSixVertical
                            aria-label={`Move ${names.join(" and ")}`}
                            className="text-muted"
                            size={18}
                          />
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
                      <Avatar
                        name={name}
                        imageUrl={profileAvatarUrl(profile?.avatarPath)}
                        index={index + 1}
                        size="sm"
                      />
                      <span className="flex-1 text-sm font-semibold">{name}</span>
                      {canManagePlay ? (
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
            {canCompleteSession && !data.activeMatches.length ? (
              <form action={completeSession} className="mt-9 border-t border-line pt-5">
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
      )}
    </>
  );
}
