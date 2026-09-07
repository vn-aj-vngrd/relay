import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GamePageIntro } from "@/components/shared/game-page-intro";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentUser } from "@/features/auth/session";
import { profileAvatarUrl } from "@/features/players/avatar";
import { ensureProfile } from "@/features/players/profile";
import { sessionAccentStyle } from "@/features/sessions/accent";
import { CompletedGameBanner } from "@/features/sessions/completed-game-banner";
import {
  formatSessionDateLong,
  formatSessionTime,
  spotsRemainingLabel,
} from "@/features/sessions/format";
import { getSessionOverview } from "@/features/sessions/overview";
import { OverviewRosterPreview } from "@/features/sessions/overview-roster-preview";
import { getPublicSession } from "@/features/sessions/queries";
import { RsvpControl } from "@/features/sessions/rsvp-control";
import { SessionAtAGlance } from "@/features/sessions/session-overview";
import {
  SessionHero,
  SessionPlanDetails,
} from "@/features/sessions/session-summary";
import { canParticipate, getSessionViewer } from "@/features/sessions/viewer";
import { getPublicEnv } from "@/lib/env";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const data = await getPublicSession((await params).slug);
  if (!data) return { title: "Game not found" };
  const going = data.roster.filter(
    ({ player }) => player.rsvp === "going"
  ).length;
  const spots = Math.max(0, data.session.capacity - going);
  const availability =
    data.session.status === "cancelled"
      ? "Game cancelled"
      : data.session.status === "completed"
        ? `${data.matchCount} ${data.matchCount === 1 ? "match" : "matches"} played`
        : spots
          ? spotsRemainingLabel(spots)
          : "Waitlist open";
  const description = `${formatSessionDateLong(data.session.startsAt)}, ${formatSessionTime(data.session.startsAt, data.session.endsAt)} at ${data.session.venueName}. ${["completed", "cancelled"].includes(data.session.status) ? availability : `${going} of ${data.session.capacity} going · ${availability}`}.`;
  return {
    title: data.session.title,
    description,
    alternates: { canonical: `/s/${data.session.slug}` },
    robots: {
      index:
        data.session.visibility === "public" &&
        data.session.status !== "cancelled",
      follow: true,
    },
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
          alt: `${data.session.title} pickleball game`,
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
  const discoverySource =
    query.source === "open-games" || query.source === "search"
      ? query.source
      : undefined;
  const [data, user] = await Promise.all([
    getPublicSession(slug),
    getCurrentUser(),
  ]);
  if (!data) notFound();
  const [viewer, accountProfile] = await Promise.all([
    getSessionViewer(data.session.id, slug),
    user ? ensureProfile(user) : null,
  ]);
  const { session, roster, hostProfile } = data;
  const going = roster.filter(({ player }) => player.rsvp === "going");
  const waitlisted = roster.filter(
    ({ player }) => player.rsvp === "waitlisted"
  );
  const names = going.map(
    ({ player, profile }) => profile?.name ?? player.guestName ?? "Guest"
  );
  const playerAvatarUrls = going.map(({ profile }) =>
    profileAvatarUrl(profile?.avatarPath)
  );
  const playerRoles = going.map(({ player }) => player.role);
  const spots = Math.max(0, session.capacity - going.length);
  const accountName =
    typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : user?.email?.split("@")[0];
  const guestName = viewer?.isGuest ? viewer.player.guestName : null;
  const currentRsvp = viewer?.player.rsvp;
  const currentSkillLevel = user
    ? accountProfile?.skillLevel
    : viewer?.player.skillLevel;
  const canManage = Boolean(
    user && (user.id === session.hostId || viewer?.player.role === "cohost")
  );
  const publicUrl = `${getPublicEnv().NEXT_PUBLIC_APP_URL}/s/${session.slug}`;
  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: session.title,
    url: publicUrl,
    startDate: session.startsAt.toISOString(),
    endDate: session.endsAt.toISOString(),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus:
      session.status === "cancelled"
        ? "https://schema.org/EventCancelled"
        : "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: session.venueName,
      ...(session.venueAddress ? { address: session.venueAddress } : {}),
    },
    organizer: { "@type": "Person", name: hostProfile?.name ?? "Relay host" },
    maximumAttendeeCapacity: session.capacity,
    ...(["published", "live"].includes(session.status)
      ? { remainingAttendeeCapacity: spots }
      : {}),
  };
  const overview = await getSessionOverview(
    session.id,
    viewer && canParticipate(viewer.player.rsvp)
      ? { sessionPlayerId: viewer.player.id, canManage }
      : undefined
  );
  const activePlan =
    session.status === "published" || session.status === "live";
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
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(eventJsonLd).replaceAll("<", "\\u003c"),
        }}
      />
      <div className="mx-auto w-full max-w-6xl pb-12 pt-4 sm:px-6 sm:pt-8">
        <div className="px-4 sm:px-0">
          <GamePageIntro title="Overview" />
        </div>
        {session.status === "completed" ? (
          <div className="mb-5 px-4 sm:mb-6 sm:px-0">
            <CompletedGameBanner
              sessionId={session.id}
              hrefBase={`/s/${session.slug}`}
              canReplay={Boolean(user && user.id === session.hostId)}
              canBrowse={
                !canManage && !(viewer && canParticipate(viewer.player.rsvp))
              }
              payment={
                viewer && canParticipate(viewer.player.rsvp)
                  ? overview.payment
                  : { view: "hidden" }
              }
            />
          </div>
        ) : null}
        <div
          className={`grid gap-6 ${session.status === "completed" ? "" : "lg:grid-cols-[1fr_350px]"}`}
        >
          <article className="public-session-panel public-session-overview-card min-w-0 overflow-hidden border-y border-line bg-surface sm:rounded-xl sm:border">
            <SessionHero
              session={session}
              hostLabel={`Hosted by ${hostProfile?.name ?? "the host"}`}
              headingLevel="h2"
            />
            {activePlan ? (
              <div className="border-b border-line px-4 py-3 lg:hidden">
                <ButtonLink href="#public-rsvp-title" className="w-full">
                  {currentRsvp
                    ? "Update response"
                    : spots
                      ? "Join game"
                      : "Join waitlist"}
                </ButtonLink>
              </div>
            ) : null}
            <div className="public-session-content px-5 py-6 sm:px-8 sm:py-8">
              <SessionPlanDetails session={session} />
              {session.status === "cancelled" ? (
                <section
                  aria-labelledby="cancellation-title"
                  className="mb-7 border-y border-danger/25 bg-danger/8 px-4 py-5"
                >
                  <h2 id="cancellation-title" className="text-lg font-bold">
                    This game was cancelled
                  </h2>
                  <p className="mt-2 max-w-2xl break-words text-sm leading-6 text-muted">
                    {session.cancellationReason ??
                      "The organizer cancelled this game before Play started."}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    Existing payment records remain available to signed-in
                    participants for coordination.
                  </p>
                </section>
              ) : null}
              <SessionAtAGlance
                overview={overview}
                hrefBase={`/s/${session.slug}`}
                status={session.status}
              />
              {activePlan ? (
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
                    <strong className="score shrink-0 text-sm font-bold text-primary">
                      {availabilityLabel}
                    </strong>
                  </div>
                  <RsvpControl
                    sessionId={session.id}
                    slug={session.slug}
                    signedIn={Boolean(user)}
                    accountName={accountName}
                    accountUsername={accountProfile?.username}
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
              <OverviewRosterPreview
                terminal={!activePlan}
                id="mobile-roster-title"
                hrefBase={`/s/${session.slug}`}
                names={names}
                imageUrls={playerAvatarUrls}
                roles={playerRoles}
                capacity={session.capacity}
                waitlistCount={waitlisted.length}
                className={`public-session-section border-b border-line ${activePlan ? "lg:hidden" : ""}`}
              />
              {session.notes ? (
                <section
                  aria-labelledby="notes-title"
                  className="public-session-notes"
                >
                  <h2 id="notes-title" className="text-lg font-bold">
                    Note
                  </h2>
                  <p className="mt-3 max-w-2xl break-words text-pretty leading-7 text-muted">
                    {session.notes}
                  </p>
                </section>
              ) : null}
            </div>
          </article>
          {activePlan ? (
            <aside className="hidden space-y-7 self-start lg:sticky lg:top-6 lg:block">
              <section className="public-session-panel public-session-overview-card rounded-xl border border-line bg-surface p-5">
                <div className="mb-5 border-b border-line pb-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-bold">{joinTitle}</h2>
                    <strong className="score shrink-0 text-sm font-bold text-primary">
                      {availabilityLabel}
                    </strong>
                  </div>
                  <p className="mt-1 text-sm text-muted">{joinHelp}</p>
                </div>
                <RsvpControl
                  sessionId={session.id}
                  slug={session.slug}
                  signedIn={Boolean(user)}
                  accountName={accountName}
                  accountUsername={accountProfile?.username}
                  guestName={guestName}
                  currentRsvp={currentRsvp}
                  currentSkillLevel={currentSkillLevel}
                  locked={session.rosterLocked}
                  full={spots === 0}
                  instance="desktop"
                  discoverySource={discoverySource}
                />
              </section>
              <OverviewRosterPreview
                id="desktop-roster-title"
                hrefBase={`/s/${session.slug}`}
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
