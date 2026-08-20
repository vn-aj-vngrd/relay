import { notFound } from "next/navigation";

import { getCurrentUser } from "@/features/auth/session";
import { getSessionRecap } from "@/features/memories/queries";
import { SessionMemories } from "@/features/memories/session-memories";
import { sessionAccentStyle } from "@/features/sessions/accent";
import { getPublicSession } from "@/features/sessions/queries";

export default async function PublicStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const [data, user] = await Promise.all([getPublicSession(slug), getCurrentUser()]);
  if (!data) notFound();
  const { recap, memory } = await getSessionRecap(data.session.id);
  const viewerPlayer = user ? data.roster.find(({ player }) => player.userId === user.id)?.player : null;
  const canContribute = Boolean(user && (data.session.hostId === user.id || viewerPlayer?.rsvp === "going"));
  const description =
    data.session.status === "completed"
      ? "View the final scores and photos from the game."
      : "Scores and game photos appear after the host ends the session.";

  return (
    <main
      id="main-content"
      className="public-session-page min-h-screen bg-surface"
      style={sessionAccentStyle(data.session.accentColor)}
    >
      <div className="public-session-panel public-session-content mx-auto max-w-6xl bg-surface px-4 py-8 sm:mt-8 sm:rounded-xl sm:border sm:border-line sm:px-8">
        <p className="text-sm font-semibold text-primary">{data.session.title}</p>
        <h1 className="mt-1 app-title">Story</h1>
        <p className="mt-2 text-sm text-muted">{description}</p>
        <div className="mt-7">
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
