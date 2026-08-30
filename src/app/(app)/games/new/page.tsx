import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import Link from "next/link";

import { db } from "@/db/client";
import { groupMembers, groups, sessionPlayers, sessions } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { type CreateSessionDefaults, CreateSessionForm } from "@/features/sessions/create-session-form";
import { getCourtSuggestions } from "@/features/venues/directory";

export default async function NewGamePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; group?: string; venue?: string; address?: string }>;
}) {
  const user = await requireUser();
  const [params, courts] = await Promise.all([searchParams, getCourtSuggestions()]);
  const source = params.from
    ? await db.query.sessions.findFirst({ where: and(eq(sessions.id, params.from), eq(sessions.hostId, user.id)) })
    : null;
  const requestedGroupId = params.group ?? source?.groupId ?? undefined;
  const groupMembership = requestedGroupId
    ? await db.query.groupMembers.findFirst({
        where: and(eq(groupMembers.groupId, requestedGroupId), eq(groupMembers.userId, user.id)),
      })
    : null;
  const group = groupMembership
    ? await db.query.groups.findFirst({ where: eq(groups.id, groupMembership.groupId) })
    : null;
  const groupTemplate =
    group && !source
      ? await db.query.sessions.findFirst({ where: eq(sessions.groupId, group.id), orderBy: [desc(sessions.startsAt)] })
      : null;
  const template = source ?? groupTemplate;
  const time = (value: Date) =>
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: template?.timezone ?? "Asia/Manila",
    }).format(value);
  const inviteeCount = group
    ? Math.max(0, (await db.$count(groupMembers, eq(groupMembers.groupId, group.id))) - 1)
    : source
      ? Math.max(
          0,
          (await db.$count(
            sessionPlayers,
            and(
              eq(sessionPlayers.sessionId, source.id),
              eq(sessionPlayers.rsvp, "going"),
              isNotNull(sessionPlayers.userId),
            ),
          )) - 1,
        )
      : 0;
  const defaults: CreateSessionDefaults = template
    ? {
        title: source?.title ?? `${group?.name ?? template.title} Pickle`,
        venue: template.venueName,
        venueAddress: template.venueAddress ?? undefined,
        capacity: template.capacity,
        courts: template.courtCount,
        start: time(template.startsAt),
        end: time(template.endsAt),
        cost: template.estimatedCostCents ? template.estimatedCostCents / 100 : undefined,
        accentColor: template.accentColor,
        groupId: group?.id,
        groupName: group?.name,
        sourceSessionId: source?.id,
        inviteeCount,
      }
    : {
        groupId: group?.id,
        groupName: group?.name,
        title: group ? `${group.name} Pickle` : undefined,
        inviteeCount,
        venue: params.venue?.slice(0, 120),
        venueAddress: params.address?.slice(0, 240),
      };
  return (
    <div className="create-game-page w-full">
      <div className="create-game-mobile-header -mx-4 mb-6 flex h-14 items-center gap-1 border-b border-line px-1 sm:-mx-8 sm:px-5 lg:hidden">
        <Link
          href="/home"
          aria-label="Back to Home"
          className="pressable grid h-11 w-11 place-items-center rounded-lg text-muted hover:bg-surface-strong hover:text-ink"
        >
          <ArrowLeft aria-hidden size={18} />
        </Link>
        <p className="text-sm font-semibold text-ink">Create a game</p>
      </div>
      <Link
        href="/home"
        className="compact-sidebar-back pressable mb-5 hidden min-h-9 items-center gap-2 rounded-md px-2 text-[13px] font-semibold text-muted hover:bg-surface-strong hover:text-ink lg:inline-flex"
      >
        <ArrowLeft aria-hidden size={15} />
        Back to Home
      </Link>
      <header className="mb-10 hidden border-b border-line pb-7 lg:block">
        <h1 className="app-title">{source ? "Play again" : group ? `Game for ${group.name}` : "Create a game"}</h1>
        <p className="mt-2 max-w-xl text-pretty text-muted">
          {source
            ? "Review the copied details, choose a time, and publish."
            : group
              ? "Start with this group’s last setup and change what you need."
              : "Add the court, time, player limit, and cost. Then publish the game link."}
        </p>
      </header>
      <CreateSessionForm defaults={defaults} now={new Date().toISOString()} courts={courts} />
    </div>
  );
}
