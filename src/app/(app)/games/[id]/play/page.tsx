import { Broadcast } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { GamePageIntro } from "@/components/shared/game-page-intro";
import { can, sessionActor } from "@/features/auth/permissions";
import { requireUser } from "@/features/auth/session";
import { shouldShowPostGameFeedback } from "@/features/feedback/queries";
import { getWorkspaceLiveSession } from "@/features/matches/queries";
import {
  SessionPlay,
  type SessionPlayViewer,
} from "@/features/matches/session-play";
import { PlayRosterSurface } from "@/features/sessions/play-roster-surface";
import { postGameContinuation } from "@/features/sessions/post-game";
import { SessionRoster } from "@/features/sessions/session-roster";

export default async function PlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const data = await getWorkspaceLiveSession((await params).id, user.id);
  if (!data) notFound();

  const actor = {
    ...sessionActor({
      userId: user.id,
      hostId: data.session.hostId,
      membership: data.membership,
    }),
    leadOrganizer: data.session.leadOrganizerId === user.id,
  };
  const viewer: SessionPlayViewer = {
    playerId: data.membership?.id,
    rsvp: data.membership?.rsvp,
    checkedInAt: data.membership?.checkedInAt,
    playState: data.membership?.playState,
    canManagePlay: can(actor, "edit"),
    canCompleteSession: can(actor, "complete"),
    canScoreAll: can(actor, "score"),
    canScoreAssigned: can({ ...actor, assignedScorer: true }, "score"),
  };
  const completed = data.session.status === "completed";
  const continuation = postGameContinuation(data.session, user.id);
  const canReviewGame =
    data.session.hostId === user.id || data.membership?.rsvp === "going";
  const showPostGameFeedback =
    completed && canReviewGame
      ? await shouldShowPostGameFeedback(user.id, data.session.id)
      : false;

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
    <>
      <GamePageIntro
        title={completed ? "Recap" : "Play"}
        action={
          data.session.status === "live" ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-live">
              <Broadcast aria-hidden size={17} />
              Play in progress
            </span>
          ) : undefined
        }
      />
      <div className={completed ? "mx-auto w-full max-w-6xl" : undefined}>
        {!ended ? roster : null}
        <SessionPlay
          data={data}
          viewer={viewer}
          setupHref={`/games/${data.session.id}/play/setup`}
          storyHref={`/games/${data.session.id}/story`}
          continuation={continuation}
          showPostGameFeedback={showPostGameFeedback}
        />
        {ended ? roster : null}
      </div>
    </>
  );
}
