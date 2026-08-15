import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Send } from "lucide-react";
import { Avatar } from "@/components/shared/avatar-stack";
import { SessionNav } from "@/components/shared/session-nav";
import { Button } from "@/components/ui/button";
import { db } from "@/db/client";
import { messages, profiles } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { sendMessage } from "@/features/chat/actions";
import { getSessionForUser } from "@/features/sessions/queries";
import { RealtimeRefresh } from "@/features/sessions/realtime-refresh";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(); const sessionId = (await params).id;
  const data = await getSessionForUser(sessionId, user.id); if (!data) notFound();
  const items = await db.select({ message: messages, profile: profiles }).from(messages).leftJoin(profiles, eq(messages.authorId, profiles.userId)).where(eq(messages.sessionId, sessionId)).orderBy(asc(messages.createdAt)).limit(200);
  return <div><div className="mb-5"><p className="text-sm font-semibold text-primary">{data.session.title}</p><div className="flex items-end justify-between gap-3"><h1 className="mt-1 text-[28px] font-bold tracking-[-0.035em]">Chat</h1><RealtimeRefresh sessionId={sessionId} /></div></div><SessionNav id={sessionId} active="Chat" /><div className="mx-auto max-w-2xl py-7"><div className="min-h-[320px] space-y-5">{items.length ? items.map(({ message, profile }, index) => <article key={message.id} className="flex gap-3"><Avatar name={profile?.name ?? "Relay"} index={index} size="sm" /><div><div className="flex items-baseline gap-2"><h2 className="text-sm font-semibold">{profile?.name ?? "Relay"}</h2><time className="score text-xs text-muted">{new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit", timeZone: data.session.timezone }).format(message.createdAt)}</time></div><p className="mt-1 text-pretty leading-6">{message.body}</p></div></article>) : <div className="border-y border-line py-10"><h2 className="font-bold">Start the conversation</h2><p className="mt-2 text-sm text-muted">Share arrival plans, parking tips, or anything the group needs to know.</p></div>}</div><form action={sendMessage} className="sticky bottom-20 mt-7 flex gap-2 border-t border-line bg-canvas py-3 md:bottom-0"><input type="hidden" name="sessionId" value={sessionId} /><label htmlFor="message" className="sr-only">Message</label><input id="message" name="body" required maxLength={1000} placeholder="Message the group" className="h-12 min-w-0 flex-1 rounded-[10px] border border-line bg-canvas px-3.5 placeholder:text-muted" /><Button aria-label="Send message"><Send size={17} /></Button></form></div></div>;
}
