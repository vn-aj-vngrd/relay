import { notFound } from "next/navigation";

import { getCurrentUser } from "@/features/auth/session";
import { getSessionRecap } from "@/features/memories/queries";
import { SessionMemories } from "@/features/memories/session-memories";
import { sessionAccentStyle } from "@/features/sessions/accent";
import { getPublicSession } from "@/features/sessions/queries";
import { getSessionViewer } from "@/features/sessions/viewer";

export default async function PublicStoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const data = await getPublicSession(slug);
  if (!data) notFound();
  const [{ recap, memory }, viewer, user] = await Promise.all([
    getSessionRecap(data.session.id),
    getSessionViewer(data.session.id, data.session.slug),
    getCurrentUser(),
  ]);
  const viewerPlayer = viewer?.player;
  const canContribute = Boolean(
    (user && data.session.hostId === user.id) ||
      viewerPlayer?.role === "host" ||
      viewerPlayer?.role === "cohost" ||
      viewerPlayer?.rsvp === "going"
  );
  const description =
    data.session.status === "completed"
      ? "Make a shareable story or revisit photos from the game."
      : data.session.status === "live"
        ? "Share a safe live update while play continues."
        : data.session.status === "cancelled"
          ? "This game ended before a story could be made."
          : "Share the invitation before everyone reaches the court.";
  const goingCount = data.roster.filter(
    ({ player }) => player.rsvp === "going"
  ).length;
  const hostName = data.hostProfile?.name ?? "The host";
  const storyAsOf = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: data.session.timezone,
  }).format(new Date());

  return (
    <main
      id="main-content"
      className="public-session-page min-h-screen bg-surface"
      style={sessionAccentStyle(data.session.accentColor)}
    >
      <div className="public-session-content mx-auto w-full max-w-6xl bg-surface px-4 pb-8 pt-4 sm:px-6 sm:py-8">
        <h1 className="public-tab-title app-title">Story</h1>
        <p className="public-tab-description mt-2 text-sm text-muted">
          {description}
        </p>
        <div className="mt-4">
          <SessionMemories
            session={data.session}
            recap={recap}
            memory={memory}
            canContribute={canContribute}
            viewerPlayerId={viewerPlayer?.id}
            goingCount={goingCount}
            hostName={hostName}
            storyAsOf={storyAsOf}
          />
        </div>
      </div>
    </main>
  );
}
