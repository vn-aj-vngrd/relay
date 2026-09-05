import { notFound } from "next/navigation";

import { GamePageIntro } from "@/components/shared/game-page-intro";
import { requireUser } from "@/features/auth/session";
import { profileAvatarUrl } from "@/features/players/avatar";
import { CancelSessionControl } from "@/features/sessions/cancel-session-control";
import {
  type GameSettingsSection,
  GameSettingsTabs,
} from "@/features/sessions/game-settings-tabs";
import { LeadOrganizerControl } from "@/features/sessions/lead-organizer-control";
import { OrganizerSettings } from "@/features/sessions/organizer-settings";
import { getSessionForUser } from "@/features/sessions/queries";
import {
  type SessionSettingsDefaults,
  SessionSettingsForm,
} from "@/features/sessions/session-settings-form";

function dateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    time: `${value("hour")}:${value("minute")}`,
  };
}

export default async function GameSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ section?: string | string[] }>;
}) {
  const user = await requireUser();
  const [{ id: sessionId }, query] = await Promise.all([params, searchParams]);
  const section: GameSettingsSection =
    query.section === "invite" ||
    query.section === "booking" ||
    query.section === "organizers"
      ? query.section
      : "plan";
  const data = await getSessionForUser(sessionId, user.id);
  if (!data) notFound();
  const canEdit =
    data.session.hostId === user.id || data.membership?.role === "cohost";
  if (!canEdit) notFound();
  const ended =
    data.session.status === "completed" || data.session.status === "cancelled";
  const start = dateParts(data.session.startsAt, data.session.timezone);
  const end = dateParts(data.session.endsAt, data.session.timezone);
  const activeRoster = data.roster.filter(({ player }) => !player.leftAt);
  const organizers = activeRoster
    .flatMap(({ player, profile }) =>
      ["host", "cohost"].includes(player.role) && player.userId
        ? [
            {
              sessionPlayerId: player.id,
              userId: player.userId,
              name: profile?.name ?? player.guestName ?? "Organizer",
              imageUrl: profileAvatarUrl(profile?.avatarPath),
              role: player.role as "host" | "cohost",
              playing: player.rsvp === "going",
            },
          ]
        : []
    )
    .toSorted(
      (left, right) =>
        Number(right.role === "host") - Number(left.role === "host")
    );
  const cohosts = organizers.flatMap((organizer) =>
    organizer.role === "cohost"
      ? [{ id: organizer.userId, name: organizer.name }]
      : []
  );
  const defaults: SessionSettingsDefaults = {
    id: data.session.id,
    version: data.session.version,
    title: data.session.title,
    accentColor: data.session.accentColor,
    venue: data.session.venueName,
    venueId: data.session.venueId ?? "",
    venueAddress: data.session.venueAddress ?? "",
    date: start.date,
    start: start.time,
    end: end.time,
    capacity: data.session.capacity,
    courts: data.session.courtCount,
    cost:
      data.session.playerPriceCents == null
        ? ""
        : String(data.session.playerPriceCents / 100),
    notes: data.session.notes ?? "",
    visibility: data.session.visibility,
    requiresApproval: data.session.requiresApproval,
    booked: Boolean(data.session.bookedAt),
    bookingNotRequired: data.session.bookingNotRequired,
    bookingReference: data.session.bookingReference ?? "",
    bookingTotal:
      data.session.bookingTotalCents == null
        ? ""
        : String(data.session.bookingTotalCents / 100),
    bookingNotes: data.session.bookingNotes ?? "",
  };

  return (
    <>
      <GamePageIntro title="Game settings" />
      <div className="mx-auto w-full max-w-6xl">
        <GameSettingsTabs sessionId={sessionId} active={section} />
        {section !== "organizers" ? (
          <div className="mt-7">
            <SessionSettingsForm
              key={`${section}-${data.session.status}`}
              defaults={defaults}
              section={section}
              status={data.session.status}
            />
            {section === "plan" && data.session.status === "published" ? (
              <CancelSessionControl
                sessionId={data.session.id}
                version={data.session.version}
                playerCount={data.roster.length}
              />
            ) : null}
          </div>
        ) : (
          <>
            <OrganizerSettings
              sessionId={data.session.id}
              version={data.session.version}
              organizers={organizers}
              canManage={data.session.hostId === user.id && !ended}
            />
            {data.session.hostId === user.id &&
            data.session.status !== "completed" &&
            data.session.status !== "cancelled" ? (
              <LeadOrganizerControl
                sessionId={data.session.id}
                version={data.session.version}
                currentLeadId={data.session.leadOrganizerId}
                cohosts={cohosts}
              />
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
