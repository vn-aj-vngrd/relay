import { notFound } from "next/navigation";

import { GamePageIntro } from "@/components/shared/game-page-intro";
import { requireUser } from "@/features/auth/session";
import { getSessionRecap } from "@/features/memories/queries";
import { SessionMemories } from "@/features/memories/session-memories";
import { getSessionForWorkspace } from "@/features/sessions/queries";
import { canManageSessionWorkspace } from "@/features/sessions/session-access";

export default async function GameStoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const data = await getSessionForWorkspace((await params).id, user.id);
  if (!data) notFound();
  const { recap, memory } = await getSessionRecap(data.session.id);
  const canContribute =
    canManageSessionWorkspace(data.access) || data.membership?.rsvp === "going";
  const description =
    data.session.status === "completed"
      ? "Make a shareable story or revisit photos from the game."
      : data.session.status === "live"
        ? "Share a safe live update while play continues."
        : data.session.status === "cancelled"
          ? "This game ended before a story could be made."
          : data.session.status === "draft"
            ? "Publish the game before sharing its invitation."
            : "Share the invitation before everyone reaches the court.";
  const goingCount = data.roster.filter(
    ({ player }) => player.rsvp === "going"
  ).length;
  const host = data.roster.find(({ player }) => player.role === "host");
  const hostName = host?.profile?.name ?? host?.player.guestName ?? "The host";
  const storyAsOf = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: data.session.timezone,
  }).format(new Date());

  return (
    <>
      <GamePageIntro title="Story" description={description} />
      <div className="mx-auto w-full max-w-6xl">
        <SessionMemories
          session={data.session}
          recap={recap}
          memory={memory}
          canContribute={canContribute}
          viewerPlayerId={data.membership?.id}
          goingCount={goingCount}
          hostName={hostName}
          storyAsOf={storyAsOf}
        />
      </div>
    </>
  );
}
