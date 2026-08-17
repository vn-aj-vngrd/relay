import { asc, eq, inArray } from "drizzle-orm";
import { ThumbsUp } from "@phosphor-icons/react/dist/ssr";
import { Avatar } from "@/components/shared/avatar-stack";
import { PendingSubmit } from "@/components/ui/pending-submit";
import { db } from "@/db/client";
import { messageReactions, messages, profiles, sessionPlayers } from "@/db/schema";
import { profileAvatarUrl } from "@/features/players/avatar";
import { getServerEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { toggleMessageReaction } from "./actions";
import { ChatComposer } from "./chat-composer";
import { ChatPhotoViewer } from "./chat-photo-viewer";
import { ChatThread } from "./chat-thread";

export async function SessionChatView({ sessionId, timezone, viewer, slug, className = "" }: { sessionId: string; timezone: string; viewer: { userId: string | null; playerId: string; canWrite: boolean }; slug?: string; className?: string }) {
  const maxImageBytes = getServerEnv().CHAT_IMAGE_MAX_BYTES;
  const rows = await db.select({ message: messages, player: sessionPlayers, profile: profiles }).from(messages).leftJoin(sessionPlayers, eq(messages.sessionPlayerId, sessionPlayers.id)).leftJoin(profiles, eq(sessionPlayers.userId, profiles.userId)).where(eq(messages.sessionId, sessionId)).orderBy(asc(messages.createdAt)).limit(200);
  const reactionRows = rows.length ? await db.select().from(messageReactions).where(inArray(messageReactions.messageId, rows.map(({ message }) => message.id))) : [];
  const reactionCounts = new Map<string, number>();
  const ownReactions = new Set<string>();
  for (const reaction of reactionRows) { reactionCounts.set(reaction.messageId, (reactionCounts.get(reaction.messageId) ?? 0) + 1); if (reaction.sessionPlayerId === viewer.playerId) ownReactions.add(reaction.messageId); }
  const supabase = createSupabaseAdminClient();
  const imageUrls = new Map<string, string>();
  await Promise.all(rows.map(async ({ message }) => { if (!message.imagePath) return; const { data } = await supabase.storage.from("chat-images").createSignedUrl(message.imagePath, 3600); if (data?.signedUrl) imageUrls.set(message.id, data.signedUrl); }));
  const time = new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit", timeZone: timezone });
  const day = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", timeZone: timezone });
  const dayKey = (date: Date) => new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: timezone }).format(date);

  return <div className={`flex min-h-0 flex-col overflow-hidden border-t border-line bg-surface sm:px-3 ${className}`}><ChatThread messageCount={rows.length}>{rows.length ? rows.map(({ message, player, profile }, index) => {
    const own = message.sessionPlayerId === viewer.playerId;
    const system = message.kind === "system";
    const previous = rows[index - 1]?.message;
    const next = rows[index + 1]?.message;
    const newDay = !previous || dayKey(previous.createdAt) !== dayKey(message.createdAt);
    const grouped = previous?.sessionPlayerId === message.sessionPlayerId && previous.kind !== "system" && !newDay;
    const groupEnds = next?.sessionPlayerId !== message.sessionPlayerId || next.kind === "system";
    const name = profile?.name ?? player?.guestName ?? "Player";
    const imageUrl = imageUrls.get(message.id);
    const reactions = reactionCounts.get(message.id) ?? 0;
    return <div key={message.id}>{newDay ? <div className="my-5 flex items-center gap-3 text-xs font-medium text-muted"><span className="h-px flex-1 bg-line" /><time dateTime={message.createdAt.toISOString()}>{day.format(message.createdAt)}</time><span className="h-px flex-1 bg-line" /></div> : null}{system ? <div className="mx-auto my-4 max-w-lg text-center text-xs leading-5 text-muted">{message.body}</div> : <article className={`message-row flex ${own ? "justify-end" : "justify-start"} ${grouped ? "mt-1" : "mt-4"}`}><div className={`flex max-w-[88%] items-end gap-2 sm:max-w-[78%] ${own ? "flex-row-reverse" : ""}`}>{!own ? groupEnds ? <Avatar name={name} imageUrl={profileAvatarUrl(profile?.avatarPath)} index={index} size="sm" /> : <span className="w-8 shrink-0" /> : null}<div>{!grouped && !own ? <p className="mb-1 px-1 text-xs font-semibold text-muted">{name}</p> : null}<div className={`relative overflow-hidden rounded-2xl ${own ? "rounded-br-md bg-primary text-white" : "rounded-bl-md bg-surface-strong text-ink"}`}>{imageUrl ? <ChatPhotoViewer src={imageUrl} alt={message.body ? `Photo: ${message.body}` : `Photo from ${name}`} sender={name} /> : null}{message.body ? <p className="break-words px-3.5 py-2.5 text-[15px] leading-6">{message.body}</p> : null}</div><div className={`mt-1 flex min-h-7 items-center gap-1.5 ${own ? "justify-end" : "justify-start"}`}><time className="px-1 text-[11px] text-muted">{time.format(message.createdAt)}</time>{viewer.canWrite ? <form action={toggleMessageReaction}><input type="hidden" name="messageId" value={message.id} />{slug ? <input type="hidden" name="slug" value={slug} /> : null}<PendingSubmit pendingLabel="…" aria-label={ownReactions.has(message.id) ? "Remove like" : "Like message"} className={`inline-flex min-h-7 items-center gap-1 rounded-md px-1.5 text-xs ${ownReactions.has(message.id) ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-strong"}`}><ThumbsUp aria-hidden size={13} weight={ownReactions.has(message.id) ? "fill" : "regular"} />{reactions || null}</PendingSubmit></form> : reactions ? <span className="inline-flex items-center gap-1 px-1.5 text-xs text-muted"><ThumbsUp aria-hidden size={13} />{reactions}</span> : null}</div></div></div></article>}</div>;
  }) : <div className="py-16 text-center"><h2 className="font-bold">Start the conversation</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">Share arrival plans, parking tips, payment reminders, or anything the group needs before game time.</p></div>}</ChatThread>{viewer.canWrite ? <ChatComposer sessionId={sessionId} slug={slug} maxImageBytes={maxImageBytes} /> : null}</div>;
}
