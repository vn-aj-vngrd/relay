import { notFound } from "next/navigation";
import { SessionNav } from "@/components/shared/session-nav";
import { requireUser } from "@/features/auth/session";
import { SessionChatView } from "@/features/chat/session-chat-view";
import { sessionAccentStyle } from "@/features/sessions/accent";
import { getSessionForParticipant } from "@/features/sessions/queries";
import { RealtimeRefresh } from "@/features/sessions/realtime-refresh";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const sessionId = (await params).id;
  const data = await getSessionForParticipant(sessionId, user.id);
  if (!data || !data.membership) notFound();
  return <div style={sessionAccentStyle(data.session.accentColor)}><div className="mb-5 flex items-end justify-between gap-3"><div><p className="text-sm font-semibold text-primary">{data.session.title}</p><h1 className="mt-1 app-title">Chat</h1><p className="mt-2 text-sm text-muted">The session conversation for players and guests.</p></div><RealtimeRefresh sessionId={sessionId} compact /></div><SessionNav id={sessionId} active="Chat" /><div className="mx-auto max-w-3xl pt-4"><SessionChatView sessionId={sessionId} timezone={data.session.timezone} viewer={{ userId: user.id, playerId: data.membership.id, canWrite: true }} className="authenticated-chat-viewport" /></div></div>;
}
