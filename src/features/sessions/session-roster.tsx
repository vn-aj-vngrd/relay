import { Clock, UserCheck, UsersThree } from "@phosphor-icons/react/dist/ssr";

import { Avatar } from "@/components/shared/avatar-stack";
import type { SessionPlayData } from "@/features/matches/session-play";
import { profileAvatarUrl } from "@/features/players/avatar";
import { playingExperienceLabel } from "@/features/players/playing-experience";
import {
  AddPlayerForm,
  PendingPlayerActions,
  RemovePlayerButton,
  RosterLockButton,
} from "@/features/sessions/player-roster-controls";
import { AttendanceToggle } from "./attendance-toggle";

// Server-rendered: only authorized controls and visible rows cross the slot boundary.
export function SessionRoster({
  data,
  canManage,
  viewerPlayerId,
}: {
  data: Pick<SessionPlayData, "session" | "roster">;
  canManage: boolean;
  viewerPlayerId?: string;
}) {
  const ended = ["completed", "cancelled"].includes(data.session.status);
  const isHost = canManage && !ended;
  const going = data.roster.filter(({ player }) => player.rsvp === "going");
  const pending = data.roster.filter(({ player }) => player.rsvp === "pending");
  const waitlist = data.roster.filter(
    ({ player }) => player.rsvp === "waitlisted"
  );
  const otherResponses = data.roster.filter(
    ({ player }) =>
      !player.leftAt &&
      player.role === "player" &&
      ["maybe", "invited", "declined"].includes(player.rsvp)
  );

  return (
    <div className="mx-auto w-full max-w-6xl">
      {isHost ? (
        <section
          className="mb-9 border-b border-line py-5"
          aria-labelledby="add-player-title"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex gap-3">
              <UsersThree
                aria-hidden
                size={20}
                className="mt-0.5 text-primary"
              />
              <div>
                <h2 id="add-player-title" className="font-bold">
                  Build the roster your way
                </h2>
              </div>
            </div>
            <RosterLockButton
              sessionId={data.session.id}
              locked={data.session.rosterLocked}
            />
          </div>
          {data.session.rosterLocked ? (
            <p className="mt-4 text-sm font-medium text-warning">
              The roster is locked. Unlock it to add or accept players.
            </p>
          ) : (
            <AddPlayerForm sessionId={data.session.id} />
          )}
        </section>
      ) : null}

      {canManage && pending.length ? (
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
                <li
                  key={player.id}
                  className="flex min-h-16 flex-wrap items-center gap-3 py-2"
                >
                  <Avatar
                    name={name}
                    imageUrl={profileAvatarUrl(profile?.avatarPath)}
                    index={index}
                    size="sm"
                  />
                  <div className="min-w-0 basis-32 flex-1 break-words">
                    <p className="font-medium">{name}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      Requested a spot
                      {player.role === "cohost" ? " · Co-host" : ""}
                    </p>
                  </div>
                  {isHost ? (
                    <PendingPlayerActions
                      sessionId={data.session.id}
                      playerId={player.id}
                    />
                  ) : null}
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
              {ended ? "Final Going responses" : "Going"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {ended
                ? `${going.length} final Going responses. RSVP does not establish court participation.`
                : `${going.length} of ${data.session.capacity} spots filled`}
            </p>
          </div>
          {!ended ? (
            <span className="score text-2xl font-bold text-primary">
              {Math.max(0, data.session.capacity - going.length)} left
            </span>
          ) : null}
        </div>
        {!going.length ? (
          <p className="mt-3 text-sm text-muted">No Going responses.</p>
        ) : null}
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {going.map(({ player, profile }, index) => {
            const name = profile?.name ?? player.guestName ?? "Guest";
            return (
              <li
                key={player.id}
                className="flex min-h-16 flex-wrap items-center gap-3 py-2"
              >
                <Avatar
                  name={name}
                  imageUrl={profileAvatarUrl(profile?.avatarPath)}
                  index={index}
                  size="sm"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {name}
                    {player.role === "host" ? (
                      <span className="ml-2 text-xs font-normal text-muted">
                        Host
                      </span>
                    ) : player.role === "cohost" ? (
                      <span className="ml-2 text-xs font-normal text-muted">
                        Co-host
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {playingExperienceLabel(player.skillLevel)}
                  </span>
                </span>
                {data.session.status === "published" &&
                (isHost || player.id === viewerPlayerId) ? (
                  <AttendanceToggle
                    sessionId={data.session.id}
                    sessionPlayerId={player.id}
                    name={name}
                    present={Boolean(player.checkedInAt)}
                    compact
                  />
                ) : null}
                {isHost && player.role === "player" ? (
                  <RemovePlayerButton
                    sessionId={data.session.id}
                    playerId={player.id}
                    name={name}
                  />
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
                <li
                  key={player.id}
                  className="flex min-h-14 items-center gap-3"
                >
                  <span className="score w-5 text-sm text-muted">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 break-words font-medium">
                    {name}
                    {player.role === "host" ? (
                      <span className="ml-2 text-xs font-normal text-muted">
                        Host
                      </span>
                    ) : player.role === "cohost" ? (
                      <span className="ml-2 text-xs font-normal text-muted">
                        Co-host
                      </span>
                    ) : null}
                  </span>
                  {isHost && player.role === "player" ? (
                    <RemovePlayerButton
                      sessionId={data.session.id}
                      playerId={player.id}
                      name={name}
                    />
                  ) : null}
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="mt-2 text-sm text-muted">
            {ended
              ? "No final waitlisted responses."
              : "No one is waiting. New players move here automatically when the game is full."}
          </p>
        )}
      </section>

      {canManage && otherResponses.length ? (
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
                <li
                  key={player.id}
                  className="flex min-h-14 items-center gap-3"
                >
                  <span className="min-w-0 flex-1 break-words font-medium">
                    {name}
                  </span>
                  <span className="text-sm capitalize text-muted">
                    {player.role === "host"
                      ? `Host · ${player.rsvp}`
                      : player.role === "cohost"
                        ? `Co-host · ${player.rsvp}`
                        : player.rsvp}
                  </span>
                  {isHost && player.role === "player" ? (
                    <RemovePlayerButton
                      sessionId={data.session.id}
                      playerId={player.id}
                      name={name}
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
