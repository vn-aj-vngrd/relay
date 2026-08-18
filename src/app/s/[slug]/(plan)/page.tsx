import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaretRight, Heart, UploadSimple } from "@phosphor-icons/react/dist/ssr";
import { Avatar, AvatarStack } from "@/components/shared/avatar-stack";
import { GamePageIntro } from "@/components/shared/game-page-intro";
import { ButtonLink } from "@/components/ui/button";
import { PendingSubmit } from "@/components/ui/pending-submit";
import { getCurrentUser } from "@/features/auth/session";
import { profileAvatarUrl } from "@/features/players/avatar";
import { addMemoryComment, toggleMemoryReaction, uploadMemoryPhoto } from "@/features/memories/actions";
import { getSessionMemory } from "@/features/memories/queries";
import { sessionAccentStyle } from "@/features/sessions/accent";
import { formatSessionDateLong, formatSessionTime, spotsRemainingLabel } from "@/features/sessions/format";
import { getSessionOverview } from "@/features/sessions/overview";
import { getPublicSession } from "@/features/sessions/queries";
import { RsvpControl } from "@/features/sessions/rsvp-control";
import { SessionAtAGlance } from "@/features/sessions/session-overview";
import { SessionHero, SessionPlanDetails } from "@/features/sessions/session-summary";
import { canParticipate, getSessionViewer } from "@/features/sessions/viewer";

function RosterPreview({ id, slug, names, imageUrls, roles, capacity, waitlistCount, className = "" }: { id: string; slug: string; names: string[]; imageUrls: Array<string | undefined>; roles: string[]; capacity: number; waitlistCount: number; className?: string }) {
  const spots = Math.max(0, capacity - names.length);
  return <section aria-labelledby={id} className={className}><div className="mb-3 flex items-end justify-between gap-3"><div><h2 id={id} className="text-lg font-bold">Who’s playing</h2><p className="mt-1 text-sm text-muted">{names.length} of {capacity} going · <strong className="text-primary">{spots ? spotsRemainingLabel(spots) : `${waitlistCount} waitlisted`}</strong></p></div><AvatarStack names={names.slice(0, 3)} imageUrls={imageUrls.slice(0, 3)} total={names.length} /></div>{names.length ? <ul className="divide-y divide-line border-y border-line">{names.slice(0, 5).map((name, index) => <li key={`${name}-${index}`} className="flex min-h-14 items-center gap-3 py-2"><Avatar name={name} imageUrl={imageUrls[index]} index={index} size="sm" /><span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span><span className="text-xs text-muted">{roles[index] === "host" ? "Host" : "Going"}</span></li>)}</ul> : <p className="border-y border-line py-6 text-sm text-muted">Be the first to join.</p>}<ButtonLink href={`/s/${slug}/players`} variant="quiet" className="mt-2 w-full">View all players <CaretRight aria-hidden size={14} /></ButtonLink></section>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const data = await getPublicSession((await params).slug);
  if (!data) return { title: "Game not found" };
  const going = data.roster.filter(({ player }) => player.rsvp === "going").length;
  return { title: data.session.title, description: `${formatSessionDateLong(data.session.startsAt)}, ${formatSessionTime(data.session.startsAt, data.session.endsAt)} at ${data.session.venueName}. ${going} of ${data.session.capacity} players.`, openGraph: { title: data.session.title, description: `${formatSessionDateLong(data.session.startsAt)} · ${data.session.venueName} · ${spotsRemainingLabel(Math.max(0, data.session.capacity - going))}`, type: "website" } };
}

