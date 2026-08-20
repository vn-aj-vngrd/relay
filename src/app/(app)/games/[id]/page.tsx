import { CalendarCheck, CaretRight, HourglassMedium, Play } from "@phosphor-icons/react/dist/ssr";
import { notFound, redirect } from "next/navigation";

import { Avatar, AvatarStack } from "@/components/shared/avatar-stack";
import { GamePageIntro } from "@/components/shared/game-page-intro";
import { ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/features/auth/session";
import { profileAvatarUrl } from "@/features/players/avatar";
import { markSessionBookedAction } from "@/features/sessions/actions";
import { formatSessionDateLong, peso } from "@/features/sessions/format";
import { getSessionOverview } from "@/features/sessions/overview";
import { getSessionForUser } from "@/features/sessions/queries";
import { sessionReadiness } from "@/features/sessions/readiness";
import { SessionAtAGlance } from "@/features/sessions/session-overview";
import { SessionReadinessPanel } from "@/features/sessions/session-readiness";
import { SessionHero, SessionPlanDetails } from "@/features/sessions/session-summary";

function responseLabel(rsvp?: string) {
  if (rsvp === "waitlisted") return "You’re on the waitlist";
  if (rsvp === "maybe") return "You responded maybe";
  return "You’re going";
}

export default async function GameOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const data = await getSessionForUser((await params).id, user.id);
  if (!data) notFound();
  const { session, membership, roster } = data;
  const going = roster.filter(({ player }) => player.rsvp === "going");
  const waitlisted = roster.filter(({ player }) => player.rsvp === "waitlisted");
  const pending = roster.filter(({ player }) => player.rsvp === "pending");
  const names = going.map(({ player, profile }) => profile?.name ?? player.guestName ?? "Guest");
  const playerAvatarUrls = going.map(({ profile }) => profileAvatarUrl(profile?.avatarPath));
  const hostName = roster.find(({ player }) => player.role === "host")?.profile?.name ?? "the host";
  const isHost = session.hostId === user.id || membership?.role === "cohost";
  if (membership?.rsvp === "declined") notFound();
  if (membership?.rsvp === "invited") redirect(`/s/${session.slug}`);
  if (membership?.rsvp === "pending")
    return (
      <div className="mx-auto w-full max-w-6xl">
        <p className="sport-label text-primary">{formatSessionDateLong(session.startsAt).toUpperCase()}</p>
        <h1 title={session.title} className="mt-2 truncate app-title">
          {session.title}
        </h1>
        <section className="mt-8 border-y border-line py-10 text-center">
          <HourglassMedium aria-hidden size={26} className="mx-auto text-warning" />
          <h2 className="mt-4 text-xl font-bold">Waiting for host approval</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            Your request is with the host. Once approved, this page unlocks the roster, chat, payments, Play, and live
            scores.
          </p>
          <div className="mt-6">
            <ButtonLink href={`/s/${session.slug}`} variant="secondary">
              View shared game
            </ButtonLink>
          </div>
        </section>
      </div>
    );

  const overview = await getSessionOverview(session.id, { sessionPlayerId: membership?.id ?? "", canManage: isHost });
  const readiness = sessionReadiness({
    goingCount: going.length,
    booked: Boolean(session.bookedAt),
    expectsCollection: Boolean(session.estimatedCostCents || session.bookingTotalCents),
    collectionCreated: overview.payment.view === "host",
  });
  const bookingAction =
    isHost && !session.bookedAt ? (
      <form action={markSessionBookedAction}>
        <input type="hidden" name="sessionId" value={session.id} />
        <SubmitButton pendingLabel="Confirming…">
          <CalendarCheck aria-hidden size={15} />
          Confirm booking
        </SubmitButton>
      </form>
    ) : null;

  return (
    <>
      <GamePageIntro
        title="Overview"
        description={
          isHost
            ? "The plan, roster, setup progress, and next action for this game."
            : `${responseLabel(membership?.rsvp)} · review the plan and what needs you next.`
        }
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <article className="public-session-panel min-w-0 overflow-hidden rounded-xl border border-line bg-surface">
          <SessionHero
            session={session}
            hostLabel={isHost ? "Hosted by you" : `Hosted by ${hostName}`}
            headingLevel="h2"
          />
          <div className="px-5 py-6 sm:px-8 sm:py-8">
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
          <section className="rounded-xl border border-line bg-surface p-5">
            <p className="text-sm font-semibold text-primary">{isHost ? "Host access" : "Your response"}</p>
            <h2 className="mt-1 text-lg font-bold">
              {isHost ? "You manage this game" : responseLabel(membership?.rsvp)}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {isHost
                ? "Editing, roster controls, payments, Play, and scoring appear only for hosts."
                : "You can view the plan and scores, chat with the group, and manage your own payment."}
            </p>
            {isHost ? <SessionReadinessPanel readiness={readiness} sessionId={session.id} /> : null}
            {isHost ? (
              <ButtonLink href={`/games/${session.id}/play`} className="mt-5 w-full">
                <Play aria-hidden weight="fill" size={15} />
                {session.status === "live" ? "Open Play" : "Set up Play"}
              </ButtonLink>
            ) : session.estimatedCostCents ? (
              <ButtonLink href={`/games/${session.id}/payments`} variant="secondary" className="mt-5 w-full">
                View payment · {peso(session.estimatedCostCents)}
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
            <ul className="divide-y divide-line border-y border-line">
              {going.slice(0, 5).map(({ player, profile }, index) => {
                const name = profile?.name ?? player.guestName ?? "Guest";
                return (
                  <li className="flex min-h-14 items-center gap-3 py-2" key={player.id}>
                    <Avatar name={name} imageUrl={profileAvatarUrl(profile?.avatarPath)} index={index} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
                    <span className="text-xs text-muted">{player.role === "host" ? "Host" : "Going"}</span>
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
