import { notFound } from "next/navigation";
import { SessionNav } from "@/components/shared/session-nav";
import { requireUser } from "@/features/auth/session";
import { SessionChatView } from "@/features/chat/session-chat-view";
import { sessionAccentStyle } from "@/features/sessions/accent";
import { getSessionForParticipant } from "@/features/sessions/queries";
import { RealtimeRefresh } from "@/features/sessions/realtime-refresh";
import { ShareButton } from "@/features/sessions/share-button";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const sessionId = (await params).id;
  const data = await getSessionForParticipant(sessionId, user.id);
  if (!data || !data.membership) notFound();
  const isHost = data.session.hostId === user.id || data.membership.role === "cohost";

  return <div className="authenticated-chat-page flex h-full min-h-0 flex-col overflow-hidden" style={sessionAccentStyle(data.session.accentColor)}>
    <header className="mb-5 flex shrink-0 items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-primary">{data.session.title}</p>
        <h1 className="mt-1 app-title">Chat</h1>
        <p className="mt-1 text-sm text-muted">Plans, updates, and photos from the group.</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">{isHost ? <ShareButton url={`/s/${data.session.slug}`} title={data.session.title} /> : null}<RealtimeRefresh sessionId={sessionId} compact /></div>
    </header>
    <div className="shrink-0"><SessionNav id={sessionId} active="Chat" /></div>
    <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 pt-4">
      <div className="min-h-0 w-full overflow-hidden sm:rounded-xl sm:border sm:border-line">
        <SessionChatView sessionId={sessionId} timezone={data.session.timezone} viewer={{ userId: user.id, playerId: data.membership.id, canWrite: true }} className="authenticated-chat-viewport h-full" />
      </div>
    </div>
  </div>;
}
