import { notFound } from "next/navigation";

import { getCurrentUser } from "@/features/auth/session";
import { getSessionRecap } from "@/features/memories/queries";
import { SessionMemories } from "@/features/memories/session-memories";
import { sessionAccentStyle } from "@/features/sessions/accent";
import { getPublicSession } from "@/features/sessions/queries";

export default async function PublicStoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const [data, user] = await Promise.all([
    getPublicSession(slug),
    getCurrentUser(),
  ]);
  if (!data) notFound();
  const { recap, memory } = await getSessionRecap(data.session.id);
  const viewerPlayer = user
    ? data.roster.find(({ player }) => player.userId === user.id)?.player
    : null;
  const canContribute = Boolean(
    user && (data.session.hostId === user.id || viewerPlayer?.rsvp === "going")
  );
  const description =
    data.session.status === "completed"
      ? "View the final scores and photos from the game."
      : data.session.status === "live"
        ? "The final Story will appear after the host ends the game."
        : "Scores and photos will appear here after the game is played.";

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
        <div className="sm:mt-7">
          <SessionMemories
            session={data.session}
            recap={recap}
            memory={memory}
            canContribute={canContribute}
            viewerPlayerId={viewerPlayer?.id}
          />
        </div>
      </div>
    </main>
  );
}
