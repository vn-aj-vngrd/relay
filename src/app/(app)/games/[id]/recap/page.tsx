import { notFound } from "next/navigation";

import { GamePageIntro } from "@/components/shared/game-page-intro";
import { requireUser } from "@/features/auth/session";
import { getSessionRecap } from "@/features/memories/queries";
import { SessionRecap } from "@/features/memories/session-recap";
import { getSessionForParticipant } from "@/features/sessions/queries";

export default async function GameRecapPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const data = await getSessionForParticipant((await params).id, user.id);
  if (!data || !["published", "live", "completed"].includes(data.session.status)) notFound();
  const { recap, memory } = await getSessionRecap(data.session.id);
  const canContribute = data.session.hostId === user.id || data.membership?.rsvp === "going";

  const description =
    data.session.status === "completed"
      ? "The final scores, pairings, photos, and moments your crew made together."
      : data.session.status === "live"
        ? "The story is building as completed matches come in."
        : "A preview of the story this game will leave behind.";

  return (
    <>
      <GamePageIntro title="Recap" description={description} />
      <div className="mx-auto w-full max-w-6xl pt-6">
        <SessionRecap
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
