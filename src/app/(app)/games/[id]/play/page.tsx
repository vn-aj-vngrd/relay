import { Broadcast, DotsSixVertical, Shuffle } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/shared/avatar-stack";
import { ConfirmSubmitButton } from "@/components/shared/confirm-submit-button";
import { SessionNav } from "@/components/shared/session-nav";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/features/auth/session";
import { completeSession, createQueueMatch } from "@/features/matches/actions";
import { LiveCourt } from "@/features/matches/live-court";
import { PlaySetupForm } from "@/features/matches/play-setup-form";
import { startMatchLabel } from "@/features/matches/presentation";
import { getLiveSession } from "@/features/matches/queries";
import { rotationDescription, rotationName } from "@/features/matches/rotation";
import { profileAvatarUrl } from "@/features/players/avatar";
import { sessionAccentStyle } from "@/features/sessions/accent";
import { RealtimeRefresh } from "@/features/sessions/realtime-refresh";
import { ShareButton } from "@/features/sessions/share-button";

function playerName(player: { guestName: string | null }, profile: { name: string } | null) {
  return profile?.name ?? player.guestName ?? "Guest";
}

export default async function PlayPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const data = await getLiveSession((await params).id, user.id);
  if (!data) notFound();

  const isHost = data.session.hostId === user.id || data.membership?.role === "cohost";
  const waiting = data.queue.filter(({ queue }) => queue.state === "waiting");
  const goingCount = data.roster.filter(({ player }) => player.rsvp === "going").length;
  const roundMode = data.session.rotationMode === "random" || data.session.rotationMode === "king_of_court";
  const canStartRotation = waiting.length >= 4 && (roundMode ? data.activeMatches.length === 0 : data.activeMatches.length < data.courts.length);
  const rotationLabel = roundMode ? (data.completedMatchCount ? "Start next round" : "Start first round") : startMatchLabel(data.completedMatchCount);

  return <div style={sessionAccentStyle(data.session.accentColor)}>
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-sm font-semibold text-primary">{data.session.title}</p><h1 className="mt-1 app-title">Play</h1><p className="mt-2 text-sm text-muted">Court assignments, scores, and who plays next.</p></div>
      <div className="flex flex-wrap items-center justify-end gap-2">{data.session.status === "live" ? <span className="mr-1 inline-flex items-center gap-1.5 text-sm font-semibold text-live"><Broadcast aria-hidden size={17} />Play in progress</span> : null}{isHost ? <ShareButton url={`/s/${data.session.slug}`} title={data.session.title} /> : null}<RealtimeRefresh sessionId={data.session.id} /></div>
    </div>
    <SessionNav id={data.session.id} active="Play" />

    {data.session.status !== "live" ? <section className="mx-auto max-w-2xl py-10 sm:py-14">
      <div className="text-center"><Broadcast className="mx-auto text-primary" size={26} /><h2 className="mt-4 text-2xl font-bold">Choose how tonight runs</h2><p className="mx-auto mt-2 max-w-lg text-pretty text-muted">Set the court flow before play starts. Everyone will see the same assignments, queue, and scores.</p></div>
      {isHost ? <PlaySetupForm sessionId={data.session.id} playerCount={goingCount} courtCount={data.courts.length} /> : <p className="mt-7 text-center text-sm font-medium text-muted">The host is choosing the play setup.</p>}
    </section> : <div className="grid gap-7 pt-6 lg:grid-cols-[1fr_330px]">
      <section>
        <div className="mb-4 flex items-center justify-between gap-4"><div><h2 className="text-lg font-bold">Active courts</h2><p className="mt-1 text-sm text-muted">{rotationName(data.session.rotationMode)} · scores update for everyone</p></div>{isHost && canStartRotation && data.activeMatches.length > 0 ? <form action={createQueueMatch}><input type="hidden" name="sessionId" value={data.session.id} /><SubmitButton pendingLabel="Creating match…" variant="secondary"><Shuffle size={17} />{rotationLabel}</SubmitButton></form> : null}</div>
        {data.activeMatches.length ? <div className="grid gap-5 xl:grid-cols-2">{data.activeMatches.map((match) => {
          const teamA = match.players.filter(({ matchPlayer }) => matchPlayer.team === "A").map(({ player, profile }) => playerName(player, profile)).join(" + ");
          const teamB = match.players.filter(({ matchPlayer }) => matchPlayer.team === "B").map(({ player, profile }) => playerName(player, profile)).join(" + ");
          return <LiveCourt key={match.id} sessionId={data.session.id} matchId={match.id} number={match.courtLabel} teams={[teamA, teamB]} scores={[match.teamAScore, match.teamBScore]} version={match.version} canScore={isHost} />;
        })}</div> : <div className="border-y border-line py-10"><h3 className="font-bold">{data.completedMatchCount ? "Ready for what’s next" : "Courts are open"}</h3><p className="mt-2 text-sm text-muted">{waiting.length < 4 ? `Waiting for ${4 - waiting.length} more ${4 - waiting.length === 1 ? "player" : "players"}.` : roundMode ? "Every court is ready for the next round." : "The next four players are ready."}</p>{isHost && canStartRotation ? <form action={createQueueMatch} className="mt-5"><input type="hidden" name="sessionId" value={data.session.id} /><SubmitButton pendingLabel={roundMode ? "Starting round…" : "Starting match…"}><Shuffle size={17} />{rotationLabel}</SubmitButton></form> : null}</div>}
      </section>

      <aside>
        <div className="flex items-end justify-between"><div><h2 className="text-lg font-bold">{roundMode ? "Waiting & resting" : "Paddle stack"}</h2><p className="mt-1 text-sm text-muted">{roundMode ? "Fair rests are prioritized next round" : "Up next · longest waiting first"}</p></div></div>
        {waiting.length ? <ol className="mt-3 divide-y divide-line border-y border-line">{waiting.map(({ queue, player, profile }, index) => {
          const name = playerName(player, profile);
          return <li key={queue.sessionPlayerId} className="flex min-h-16 items-center gap-3 py-2"><span className="score w-5 text-center text-sm font-bold text-muted">{index + 1}</span><Avatar name={name} imageUrl={profileAvatarUrl(profile?.avatarPath)} index={index + 1} size="sm" /><span className="flex-1 text-sm font-semibold">{name}</span>{isHost ? <DotsSixVertical aria-label={`Move ${name}`} className="text-muted" size={18} /> : null}</li>;
        })}</ol> : <p className="mt-3 border-y border-line py-7 text-sm text-muted">Everyone is currently playing.</p>}
        <div className="mt-7 rounded-lg bg-primary-soft p-4"><p className="text-sm font-semibold">{rotationName(data.session.rotationMode)}</p><p className="mt-1 text-sm leading-5 text-muted">{rotationDescription(data.session.rotationMode, data.session.rotationConfig)}</p></div>

        {data.standings.length ? <section className="mt-9"><h2 className="text-lg font-bold">Session Standings</h2><div className="mt-3 overflow-hidden border-y border-line"><table className="w-full text-sm"><thead className="text-left text-xs text-muted"><tr><th className="py-2 font-medium">Player</th><th className="py-2 text-right font-medium">W</th><th className="py-2 text-right font-medium">L</th><th className="py-2 text-right font-medium">+/−</th></tr></thead><tbody className="divide-y divide-line">{data.standings.map((row) => <tr key={row.playerId}><td className="py-3 font-medium">{row.name}</td><td className="score py-3 text-right">{row.wins}</td><td className="score py-3 text-right">{row.losses}</td><td className="score py-3 text-right">{row.differential > 0 ? "+" : ""}{row.differential}</td></tr>)}</tbody></table></div></section> : null}
        {isHost && !data.activeMatches.length ? <form action={completeSession} className="mt-9 border-t border-line pt-5"><input type="hidden" name="sessionId" value={data.session.id} /><ConfirmSubmitButton variant="secondary" className="w-full" confirmText="End this session? Active play will close and the game will become a shared memory." pendingLabel="Ending session…">End session</ConfirmSubmitButton><p className="mt-2 text-center text-xs text-muted">This turns the game into a permanent memory.</p></form> : null}
      </aside>
    </div>}
  </div>;
}
