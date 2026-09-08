import { notFound } from "next/navigation";
import { Suspense } from "react";

import { getPublicLiveSession } from "@/features/matches/queries";
import {
  SessionPlay,
  type SessionPlayViewer,
} from "@/features/matches/session-play";
import { sessionAccentStyle } from "@/features/sessions/accent";
import { PlayRosterSurface } from "@/features/sessions/play-roster-surface";
import { SessionRoster } from "@/features/sessions/session-roster";
import { getSessionViewer } from "@/features/sessions/viewer";

export default async function PublicPlayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const data = await getPublicLiveSession(slug);
  if (!data) notFound();

  const sessionViewer =
    data.session.status === "completed"
      ? null
      : await getSessionViewer(data.session.id, slug);
  const viewer: SessionPlayViewer = {
    playerId: sessionViewer?.player.id,
    rsvp: sessionViewer?.player.rsvp,
    checkedInAt: sessionViewer?.player.checkedInAt,
    playState: sessionViewer?.player.playState,
    canManagePlay: false,
    canCompleteSession: false,
    canScoreAll: Boolean(
      sessionViewer?.user &&
        (data.session.hostId === sessionViewer.user.id ||
          sessionViewer.player.role === "cohost")
    ),
    canScoreAssigned: Boolean(sessionViewer?.user),
  };
  const completed = data.session.status === "completed";

  const ended = completed || data.session.status === "cancelled";
  const roster = (
    <Suspense fallback={<p role="status">Loading players…</p>}>
      <PlayRosterSurface
        status={data.session.status}
        count={
          data.roster.filter(({ player }) => player.rsvp === "going").length
        }
        pendingCount={
          viewer.canManagePlay
            ? data.roster.filter(({ player }) => player.rsvp === "pending")
                .length
            : 0
        }
      >
        <SessionRoster
          data={data}
          canManage={viewer.canManagePlay}
          viewerPlayerId={viewer.playerId}
        />
      </PlayRosterSurface>
    </Suspense>
  );

  return (
    <main
      id="main-content"
      className="public-session-page min-h-full bg-surface pb-6 sm:pb-8"
      style={sessionAccentStyle(data.session.accentColor)}
    >
      <div className="public-session-content mx-auto w-full max-w-6xl bg-surface px-4 pb-8 pt-4 sm:px-6 sm:py-8">
        <h1 className="sr-only">{completed ? "Recap" : "Play"}</h1>
        {!ended && data.session.status !== "live" ? roster : null}
        <SessionPlay
          headerActions={data.session.status === "live" ? roster : undefined}
          data={data}
          viewer={viewer}
          storyHref={`/s/${slug}/story`}
        />
        {ended ? roster : null}
      </div>
    </main>
  );
}
