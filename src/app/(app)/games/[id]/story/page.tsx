import { notFound } from "next/navigation";

import { GamePageIntro } from "@/components/shared/game-page-intro";
import { requireUser } from "@/features/auth/session";
import { getSessionRecap } from "@/features/memories/queries";
import { SessionMemories } from "@/features/memories/session-memories";
import { getSessionForParticipant } from "@/features/sessions/queries";

export default async function GameStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const data = await getSessionForParticipant((await params).id, user.id);
  if (!data || !["published", "live", "completed"].includes(data.session.status)) notFound();
  const { recap, memory } = await getSessionRecap(data.session.id);
  const canContribute = data.session.hostId === user.id || data.membership?.rsvp === "going";
  const description =
    data.session.status === "completed"
      ? "Make a shareable recap and add photos from the game."
      : "Scores and game photos appear after the host ends the session.";

  return (
    <>
      <GamePageIntro title="Story" description={description} />
      <div className="mx-auto w-full max-w-6xl pt-6">
        <SessionMemories
          session={data.session}
          recap={recap}
          memory={memory}
          canContribute={canContribute}
          viewerPlayerId={data.membership?.id}
        />
      </div>
    </>
  );
}
