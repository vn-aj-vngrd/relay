import { Broadcast } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";

import { GamePageIntro } from "@/components/shared/game-page-intro";
import { can, sessionActor } from "@/features/auth/permissions";
import { requireUser } from "@/features/auth/session";
import { getWorkspaceLiveSession } from "@/features/matches/queries";
import { SessionPlay, type SessionPlayViewer } from "@/features/matches/session-play";
import { postGameContinuation } from "@/features/sessions/post-game";

export default async function PlayPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const data = await getWorkspaceLiveSession((await params).id, user.id);
  if (!data) notFound();

  const actor = sessionActor({ userId: user.id, hostId: data.session.hostId, membership: data.membership });
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

  return (
    <>
      <GamePageIntro
        title={completed ? "Recap" : "Play"}
        description={
          completed
            ? "The final scores, pairings, highlights, and standings from this game."
            : "Court assignments, scores, partner rotations, and who plays next."
        }
        action={
          data.session.status === "live" ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-live">
              <Broadcast aria-hidden size={17} />
              Play in progress
            </span>
          ) : undefined
        }
      />
      <div className={completed ? "mx-auto w-full max-w-6xl sm:pt-6" : undefined}>
        <SessionPlay
          data={data}
          viewer={viewer}
          setupHref={`/games/${data.session.id}/play/setup`}
          storyHref={`/games/${data.session.id}/story`}
          continuation={continuation}
        />
      </div>
    </>
  );
}
