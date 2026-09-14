import { notFound } from "next/navigation";

import { GamePageIntro } from "@/components/shared/game-page-intro";
import { requireUser } from "@/features/auth/session";
import { getGamePhotoAllowance } from "@/features/billing/usage";
import { getSessionRecap } from "@/features/memories/queries";
import { SessionMemories } from "@/features/memories/session-memories";
import { storyJoinUrl } from "@/features/memories/story-join-url";
import { getSessionPlayerPrice } from "@/features/sessions/player-price-summary-query";
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
  const [{ recap, memory }, price] = await Promise.all([
    getSessionRecap(data.session.id),
    getSessionPlayerPrice(data.session.id),
  ]);
  if (!price) notFound();
  const canContribute =
    canManageSessionWorkspace(data.access) || data.membership?.rsvp === "going";
  const photoAllowance = canContribute
    ? await getGamePhotoAllowance(data.session.hostId, data.session.id)
    : undefined;
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
      <GamePageIntro title="Story" />
      <div className="mx-auto w-full max-w-6xl">
        <SessionMemories
          photoAllowance={photoAllowance}
          canManageStorage={data.session.hostId === user.id}
          session={data.session}
          price={price}
          joinUrl={storyJoinUrl(data.session)}
          recap={recap}
          memory={memory}
          canContribute={canContribute}
          uploadsDisabled={
            !data.session.participantImagesEnabled &&
            data.session.hostId !== user.id
          }
          viewerPlayerId={data.membership?.id}
          goingCount={goingCount}
          hostName={hostName}
          storyAsOf={storyAsOf}
        />
      </div>
    </>
  );
}
