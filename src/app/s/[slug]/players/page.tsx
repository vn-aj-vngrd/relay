import { notFound } from "next/navigation";

import { Avatar } from "@/components/shared/avatar-stack";
import { profileAvatarUrl } from "@/features/players/avatar";
import { playingExperienceLabel } from "@/features/players/playing-experience";
import { sessionAccentStyle } from "@/features/sessions/accent";
import { getPublicSession } from "@/features/sessions/queries";

export default async function PublicPlayersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const data = await getPublicSession(slug);
  if (!data) notFound();
  const organizers = data.roster.filter(({ player }) =>
    ["host", "cohost"].includes(player.role)
  );
  const going = data.roster.filter(({ player }) => player.rsvp === "going");
  const waitlist = data.roster.filter(
    ({ player }) => player.rsvp === "waitlisted"
  );
  return (
    <main
      id="main-content"
      className="public-session-page min-h-screen bg-surface"
      style={sessionAccentStyle(data.session.accentColor)}
    >
      <article className="public-session-content mx-auto w-full max-w-6xl bg-surface px-4 pb-8 pt-4 sm:px-6 sm:py-8">
        <div className="flex min-w-0 items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="public-tab-title app-title">Players</h1>
            <p className="mt-2 text-sm text-muted">
              {going.length} of {data.session.capacity} spots filled
            </p>
          </div>
          <span className="score shrink-0 whitespace-nowrap text-2xl font-bold text-primary">
            {Math.max(0, data.session.capacity - going.length)} left
          </span>
        </div>
        <section className="mt-7" aria-labelledby="public-organizers-title">
          <h2 id="public-organizers-title" className="text-lg font-bold">
            Organizers
          </h2>
          <p className="mt-1 text-sm text-muted">
            Running the game does not require taking a player spot.
          </p>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {organizers.map(({ player, profile }, index) => {
              const name = profile?.name ?? player.guestName ?? "Organizer";
              return (
                <li
                  key={player.id}
                  className="flex min-h-14 items-center gap-3 py-2"
                >
                  <Avatar
                    name={name}
                    imageUrl={profileAvatarUrl(profile?.avatarPath)}
                    index={index}
                    size="sm"
                  />
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {name}
                  </span>
                  <span className="text-xs text-muted">
                    {player.role === "host" ? "Host" : "Co-host"}
                    {player.rsvp !== "going" ? " · Not playing" : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <h2 className="mt-9 text-lg font-bold" id="public-going-title">
          Going
        </h2>
        <ul
          aria-labelledby="public-going-title"
          className="mt-3 divide-y divide-line border-y border-line"
        >
          {going.map(({ player, profile }, index) => {
            const name = profile?.name ?? player.guestName ?? "Guest";
            return (
              <li
                key={player.id}
                className="public-session-row flex min-h-16 items-center gap-3 py-2"
              >
                <Avatar
                  name={name}
                  imageUrl={profileAvatarUrl(profile?.avatarPath)}
                  index={index}
                  size="sm"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{name}</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {playingExperienceLabel(player.skillLevel)}
                  </span>
                </span>
                <span className="text-xs text-muted">
                  {player.role === "host" ? "Host" : "Going"}
                </span>
              </li>
            );
          })}
        </ul>
        <section className="mt-10">
          <h2 className="text-lg font-bold">Waitlist</h2>
          {waitlist.length ? (
            <ol className="mt-3 divide-y divide-line border-y border-line">
              {waitlist.map(({ player, profile }, index) => (
                <li
                  key={player.id}
                  className="public-session-row flex min-h-14 items-center gap-3"
                >
                  <span className="score w-5 text-sm text-muted">
                    {index + 1}
                  </span>
                  <span className="font-medium">
                    {profile?.name ?? player.guestName ?? "Guest"}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-2 text-sm text-muted">No one is waiting.</p>
          )}
        </section>
      </article>
    </main>
  );
}
