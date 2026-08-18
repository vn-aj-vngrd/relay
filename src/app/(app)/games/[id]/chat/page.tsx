import { notFound } from "next/navigation";
import { GamePageIntro } from "@/components/shared/game-page-intro";
import { requireUser } from "@/features/auth/session";
import { SessionChatView } from "@/features/chat/session-chat-view";
import { getSessionForParticipant } from "@/features/sessions/queries";
import { RealtimeRefresh } from "@/features/sessions/realtime-refresh";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const sessionId = (await params).id;
  const data = await getSessionForParticipant(sessionId, user.id);
  if (!data || !data.membership) notFound();

  return <div className="authenticated-chat-page flex h-full min-h-0 flex-col overflow-hidden">
    <GamePageIntro title="Chat" description="Plans, updates, and photos from the group." action={<RealtimeRefresh sessionId={sessionId} compact />} />
    <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1">
      <div className="min-h-0 w-full overflow-hidden sm:rounded-xl sm:border sm:border-line">
        <SessionChatView sessionId={sessionId} timezone={data.session.timezone} viewer={{ userId: user.id, playerId: data.membership.id, canWrite: true }} className="authenticated-chat-viewport h-full" />
      </div>
    </div>
  </div>;
}
