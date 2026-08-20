import { Broadcast, Users } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";

import { Avatar } from "@/components/shared/avatar-stack";
import { LiveCourt } from "@/features/matches/live-court";
import { getPublicLiveSession } from "@/features/matches/queries";
import { rotationDescription, rotationName } from "@/features/matches/rotation";
import { RoundTimer } from "@/features/matches/round-timer";
import { getSessionRecapData } from "@/features/memories/queries";
import { SessionRecap } from "@/features/memories/session-recap";
import { profileAvatarUrl } from "@/features/players/avatar";
import { sessionAccentStyle } from "@/features/sessions/accent";
import { AttendanceToggle } from "@/features/sessions/attendance-toggle";
import { getSessionViewer } from "@/features/sessions/viewer";

function name(player: { guestName: string | null }, profile: { name: string } | null) {
  return profile?.name ?? player.guestName ?? "Guest";
}

export default async function PublicPlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const data = await getPublicLiveSession(slug);
  if (!data) notFound();

  if (data.session.status === "completed") {
    const recap = await getSessionRecapData(data.session.id);
    return (
      <main
        id="main-content"
        className="public-session-page min-h-full bg-surface pb-6 sm:pb-8"
        style={sessionAccentStyle(data.session.accentColor)}
      >
        <div className="public-session-panel public-session-content mx-auto max-w-6xl bg-surface px-4 py-8 sm:mt-8 sm:rounded-xl sm:border sm:border-line sm:px-8">
          <p title={data.session.title} className="truncate text-sm font-semibold text-primary">
            {data.session.title}
          </p>
          <h1 className="mt-1 app-title">Recap</h1>
          <p className="mt-2 text-sm text-muted">
            The final scores, pairings, highlights, and standings from this game.
          </p>
          <div className="mt-7">
            <SessionRecap session={data.session} recap={recap} storyHref={`/s/${slug}/story`} />
          </div>
        </div>
      </main>
    );
  }

  const viewer = await getSessionViewer(data.session.id, slug);
  const waiting = data.queue.filter(({ queue }) => queue.state === "waiting");
  const waitingById = new Map(waiting.map((item) => [item.player.id, item]));
  const waitingPairs = data.pairs
    .map((pair) => ({
      ...pair,
      players: pair.members.flatMap((id) => (waitingById.get(id) ? [waitingById.get(id)!] : [])),
    }))
    .filter((pair) => pair.players.length === 2)
    .toSorted(
      (left, right) =>
        Math.min(...left.players.map((item) => item.queue.position)) -
        Math.min(...right.players.map((item) => item.queue.position)),
    );
  const roundStartedAt = data.activeMatches
    .flatMap((match) => (match.startedAt ? [match.startedAt] : []))
    .toSorted((left, right) => left.getTime() - right.getTime())[0];
  const roundMode =
    data.session.rotationMode === "random" ||
    data.session.rotationMode === "balanced" ||
    data.session.rotationMode === "king_of_court" ||
    data.session.rotationMode === "round_robin";
  return (
    <main
      id="main-content"
      className="public-session-page min-h-full bg-surface pb-6 sm:pb-8"
      style={sessionAccentStyle(data.session.accentColor)}
    >
      <div className="public-session-panel public-session-content mx-auto max-w-6xl bg-surface px-4 py-8 sm:mt-8 sm:rounded-xl sm:border sm:border-line sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p title={data.session.title} className="truncate text-sm font-semibold text-primary">
              {data.session.title}
            </p>
            <h1 className="mt-1 app-title">Play</h1>
            <p className="mt-2 text-sm text-muted">Court assignments, scores, and who plays next.</p>
          </div>
        </div>
        {data.session.status !== "live" && !data.activeMatches.length ? (
          <section className="mt-10 border-y border-line py-12 text-center">
            <Broadcast aria-hidden size={25} className="mx-auto text-primary" />
            <h2 className="mt-4 text-xl font-bold">Play hasn’t started</h2>
            <p className="mt-2 text-sm text-muted">
              The host will start courts and the paddle stack when everyone arrives.
            </p>
            {viewer?.player.rsvp === "going" ? (
              <div className="mx-auto mt-6 max-w-xs border-t border-line pt-5">
                <p className="mb-3 text-sm text-muted">At the court? Let the host know you’re ready.</p>
                <AttendanceToggle
                  sessionId={data.session.id}
                  sessionPlayerId={viewer.player.id}
                  name="yourself"
                  present={Boolean(viewer.player.checkedInAt)}
                  compact
                />
              </div>
            ) : null}
          </section>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
            <section>
              <h2 className="mb-4 text-lg font-bold">Active courts</h2>
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
                      .map(({ player, profile }) => name(player, profile))
                      .join(" + ");
                    const teamB = match.players
                      .filter(({ matchPlayer }) => matchPlayer.team === "B")
                      .map(({ player, profile }) => name(player, profile))
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
                        canScore={Boolean(
                          viewer?.user &&
                          (data.session.hostId === viewer.user.id ||
                            viewer.player.role === "cohost" ||
                            match.players.some(({ player }) => player.id === viewer.player.id)),
                        )}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="border-y border-line py-10">
                  <h3 className="font-bold">No match is active</h3>
                  <p className="mt-2 text-sm text-muted">Watch the waiting list for the next court assignment.</p>
                </div>
              )}
            </section>
            <aside>
              <div className="flex items-start gap-2">
                <Users aria-hidden size={18} className="mt-0.5 text-primary" />
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
                          ? rotationName(data.session.rotationMode)
                          : "Up next · longest waiting first"}
                  </p>
                </div>
              </div>
              {data.pairs.length ? (
                waitingPairs.length ? (
                  <ol className="mt-3 divide-y divide-line border-y border-line">
                    {waitingPairs.map((pair, index) => {
                      const pairNames = pair.players.map(({ player, profile }) => name(player, profile));
                      return (
                        <li key={pair.id} className="public-session-row flex min-h-14 items-center gap-3">
                          <span className="score w-5 text-sm text-muted">{index + 1}</span>
                          <span className="flex -space-x-2">
                            {pair.players.map(({ player, profile }, playerIndex) => (
                              <Avatar
                                key={player.id}
                                name={pairNames[playerIndex]}
                                imageUrl={profileAvatarUrl(profile?.avatarPath)}
                                index={playerIndex}
                                size="sm"
                              />
                            ))}
                          </span>
                          <span className="min-w-0 truncate font-medium">{pairNames.join(" + ")}</span>
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
                    const playerName = name(player, profile);
                    return (
                      <li key={queue.sessionPlayerId} className="public-session-row flex min-h-14 items-center gap-3">
                        <span className="score w-5 text-sm text-muted">{index + 1}</span>
                        <Avatar
                          name={playerName}
                          imageUrl={profileAvatarUrl(profile?.avatarPath)}
                          index={index}
                          size="sm"
                        />
                        <span className="font-medium">{playerName}</span>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="mt-3 border-y border-line py-7 text-sm text-muted">No one is waiting right now.</p>
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
                          <th className="py-2">Player</th>
                          <th className="py-2 text-right">W</th>
                          <th className="py-2 text-right">L</th>
                          <th className="py-2 text-right">+/−</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {data.standings.map((row) => (
                          <tr key={row.playerId} className="public-session-row">
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
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
