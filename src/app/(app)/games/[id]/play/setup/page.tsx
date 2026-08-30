import { redirect } from "next/navigation";

import { GamePageIntro } from "@/components/shared/game-page-intro";
import { requireUser } from "@/features/auth/session";
import { PlaySetupForm } from "@/features/matches/play-setup-form";
import { getLiveSession } from "@/features/matches/queries";
import { AttendanceBulkActions, AttendanceToggle } from "@/features/sessions/attendance-toggle";

function playerName(player: { guestName: string | null }, profile: { name: string } | null) {
  return profile?.name ?? player.guestName ?? "Guest";
}

export default async function PlaySetupPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const id = (await params).id;
  const data = await getLiveSession(id, user.id);
  if (!data) redirect(`/games/${id}/play`);

  const canManage = data.session.hostId === user.id || data.membership?.role === "cohost";
  if (!canManage || data.session.status === "live" || data.session.status === "completed") {
    redirect(`/games/${id}/play`);
  }

  const going = data.roster.filter(({ player }) => player.rsvp === "going");
  const checkedIn = going.filter(({ player }) => player.checkedInAt);
  const attendanceTaken = checkedIn.length > 0 || going.some(({ player }) => player.playState === "unavailable");
  const activeRoster = attendanceTaken ? checkedIn : going;

  return (
    <>
      <GamePageIntro
        title="Set up Play"
        description="Confirm arrivals, choose the court flow, and begin the first rotation."
      />
      <div className="mx-auto w-full max-w-2xl pb-8 sm:pt-6">
        <section aria-labelledby="setup-arrivals-title">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 id="setup-arrivals-title" className="text-lg font-bold">
                Who’s here
              </h2>
              <p className="mt-1 text-sm leading-5 text-muted">
                {checkedIn.length
                  ? `${checkedIn.length} here · players marked Not here can join the queue when they arrive.`
                  : attendanceTaken
                    ? "No players are marked here. Mark at least four here before starting."
                    : "No arrivals marked yet. If you start now, everyone going enters the first rotation."}
              </p>
            </div>
            {going.length ? (
              <AttendanceBulkActions sessionId={data.session.id} allPresent={checkedIn.length === going.length} />
            ) : null}
          </div>
          <div className="mt-3 grid divide-y divide-line border-y border-line sm:grid-cols-2 sm:gap-x-6 sm:divide-y-0">
            {going.map(({ player, profile }) => (
              <AttendanceToggle
                key={player.id}
                sessionId={data.session.id}
                sessionPlayerId={player.id}
                name={playerName(player, profile)}
                present={Boolean(player.checkedInAt)}
              />
            ))}
          </div>
        </section>

        <section aria-labelledby="play-format-title" className="mt-10">
          <h2 id="play-format-title" className="text-lg font-bold">
            Choose how this game runs
          </h2>
          <p className="mt-1 text-sm leading-5 text-muted">
            Everyone sees the same court assignments, queue, timer, and scores.
          </p>
          <PlaySetupForm
            sessionId={data.session.id}
            playerCount={activeRoster.length}
            courtCount={data.courts.length}
            activePlayerIds={activeRoster.map(({ player }) => player.id)}
            players={going.map(({ player, profile }) => ({
              id: player.id,
              name: playerName(player, profile),
              skillLevel: player.skillLevel,
            }))}
          />
        </section>
      </div>
    </>
  );
}