export default async function PublicSessionPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const [data, user] = await Promise.all([getPublicSession(slug), getCurrentUser()]);
  if (!data) notFound();
  const viewer = await getSessionViewer(data.session.id, slug);
  const { session, roster, hostProfile, matchCount } = data;
  const going = roster.filter(({ player }) => player.rsvp === "going");
  const waitlisted = roster.filter(({ player }) => player.rsvp === "waitlisted");
  const names = going.map(({ player, profile }) => profile?.name ?? player.guestName ?? "Guest");
  const playerAvatarUrls = going.map(({ profile }) => profileAvatarUrl(profile?.avatarPath));
  const playerRoles = going.map(({ player }) => player.role);
  const spots = Math.max(0, session.capacity - going.length);
  const memory = session.status === "completed" ? await getSessionMemory(session.id) : null;
  const canContribute = Boolean(user && (user.id === session.hostId || going.some(({ player }) => player.userId === user.id)));
  const accountName = typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : user?.email?.split("@")[0];
  const guestName = viewer?.isGuest ? viewer.player.guestName : null;
  const currentRsvp = viewer?.player.rsvp;
  const canManage = Boolean(user && (user.id === session.hostId || viewer?.player.role === "cohost"));
  const overview = await getSessionOverview(session.id, viewer && canParticipate(viewer.player.rsvp) ? { sessionPlayerId: viewer.player.id, canManage } : undefined);
  const availabilityLabel = session.rosterLocked ? "Roster closed" : spots ? spotsRemainingLabel(spots) : "Waitlist open";
  const joinTitle = session.rosterLocked ? "Roster closed" : currentRsvp ? "Your response" : "Join this game";
  const joinHelp = session.rosterLocked ? "The host has paused new responses" : currentRsvp ? "Review or update your response" : user ? "Use your Relay account to RSVP" : "No account needed";
  return <main id="main-content" className="public-session-page min-h-screen bg-surface" style={sessionAccentStyle(session.accentColor)}>
    <div className="mx-auto w-full max-w-4xl pb-12 pt-8 sm:px-6">
      <div className="px-4 sm:px-0"><p className="text-sm font-semibold text-primary">{session.title}</p><GamePageIntro title="Overview" description="The plan, roster, availability, and what you need before the game." action={session.status !== "completed" ? <ButtonLink href="#public-rsvp-title" className="lg:hidden">{currentRsvp ? "Update response" : "Join game"}</ButtonLink> : undefined} /></div>
      <div className={`grid gap-6 ${session.status === "completed" ? "" : "lg:grid-cols-[1fr_350px]"}`}><article className="public-session-panel min-w-0 bg-surface sm:rounded-xl sm:border sm:border-line"><SessionHero session={session} hostLabel={`Hosted by ${hostProfile?.name ?? "the host"}`} headingLevel="h2" />
      <div className="public-session-content px-5 py-6 sm:px-8 sm:py-8"><SessionPlanDetails session={session} /><SessionAtAGlance overview={overview} hrefBase={`/s/${session.slug}`} status={session.status} goingCount={going.length} capacity={session.capacity} waitlistCount={waitlisted.length} />
        {session.status !== "completed" ? <section aria-labelledby="public-rsvp-title" className="public-session-section border-b border-line lg:hidden"><div className="mb-5 flex items-start justify-between gap-4"><div><h2 id="public-rsvp-title" className="text-lg font-bold">{joinTitle}</h2><p className="mt-1 text-sm text-muted">{joinHelp}</p></div><strong className="score shrink-0 text-sm font-bold text-primary">{availabilityLabel}</strong></div><RsvpControl sessionId={session.id} slug={session.slug} signedIn={Boolean(user)} accountName={accountName} guestName={guestName} currentRsvp={currentRsvp} locked={session.rosterLocked} instance="mobile" /></section> : null}
        <RosterPreview id="mobile-roster-title" slug={session.slug} names={names} imageUrls={playerAvatarUrls} roles={playerRoles} capacity={session.capacity} waitlistCount={waitlisted.length} className={`public-session-section border-b border-line ${session.status === "completed" ? "" : "lg:hidden"}`} />
        {session.notes ? <section aria-labelledby="notes-title" className="public-session-notes"><h2 id="notes-title" className="text-lg font-bold">A note from {hostProfile?.name?.split(" ")[0] ?? "the host"}</h2><p className="mt-3 max-w-2xl text-pretty leading-7 text-muted">{session.notes}</p></section> : null}{session.status === "completed" ? <section className="mt-7 border-t border-line pt-7"><p className="score text-sm font-bold text-primary">SESSION COMPLETE</p><h2 className="mt-2 text-xl font-bold">{`${matchCount} ${matchCount === 1 ? "match" : "matches"} played`}</h2><p className="mt-2 text-sm text-muted">This session is now part of the group’s history.</p>{user?.id === session.hostId ? <div className="mt-5 flex flex-wrap gap-2"><Link href={`/games/new?from=${session.id}`} className="inline-flex min-h-9 items-center rounded-lg bg-primary px-3 text-[13px] font-semibold text-white">Play again</Link>{!session.groupId ? <Link href={`/groups/new?from=${session.id}`} className="inline-flex min-h-9 items-center rounded-lg border border-line bg-surface px-3 text-[13px] font-semibold text-ink hover:bg-surface-strong">Save crew as a group</Link> : null}</div> : null}<div className="mt-8"><h3 className="text-lg font-bold">Photos</h3>{memory?.media.length ? <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{memory.media.map((item) => item.url ? <figure key={item.id}><Image src={item.url} alt={item.altText ?? "Session photo"} width={500} height={500} className="aspect-square w-full rounded-[10px] object-cover" />{item.caption ? <figcaption className="mt-1 text-xs text-muted">{item.caption}</figcaption> : null}</figure> : null)}</div> : <p className="mt-2 text-sm text-muted">No photos yet. Add the first memory from the night.</p>}{canContribute ? <form action={uploadMemoryPhoto} className="mt-4 space-y-3 rounded-lg bg-surface p-4"><input type="hidden" name="sessionId" value={session.id} /><label className="block text-sm font-semibold" htmlFor="photo">Add a photo</label><input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" required className="block w-full text-sm" /><input name="caption" maxLength={240} autoComplete="off" placeholder="Optional caption…" className="h-11 w-full rounded-[10px] border border-line bg-canvas px-3 placeholder:text-muted" /><PendingSubmit pendingLabel="Uploading…" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-semibold text-white"><UploadSimple size={16} />Upload photo</PendingSubmit></form> : null}</div><div className="mt-8 border-t border-line pt-6"><div className="flex items-center justify-between"><h3 className="text-lg font-bold">From the group</h3>{canContribute ? <form action={toggleMemoryReaction}><input type="hidden" name="sessionId" value={session.id} /><PendingSubmit pendingLabel="Saving…" aria-label="React to this session" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold text-primary hover:bg-primary-soft"><Heart size={18} />{memory?.reactionCount ?? 0}</PendingSubmit></form> : <span className="inline-flex items-center gap-1 text-sm text-muted"><Heart size={16} />{memory?.reactionCount ?? 0}</span>}</div>{memory?.comments.length ? <ul className="mt-4 space-y-4">{memory.comments.map(({ comment, profile }) => <li key={comment.id}><p className="text-sm font-semibold">{profile?.name ?? "Player"}</p><p className="mt-1 break-words text-sm text-muted">{comment.body}</p></li>)}</ul> : null}{canContribute ? <form action={addMemoryComment} className="mt-4 flex gap-2"><input type="hidden" name="sessionId" value={session.id} /><label className="sr-only" htmlFor="memory-comment">Comment</label><input id="memory-comment" name="body" required maxLength={500} autoComplete="off" placeholder="Add a comment…" className="h-11 min-w-0 flex-1 rounded-[10px] border border-line bg-canvas px-3 placeholder:text-muted" /><PendingSubmit pendingLabel="Posting…" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] font-semibold">Post</PendingSubmit></form> : null}</div></section> : null}</div></article>
      {session.status !== "completed" ? <aside className="hidden space-y-7 self-start lg:sticky lg:top-6 lg:block"><section className="public-session-panel bg-surface p-5 sm:rounded-xl sm:border sm:border-line"><div className="mb-5 border-b border-line pb-5"><div className="flex items-start justify-between gap-3"><h2 className="text-lg font-bold">{joinTitle}</h2><strong className="score shrink-0 text-sm font-bold text-primary">{availabilityLabel}</strong></div><p className="mt-1 text-sm text-muted">{joinHelp}</p></div><RsvpControl sessionId={session.id} slug={session.slug} signedIn={Boolean(user)} accountName={accountName} guestName={guestName} currentRsvp={currentRsvp} locked={session.rosterLocked} instance="desktop" /></section><RosterPreview id="desktop-roster-title" slug={session.slug} names={names} imageUrls={playerAvatarUrls} roles={playerRoles} capacity={session.capacity} waitlistCount={waitlisted.length} /></aside> : null}
      </div>
    </div></main>;
}
