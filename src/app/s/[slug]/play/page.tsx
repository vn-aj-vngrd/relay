import { Broadcast } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";

import { getPublicLiveSession } from "@/features/matches/queries";
import {
  SessionPlay,
  type SessionPlayViewer,
} from "@/features/matches/session-play";
import { sessionAccentStyle } from "@/features/sessions/accent";
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

  return (
    <main
      id="main-content"
      className="public-session-page min-h-full bg-surface pb-6 sm:pb-8"
      style={sessionAccentStyle(data.session.accentColor)}
    >
      <div className="public-session-content mx-auto w-full max-w-6xl bg-surface px-4 pb-8 pt-4 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="public-tab-title app-title">
              {completed ? "Recap" : "Play"}
            </h1>
            <p className="public-tab-description mt-2 text-sm text-muted">
              {completed
                ? "The final scores, pairings, highlights, and standings from this game."
                : "Court assignments, scores, partner rotations, and who plays next."}
            </p>
          </div>
          {data.session.status === "live" ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-live">
              <Broadcast aria-hidden size={17} />
              Play in progress
            </span>
          ) : null}
        </div>
        <div className={completed ? "sm:mt-7" : undefined}>
          <SessionPlay
            data={data}
            viewer={viewer}
            storyHref={`/s/${slug}/story`}
          />
        </div>
      </div>
    </main>
  );
}
