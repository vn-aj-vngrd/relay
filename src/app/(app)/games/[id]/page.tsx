import { CalendarCheck, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";

import { Avatar, AvatarStack } from "@/components/shared/avatar-stack";
import { GamePageIntro } from "@/components/shared/game-page-intro";
import { ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/features/auth/session";
import { profileAvatarUrl } from "@/features/players/avatar";
import { ensureProfile } from "@/features/players/profile";
import { markSessionBookedAction } from "@/features/sessions/actions";
import { CreatedGameShare } from "@/features/sessions/created-game-share";
import { formatSessionDate, formatSessionTime } from "@/features/sessions/format";
import { getSessionOverview } from "@/features/sessions/overview";
import { getSessionForWorkspace } from "@/features/sessions/queries";
import { sessionReadiness } from "@/features/sessions/readiness";
import { RsvpControl } from "@/features/sessions/rsvp-control";
import { SessionAtAGlance } from "@/features/sessions/session-overview";
import { SessionOverviewStatus } from "@/features/sessions/session-overview-status";
import { SessionHero, SessionPlanDetails } from "@/features/sessions/session-summary";

function responseLabel(rsvp?: string) {
  if (rsvp === "waitlisted") return "You’re on the waitlist";
  if (rsvp === "maybe") return "You responded maybe";
  return "You’re going";
}

export default async function GameOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ source?: string; created?: string }>;
}) {
  const [user, query] = await Promise.all([requireUser(), searchParams]);
  const data = await getSessionForWorkspace((await params).id, user.id);
  if (!data) notFound();
  const { session, membership, roster } = data;
  const accountProfile = roster.find(({ player }) => player.userId === user.id)?.profile ?? (await ensureProfile(user));
  const going = roster.filter(({ player }) => player.rsvp === "going");
  const waitlisted = roster.filter(({ player }) => player.rsvp === "waitlisted");
  const pending = roster.filter(({ player }) => player.rsvp === "pending");
  const names = going.map(({ player, profile }) => profile?.name ?? player.guestName ?? "Guest");
  const playerAvatarUrls = going.map(({ profile }) => profileAvatarUrl(profile?.avatarPath));
  const hostName = roster.find(({ player }) => player.role === "host")?.profile?.name ?? "the host";
  const isHost = session.hostId === user.id || membership?.role === "cohost";
  if (["invited", "pending"].includes(membership?.rsvp ?? "") || data.access === "discoverer") {
    const isInvitation = membership?.rsvp === "invited";
    const isPending = membership?.rsvp === "pending";
    const discoverySource = query.source === "open-games" || query.source === "search" ? query.source : undefined;
    const currentRsvp = isInvitation
      ? ("invited" as const)
      : isPending
        ? ("pending" as const)
        : membership?.rsvp === "declined"
          ? ("declined" as const)
          : undefined;
    const accountName =
      typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : user.email?.split("@")[0];
    const responseOverview = await getSessionOverview(session.id);
    return (
      <>
        <GamePageIntro
          title={isInvitation ? "Invitation" : "Overview"}
          description={
            isInvitation
              ? "Review the plan and respond without leaving the Relay app."
              : isPending
                ? "Your request is with the host. You can keep reviewing the game here."
                : "Review the plan, availability, and cost before you join."
          }
        />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <article className="public-session-panel min-w-0 overflow-hidden rounded-xl border border-line bg-surface">
            <SessionHero session={session} hostLabel={`Hosted by ${hostName}`} headingLevel="h2" />
            <div className="px-5 py-6 sm:px-8 sm:py-8">
              <SessionPlanDetails session={session} />
              <SessionAtAGlance
                overview={responseOverview}
                hrefBase={`/games/${session.id}`}
                status={session.status}
                goingCount={going.length}
                capacity={session.capacity}
                waitlistCount={waitlisted.length}
              />
              {session.notes ? (
                <section className="pt-7">
                  <h2 className="text-lg font-bold">A note from {hostName.split(" ")[0]}</h2>
                  <p className="mt-3 max-w-2xl text-pretty leading-7 text-muted">{session.notes}</p>
                </section>
              ) : null}
            </div>
          </article>
          <aside className="space-y-7 self-start lg:sticky lg:top-6">
            <section className="rounded-xl border border-line bg-surface p-5">
              <p className="text-sm font-semibold text-primary">
                {isInvitation
                  ? "You’re invited"
                  : isPending
                    ? "Awaiting approval"
                    : session.requiresApproval
                      ? "Host approval required"
                      : "Open game"}
              </p>
              <h2 className="mt-1 text-lg font-bold">
                {isInvitation
                  ? "Can you make it?"
                  : isPending
                    ? "Your request was sent"
                    : going.length >= session.capacity
                      ? "Join the waitlist"
                      : "Join this game"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                {isPending
                  ? "You’ll see the update here when the host responds."
                  : "Your response stays attached to your Relay account."}
              </p>
              <div className="mt-5">
                <RsvpControl
                  sessionId={session.id}
                  slug={session.slug}
                  signedIn
                  accountName={accountName}
                  accountUsername={accountProfile.username}
                  currentRsvp={currentRsvp}
                  currentSkillLevel={accountProfile.skillLevel}
                  locked={session.rosterLocked}
                  full={going.length >= session.capacity}
                  discoverySource={data.access === "discoverer" ? discoverySource : undefined}
                />
              </div>
              {isInvitation ? (
                <ButtonLink href={`/s/${session.slug}`} variant="quiet" className="mt-3 w-full">
                  Preview shared link
                </ButtonLink>
              ) : null}
            </section>
            <section>
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <h2 className="text-lg font-bold">Who’s playing</h2>
                  <p className="mt-1 text-sm text-muted">
                    {going.length} of {session.capacity} going
                  </p>
                </div>
                <AvatarStack names={names.slice(0, 3)} imageUrls={playerAvatarUrls.slice(0, 3)} total={going.length} />
              </div>
              <ButtonLink href={`/games/${session.id}/players`} variant="quiet" className="w-full">
                View players <CaretRight aria-hidden size={14} />
              </ButtonLink>
            </section>
          </aside>
        </div>
      </>
    );
  }

  const overview = await getSessionOverview(session.id, { sessionPlayerId: membership?.id ?? "", canManage: isHost });
  const readiness = sessionReadiness({
    goingCount: going.length,
    booked: Boolean(session.bookedAt),
    expectsCollection: Boolean(session.estimatedCostCents || session.bookingTotalCents),
    collectionCreated: overview.payment.view === "host",
  });
  const showCreated = query.created === "1" && isHost && session.status === "published";
  const shareDetails = `${formatSessionDate(session.startsAt, session.timezone)} · ${formatSessionTime(session.startsAt, session.endsAt, session.timezone)} · ${session.venueName}`;
  const bookingAction =
    isHost && session.status !== "completed" && !session.bookedAt ? (
      <form noValidate action={markSessionBookedAction}>
        <input type="hidden" name="sessionId" value={session.id} />
        <SubmitButton pendingLabel="Confirming…" variant="quiet" className="-ml-3 text-primary hover:bg-primary-soft">
          Confirm booking
          <CalendarCheck aria-hidden size={15} />
        </SubmitButton>
      </form>
    ) : null;

  return (
    <>
      <GamePageIntro
        title="Overview"
        description={
          session.status === "completed"
            ? "The final plan, roster, results, and saved activity from this game."
            : isHost
              ? "The plan, roster, setup progress, and next action for this game."
              : `${responseLabel(membership?.rsvp)} · review the plan and what needs you next.`
        }
      />
      {showCreated ? (
        <CreatedGameShare
          sessionId={session.id}
          title={session.title}
          shareUrl={`/s/${session.slug}`}
          details={shareDetails}
          inviteeCount={roster.filter(({ player }) => player.rsvp === "invited").length}
          qrEnabled={session.visibility !== "private"}
        />
      ) : null}
      <div className="grid gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <article className="public-session-panel -mx-4 min-w-0 overflow-hidden border-y border-line bg-surface sm:mx-0 sm:rounded-xl sm:border">
          <SessionHero
            session={session}
            hostLabel={isHost ? "Hosted by you" : `Hosted by ${hostName}`}
            headingLevel="h2"
          />
          <div className="px-4 py-5 sm:px-8 sm:py-8">
            <SessionPlanDetails session={session} bookingAction={bookingAction} />
            <SessionAtAGlance
              overview={overview}
              hrefBase={`/games/${session.id}`}
              status={session.status}
              goingCount={going.length}
              capacity={session.capacity}
              waitlistCount={waitlisted.length}
              pendingCount={isHost ? pending.length : 0}
            />
            {session.notes ? (
              <section className="pt-7">
                <h2 className="text-lg font-bold">A note from {hostName.split(" ")[0]}</h2>
                <p className="mt-3 max-w-2xl text-pretty leading-7 text-muted">{session.notes}</p>
              </section>
            ) : null}
          </div>
        </article>

        <aside className="space-y-7 lg:sticky lg:top-6 lg:self-start">
          <SessionOverviewStatus
            sessionId={session.id}
            status={session.status}
            isHost={isHost}
            rsvp={membership?.rsvp}
            estimatedCostCents={session.estimatedCostCents}
            readiness={readiness}
          />

          <section>
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h2 className="text-lg font-bold">{session.status === "completed" ? "Who played" : "Who’s playing"}</h2>
                <p className="mt-1 text-sm text-muted">
                  {session.status === "completed"
                    ? `${going.length} players`
                    : `${going.length} of ${session.capacity} going`}
                </p>
              </div>
              <AvatarStack names={names.slice(0, 3)} imageUrls={playerAvatarUrls.slice(0, 3)} total={going.length} />
            </div>
            <ul className="divide-y divide-line border-y border-line">
              {going.slice(0, 5).map(({ player, profile }, index) => {
                const name = profile?.name ?? player.guestName ?? "Guest";
                return (
                  <li className="flex min-h-14 items-center gap-3 py-2" key={player.id}>
                    <Avatar name={name} imageUrl={profileAvatarUrl(profile?.avatarPath)} index={index} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
                    <span className="text-xs text-muted">
                      {player.role === "host" ? "Host" : session.status === "completed" ? "Played" : "Going"}
                    </span>
                  </li>
                );
              })}
            </ul>
            <ButtonLink href={`/games/${session.id}/players`} variant="quiet" className="mt-2 w-full">
              View all players <CaretRight aria-hidden size={14} />
            </ButtonLink>
          </section>
        </aside>
      </div>
    </>
  );
}
