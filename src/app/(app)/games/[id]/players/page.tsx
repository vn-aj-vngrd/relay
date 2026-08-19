import { Clock, UserCheck, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";

import { Avatar } from "@/components/shared/avatar-stack";
import { GamePageIntro } from "@/components/shared/game-page-intro";
import { requireUser } from "@/features/auth/session";
import { profileAvatarUrl } from "@/features/players/avatar";
import { playingExperienceLabel } from "@/features/players/playing-experience";
import {
  AddGuestPlayerForm,
  PendingPlayerActions,
  RemovePlayerButton,
  RosterLockButton,
} from "@/features/sessions/player-roster-controls";
import { getSessionForParticipant } from "@/features/sessions/queries";

export default async function PlayersPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const data = await getSessionForParticipant((await params).id, user.id);
  if (!data) notFound();
  const going = data.roster.filter(({ player }) => player.rsvp === "going");
  const pending = data.roster.filter(({ player }) => player.rsvp === "pending");
  const waitlist = data.roster.filter(({ player }) => player.rsvp === "waitlisted");
  const otherResponses = data.roster.filter(({ player }) => player.rsvp === "maybe" || player.rsvp === "invited");
  const isHost = data.session.hostId === user.id || data.membership?.role === "cohost";

  return (
    <>
      <GamePageIntro
        title="Players"
        description="Manage who’s going, join requests, waitlist movement, and roster access."
      />
      <div className="mx-auto w-full max-w-6xl">
        {isHost ? (
          <section className="mb-9 border-y border-line py-5" aria-labelledby="add-player-title">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex gap-3">
                <UsersThree aria-hidden size={20} className="mt-0.5 text-primary" />
                <div>
                  <h2 id="add-player-title" className="font-bold">
                    Build the roster your way
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    Add friends by name now, or share the invite and let them RSVP.{" "}
                    {data.session.requiresApproval
                      ? "New join requests need approval."
                      : "New players join automatically while spots are open."}
                  </p>
                </div>
              </div>
              <RosterLockButton sessionId={data.session.id} locked={data.session.rosterLocked} />
            </div>
            {data.session.rosterLocked ? (
              <p className="mt-4 text-sm font-medium text-warning">
                The roster is locked. Unlock it to add or accept players.
              </p>
            ) : (
              <AddGuestPlayerForm sessionId={data.session.id} />
            )}
          </section>
        ) : null}

        {isHost && pending.length ? (
          <section className="mb-9" aria-labelledby="pending-title">
            <div className="flex items-center gap-2">
              <Clock aria-hidden size={18} className="text-warning" />
              <h2 id="pending-title" className="text-lg font-bold">
                Join requests
              </h2>
              <span className="score text-sm text-muted">{pending.length}</span>
            </div>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {pending.map(({ player, profile }, index) => {
                const name = profile?.name ?? player.guestName ?? "Guest";
                return (
                  <li key={player.id} className="flex min-h-16 flex-wrap items-center gap-3 py-2">
                    <Avatar name={name} imageUrl={profileAvatarUrl(profile?.avatarPath)} index={index} size="sm" />
                    <div className="min-w-32 flex-1">
                      <p className="font-medium">{name}</p>
                      <p className="mt-0.5 text-xs text-muted">Requested a spot</p>
                    </div>
                    <PendingPlayerActions sessionId={data.session.id} playerId={player.id} />
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="going-title">
          <div className="flex items-end justify-between">
            <div>
              <h2 id="going-title" className="text-lg font-bold">
                Going
              </h2>
              <p className="mt-1 text-sm text-muted">
                {going.length} of {data.session.capacity} spots filled
              </p>
            </div>
            <span className="score text-2xl font-bold text-primary">
              {Math.max(0, data.session.capacity - going.length)} left
            </span>
          </div>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {going.map(({ player, profile }, index) => {
              const name = profile?.name ?? player.guestName ?? "Guest";
              return (
                <li key={player.id} className="flex min-h-16 items-center gap-3 py-2">
                  <Avatar name={name} imageUrl={profileAvatarUrl(profile?.avatarPath)} index={index} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {name}
                      {player.role === "host" ? (
                        <span className="ml-2 text-xs font-normal text-muted">Host</span>
                      ) : player.role === "cohost" ? (
                        <span className="ml-2 text-xs font-normal text-muted">Co-host</span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">{playingExperienceLabel(player.skillLevel)}</span>
                  </span>
                  {isHost && player.role !== "host" ? (
                    <RemovePlayerButton sessionId={data.session.id} playerId={player.id} name={name} />
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-9" aria-labelledby="waitlist-title">
          <h2 id="waitlist-title" className="text-lg font-bold">
            Waitlist
          </h2>
          {waitlist.length ? (
            <ol className="mt-3 divide-y divide-line border-y border-line">
              {waitlist.map(({ player, profile }, index) => {
                const name = profile?.name ?? player.guestName ?? "Guest";
                return (
                  <li key={player.id} className="flex min-h-14 items-center gap-3">
                    <span className="score w-5 text-sm text-muted">{index + 1}</span>
                    <span className="flex-1 font-medium">{name}</span>
                    {isHost ? (
                      <RemovePlayerButton sessionId={data.session.id} playerId={player.id} name={name} />
                    ) : null}
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="mt-2 text-sm text-muted">
              No one is waiting. New players move here automatically when the game is full.
            </p>
          )}
        </section>

        {isHost && otherResponses.length ? (
          <section className="mt-9" aria-labelledby="responses-title">
            <div className="flex items-center gap-2">
              <UserCheck aria-hidden size={18} className="text-muted" />
              <h2 id="responses-title" className="text-lg font-bold">
                Other responses
              </h2>
            </div>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {otherResponses.map(({ player, profile }) => {
                const name = profile?.name ?? player.guestName ?? "Guest";
                return (
                  <li key={player.id} className="flex min-h-14 items-center gap-3">
                    <span className="flex-1 font-medium">{name}</span>
                    <span className="text-sm capitalize text-muted">{player.rsvp}</span>
                    <RemovePlayerButton sessionId={data.session.id} playerId={player.id} name={name} />
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}
