import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicSessionHeader } from "@/components/shared/public-session-header";
import { getCurrentUser } from "@/features/auth/session";
import { SessionChatView } from "@/features/chat/session-chat-view";
import { sessionAccentStyle } from "@/features/sessions/accent";
import { getPublicSession } from "@/features/sessions/queries";
import { RealtimeRefresh } from "@/features/sessions/realtime-refresh";
import { canParticipate, getSessionViewer } from "@/features/sessions/viewer";

export default async function PublicChatPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const data = await getPublicSession(slug);
  if (!data) notFound();
  const [user, viewer] = await Promise.all([getCurrentUser(), getSessionViewer(data.session.id, slug)]);
  const canWrite = Boolean(viewer && canParticipate(viewer.player.rsvp));
  return <main id="main-content" className="min-h-screen bg-canvas" style={sessionAccentStyle(data.session.accentColor)}><PublicSessionHeader slug={slug} active="Chat" signedIn={Boolean(user)} /><div className="mx-auto max-w-3xl bg-surface px-4 py-8 sm:mt-8 sm:rounded-xl sm:border sm:border-line sm:px-8"><div className="flex items-end justify-between gap-3"><div><p className="text-sm font-semibold text-primary">{data.session.title}</p><h1 className="mt-1 app-title">Chat</h1><p className="mt-2 text-sm text-muted">The session conversation for players and guests.</p></div><RealtimeRefresh sessionId={data.session.id} compact /></div>{!canWrite ? <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-y border-line py-4"><p className="text-sm text-muted">Join the game first to send messages and photos.</p><Link href={`/s/${slug}`} className="inline-flex min-h-10 items-center font-semibold text-primary">Join on the plan</Link></div> : null}<div className="mt-5"><SessionChatView sessionId={data.session.id} timezone={data.session.timezone} slug={slug} viewer={{ userId: viewer?.user?.id ?? null, playerId: viewer?.player.id ?? "", canWrite }} /></div></div></main>;
}
