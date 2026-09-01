import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Avatar, AvatarStack } from "@/components/shared/avatar-stack";
import { GamePageIntro } from "@/components/shared/game-page-intro";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentUser } from "@/features/auth/session";
import { profileAvatarUrl } from "@/features/players/avatar";
import { sessionAccentStyle } from "@/features/sessions/accent";
import { formatSessionDateLong, formatSessionTime, spotsRemainingLabel } from "@/features/sessions/format";
import { getSessionOverview } from "@/features/sessions/overview";
import { getPublicSession } from "@/features/sessions/queries";
import { RsvpControl } from "@/features/sessions/rsvp-control";
import { SessionAtAGlance } from "@/features/sessions/session-overview";
import { SessionHero, SessionPlanDetails } from "@/features/sessions/session-summary";
import { canParticipate, getSessionViewer } from "@/features/sessions/viewer";
import { getPublicEnv } from "@/lib/env";

function RosterPreview({
  id,
  slug,
  names,
  imageUrls,
  roles,
  capacity,
  waitlistCount,
  className = "",
}: {
  id: string;
  slug: string;
  names: string[];
  imageUrls: Array<string | undefined>;
  roles: string[];
  capacity: number;
  waitlistCount: number;
  className?: string;
}) {
  const spots = Math.max(0, capacity - names.length);
  return (
    <section aria-labelledby={id} className={className}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 id={id} className="text-lg font-bold">
            Who’s playing
          </h2>
          <p className="mt-1 text-sm text-muted">
            {names.length} of {capacity} going ·{" "}
            <strong className="text-primary">
              {spots ? spotsRemainingLabel(spots) : waitlistCount ? `${waitlistCount} waitlisted` : "Waitlist open"}
            </strong>
          </p>
        </div>
        <AvatarStack names={names.slice(0, 3)} imageUrls={imageUrls.slice(0, 3)} total={names.length} />
      </div>
      {names.length ? (
        <ul className="divide-y divide-line border-y border-line">
          {names.slice(0, 5).map((name, index) => (
            <li key={`${name}-${index}`} className="flex min-h-14 items-center gap-3 py-2">
              <Avatar name={name} imageUrl={imageUrls[index]} index={index} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
              <span className="text-xs text-muted">{roles[index] === "host" ? "Host" : "Going"}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-y border-line py-6 text-sm text-muted">Be the first to join.</p>
      )}
      <ButtonLink href={`/s/${slug}/players`} variant="quiet" className="mt-2 w-full">
        View all players <CaretRight aria-hidden size={14} />
      </ButtonLink>
    </section>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const data = await getPublicSession((await params).slug);
  if (!data) return { title: "Game not found" };
  const going = data.roster.filter(({ player }) => player.rsvp === "going").length;
  const spots = Math.max(0, data.session.capacity - going);
  const availability =
    data.session.status === "completed"
      ? `${data.matchCount} ${data.matchCount === 1 ? "match" : "matches"} played`
      : spots
        ? spotsRemainingLabel(spots)
        : "Waitlist open";
  const description = `${formatSessionDateLong(data.session.startsAt)}, ${formatSessionTime(data.session.startsAt, data.session.endsAt)} at ${data.session.venueName}. ${going} of ${data.session.capacity} going · ${availability}.`;
  return {
    title: data.session.title,
    description,
    alternates: { canonical: `/s/${data.session.slug}` },
    robots: { index: data.session.visibility === "public", follow: true },
    openGraph: {
      title: data.session.title,
      description: `${formatSessionDateLong(data.session.startsAt)} · ${data.session.venueName} · ${availability}`,
      type: "website",
      url: `/s/${data.session.slug}`,
      siteName: "Relay",
      images: [
        {
          url: `/s/${data.session.slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${data.session.title} pickleball game invitation`,
        },
      ],
      locale: "en_PH",
    },
    twitter: {
      card: "summary_large_image",
      title: data.session.title,
      description,
      images: [`/s/${data.session.slug}/opengraph-image`],
    },
  };
}

export default async function PublicSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ source?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const discoverySource = query.source === "open-games" || query.source === "search" ? query.source : undefined;
  const [data, user] = await Promise.all([getPublicSession(slug), getCurrentUser()]);
  if (!data) notFound();
  const viewer = await getSessionViewer(data.session.id, slug);
  const { session, roster, hostProfile } = data;
  const going = roster.filter(({ player }) => player.rsvp === "going");
  const waitlisted = roster.filter(({ player }) => player.rsvp === "waitlisted");
  const names = going.map(({ player, profile }) => profile?.name ?? player.guestName ?? "Guest");
  const playerAvatarUrls = going.map(({ profile }) => profileAvatarUrl(profile?.avatarPath));
  const playerRoles = going.map(({ player }) => player.role);
  const spots = Math.max(0, session.capacity - going.length);
  const accountName =
    typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : user?.email?.split("@")[0];
  const guestName = viewer?.isGuest ? viewer.player.guestName : null;
  const currentRsvp = viewer?.player.rsvp;
  const currentSkillLevel =
    viewer?.player.skillLevel ?? data.roster.find(({ player }) => player.userId === user?.id)?.profile?.skillLevel;
  const canManage = Boolean(user && (user.id === session.hostId || viewer?.player.role === "cohost"));
  const publicUrl = `${getPublicEnv().NEXT_PUBLIC_APP_URL}/s/${session.slug}`;
  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: session.title,
    url: publicUrl,
    startDate: session.startsAt.toISOString(),
    endDate: session.endsAt.toISOString(),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: session.venueName,
      ...(session.venueAddress ? { address: session.venueAddress } : {}),
    },
    organizer: { "@type": "Person", name: hostProfile?.name ?? "Relay host" },
    maximumAttendeeCapacity: session.capacity,
    remainingAttendeeCapacity: spots,
  };
  const overview = await getSessionOverview(
    session.id,
    viewer && canParticipate(viewer.player.rsvp) ? { sessionPlayerId: viewer.player.id, canManage } : undefined,
  );
  const availabilityLabel = session.rosterLocked
    ? "Roster closed"
    : spots
      ? spotsRemainingLabel(spots)
      : "Waitlist open";
  const joinTitle = session.rosterLocked
    ? "Roster closed"
    : currentRsvp
      ? "Your response"
      : spots
        ? "Join this game"
        : "Join the waitlist";
  const joinHelp = session.rosterLocked
    ? "The host has paused new responses"
    : currentRsvp
      ? "Review or update your response"
      : spots
        ? user
          ? "Use your Relay account to RSVP"
          : "No account needed"
        : "The game is full. We’ll save your place in line.";
  return (
    <main
      id="main-content"
      className="public-session-page min-h-screen bg-surface"
      style={sessionAccentStyle(session.accentColor)}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd).replaceAll("<", "\\u003c") }}
      />
      <div className="mx-auto w-full max-w-6xl pb-12 pt-4 sm:px-6 sm:pt-8">
        <div className="px-4 sm:px-0">
          <GamePageIntro
            title="Overview"
            description="The plan, roster, availability, and what you need before the game."
          />
        </div>
        <div className={`grid gap-6 ${session.status === "completed" ? "" : "lg:grid-cols-[1fr_350px]"}`}>
          <article className="public-session-panel public-session-overview-card min-w-0 overflow-hidden border-y border-line bg-surface sm:rounded-xl sm:border">
            <SessionHero
              session={session}
              hostLabel={`Hosted by ${hostProfile?.name ?? "the host"}`}
              headingLevel="h2"
            />
            {session.status !== "completed" ? (
              <div className="border-b border-line px-4 py-3 lg:hidden">
                <ButtonLink href="#public-rsvp-title" className="w-full">
                  {currentRsvp ? "Update response" : spots ? "Join game" : "Join waitlist"}
                </ButtonLink>
              </div>
            ) : null}
            <div className="public-session-content px-5 py-6 sm:px-8 sm:py-8">
              <SessionPlanDetails session={session} />
              <SessionAtAGlance
                overview={overview}
                hrefBase={`/s/${session.slug}`}
                status={session.status}
                goingCount={going.length}
                capacity={session.capacity}
                waitlistCount={waitlisted.length}
              />
              {session.status !== "completed" ? (
                <section
                  aria-labelledby="public-rsvp-title"
                  className="public-session-section border-b border-line lg:hidden"
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <h2 id="public-rsvp-title" className="text-lg font-bold">
                        {joinTitle}
                      </h2>
                      <p className="mt-1 text-sm text-muted">{joinHelp}</p>
                    </div>
                    <strong className="score shrink-0 text-sm font-bold text-primary">{availabilityLabel}</strong>
                  </div>
                  <RsvpControl
                    sessionId={session.id}
                    slug={session.slug}
                    signedIn={Boolean(user)}
                    accountName={accountName}
                    guestName={guestName}
                    currentRsvp={currentRsvp}
                    currentSkillLevel={currentSkillLevel}
                    locked={session.rosterLocked}
                    full={spots === 0}
                    instance="mobile"
                    discoverySource={discoverySource}
                  />
                </section>
              ) : null}
              <RosterPreview
                id="mobile-roster-title"
                slug={session.slug}
                names={names}
                imageUrls={playerAvatarUrls}
                roles={playerRoles}
                capacity={session.capacity}
                waitlistCount={waitlisted.length}
                className={`public-session-section border-b border-line ${session.status === "completed" ? "" : "lg:hidden"}`}
              />
              {session.notes ? (
                <section aria-labelledby="notes-title" className="public-session-notes">
                  <h2 id="notes-title" className="text-lg font-bold">
                    A note from {hostProfile?.name?.split(" ")[0] ?? "the host"}
                  </h2>
                  <p className="mt-3 max-w-2xl text-pretty leading-7 text-muted">{session.notes}</p>
                </section>
              ) : null}
            </div>
          </article>
          {session.status !== "completed" ? (
            <aside className="hidden space-y-7 self-start lg:sticky lg:top-6 lg:block">
              <section className="public-session-panel public-session-overview-card rounded-xl border border-line bg-surface p-5">
                <div className="mb-5 border-b border-line pb-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-bold">{joinTitle}</h2>
                    <strong className="score shrink-0 text-sm font-bold text-primary">{availabilityLabel}</strong>
                  </div>
                  <p className="mt-1 text-sm text-muted">{joinHelp}</p>
                </div>
                <RsvpControl
                  sessionId={session.id}
                  slug={session.slug}
                  signedIn={Boolean(user)}
                  accountName={accountName}
                  guestName={guestName}
                  currentRsvp={currentRsvp}
                  currentSkillLevel={currentSkillLevel}
                  locked={session.rosterLocked}
                  full={spots === 0}
                  instance="desktop"
                  discoverySource={discoverySource}
                />
              </section>
              <RosterPreview
                id="desktop-roster-title"
                slug={session.slug}
                names={names}
                imageUrls={playerAvatarUrls}
                roles={playerRoles}
                capacity={session.capacity}
                waitlistCount={waitlisted.length}
              />
            </aside>
          ) : null}
        </div>
      </div>
    </main>
  );
}
