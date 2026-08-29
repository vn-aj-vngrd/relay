import { notFound } from "next/navigation";

import { SessionChatView } from "@/features/chat/session-chat-view";
import { sessionAccentStyle } from "@/features/sessions/accent";
import { getPublicSession } from "@/features/sessions/queries";
import { canParticipate, getSessionViewer } from "@/features/sessions/viewer";

export default async function PublicChatPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const data = await getPublicSession(slug);
  if (!data) notFound();
  const viewer = await getSessionViewer(data.session.id, slug);
  const canWrite = Boolean(viewer && canParticipate(viewer.player.rsvp));
  return (
    <main
      id="main-content"
      className="public-session-page public-chat-page min-h-0 overflow-hidden bg-surface"
      style={sessionAccentStyle(data.session.accentColor)}
    >
      <div className="public-chat-panel mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col bg-surface px-4 py-4 sm:px-6 sm:py-8">
        <div className="min-w-0">
          <h1 className="public-tab-title app-title">Chat</h1>
          <p className="public-tab-description mt-2 text-sm text-muted">
            The session conversation for players and guests.
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden sm:mt-5 sm:rounded-xl sm:border sm:border-line">
          <SessionChatView
            sessionId={data.session.id}
            timezone={data.session.timezone}
            slug={slug}
            viewer={{ userId: viewer?.user?.id ?? null, playerId: viewer?.player.id ?? "", canWrite }}
            readOnlyMessage="Join the game to send messages and photos."
            className="h-full border-t-0"
          />
        </div>
      </div>
    </main>
  );
}
