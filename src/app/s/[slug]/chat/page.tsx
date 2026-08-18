import Link from "next/link";
import { notFound } from "next/navigation";
import { SessionChatView } from "@/features/chat/session-chat-view";
import { sessionAccentStyle } from "@/features/sessions/accent";
import { getPublicSession } from "@/features/sessions/queries";
import { RealtimeRefresh } from "@/features/sessions/realtime-refresh";
import { canParticipate, getSessionViewer } from "@/features/sessions/viewer";

export default async function PublicChatPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const data = await getPublicSession(slug);
  if (!data) notFound();
  const viewer = await getSessionViewer(data.session.id, slug);
  const canWrite = Boolean(viewer && canParticipate(viewer.player.rsvp));
  return <main id="main-content" className="public-session-page public-chat-page min-h-0 overflow-hidden bg-surface py-2 sm:py-4" style={sessionAccentStyle(data.session.accentColor)}><div className="public-session-panel public-chat-panel mx-auto flex h-full min-h-0 max-w-4xl flex-col overflow-hidden bg-surface px-4 pt-6 sm:rounded-xl sm:border sm:border-line sm:px-8"><div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-semibold text-primary">{data.session.title}</p><h1 className="mt-1 app-title">Chat</h1><p className="mt-2 text-sm text-muted">The session conversation for players and guests.</p></div><RealtimeRefresh sessionId={data.session.id} compact /></div>{!canWrite ? <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-y border-line py-4"><p className="text-sm text-muted">Join the game first to send messages and photos.</p><Link href={`/s/${slug}`} className="inline-flex min-h-11 items-center font-semibold text-primary">Join on the plan</Link></div> : null}<div className="mt-5 min-h-0 flex-1"><SessionChatView sessionId={data.session.id} timezone={data.session.timezone} slug={slug} viewer={{ userId: viewer?.user?.id ?? null, playerId: viewer?.player.id ?? "", canWrite }} className="h-full" /></div></div></main>;
}
