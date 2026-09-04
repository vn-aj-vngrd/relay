import { ArrowLeft, Lightning } from "@phosphor-icons/react/dist/ssr";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { db } from "@/db/client";
import { groupMembers, groups, sessionPlayers, sessions } from "@/db/schema";
import { getCurrentUser } from "@/features/auth/session";
import {
  type CreateSessionDefaults,
  CreateSessionForm,
} from "@/features/sessions/create-session-form";
import { getCourtSuggestions } from "@/features/venues/directory";

export const metadata: Metadata = {
  title: "Plan a pickleball game",
  description:
    "Build the court, schedule, player limit, and access plan before creating your Relay account.",
  robots: { index: false, follow: false },
};

export default async function NewGamePage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    group?: string;
    resume?: string;
    venueId?: string;
  }>;
}) {
  const [user, params, courts] = await Promise.all([
    getCurrentUser(),
    searchParams,
    getCourtSuggestions(),
  ]);
  if ((params.from || params.group) && !user) {
    const protectedParams = new URLSearchParams();
    if (params.from) protectedParams.set("from", params.from);
    if (params.group) protectedParams.set("group", params.group);
    if (params.venueId) protectedParams.set("venueId", params.venueId);
    redirect(
      `/login?next=${encodeURIComponent(`/games/new?${protectedParams}`)}`
    );
  }
  const selectedCourt = params.venueId
    ? courts.find((court) => court.id === params.venueId)
    : undefined;
  const source = params.from
    ? await db.query.sessions.findFirst({
        where: and(
          eq(sessions.id, params.from),
          eq(sessions.hostId, user!.id),
          eq(sessions.status, "completed")
        ),
      })
    : null;
  if (params.from && !source) notFound();
  const requestedGroupId = params.group ?? source?.groupId ?? undefined;
  const groupMembership = requestedGroupId
    ? await db.query.groupMembers.findFirst({
        where: and(
          eq(groupMembers.groupId, requestedGroupId),
          eq(groupMembers.userId, user!.id)
        ),
      })
    : null;
  const group = groupMembership
    ? await db.query.groups.findFirst({
        where: eq(groups.id, groupMembership.groupId),
      })
    : null;
  const groupTemplate =
    group && !source
      ? await db.query.sessions.findFirst({
          where: eq(sessions.groupId, group.id),
          orderBy: [desc(sessions.startsAt)],
        })
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
    ? Math.max(
        0,
        (await db.$count(groupMembers, eq(groupMembers.groupId, group.id))) - 1
      )
    : source
      ? Math.max(
          0,
          (await db.$count(
            sessionPlayers,
            and(
              eq(sessionPlayers.sessionId, source.id),
              eq(sessionPlayers.rsvp, "going"),
              isNotNull(sessionPlayers.userId)
            )
          )) - 1
        )
      : 0;
  const defaults: CreateSessionDefaults = template
    ? {
        title: source?.title ?? `${group?.name ?? template.title} Pickle`,
        venue: template.venueName,
        venueId: template.venueId ?? undefined,
        venueAddress: template.venueAddress ?? undefined,
        capacity: template.capacity,
        courts: template.courtCount,
        start: time(template.startsAt),
        end: time(template.endsAt),
        cost:
          template.estimatedCostCents == null
            ? undefined
            : template.estimatedCostCents / 100,
        accentColor: template.accentColor,
        visibility: template.visibility,
        requiresApproval: template.requiresApproval,
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
        venue: selectedCourt?.name,
        venueId: selectedCourt?.id,
        venueAddress: selectedCourt?.address,
      };
  return (
    <div className="create-game-page w-full">
      <div className="create-game-mobile-header -mx-4 mb-6 flex h-14 items-center gap-1 border-b border-line px-1 sm:-mx-8 sm:px-5 lg:hidden">
        <Link
          href={user ? "/home" : "/"}
          aria-label={user ? "Back to Home" : "Back to Relay"}
          className="pressable grid h-11 w-11 place-items-center rounded-lg text-muted hover:bg-surface-strong hover:text-ink"
        >
          <ArrowLeft aria-hidden size={18} />
        </Link>
        <p className="text-sm font-semibold text-ink">
          {source
            ? "Play again"
            : group
              ? `Game for ${group.name}`
              : "Create a game"}
        </p>
      </div>
      <Link
        href={user ? "/home" : "/"}
        className="compact-sidebar-back pressable mb-5 hidden min-h-9 items-center gap-2 rounded-md px-2 text-[13px] font-semibold text-muted hover:bg-surface-strong hover:text-ink lg:inline-flex"
      >
        <ArrowLeft aria-hidden size={15} />
        {user ? "Back to Home" : "Back to Relay"}
      </Link>
      <header className="mb-10 hidden border-b border-line pb-7 lg:block">
        <h1 className="app-title">
          {source
            ? "Play again"
            : group
              ? `Game for ${group.name}`
              : "Create a game"}
        </h1>
      </header>
      <div className="mx-auto mb-7 flex w-full max-w-2xl items-center justify-between gap-4 border-y border-line py-3 text-sm">
        <p className="text-muted">Already at the courts?</p>
        <Link
          href="/play"
          className="pressable inline-flex min-h-9 items-center gap-1.5 font-semibold text-primary"
        >
          <Lightning aria-hidden size={16} /> Start Quick Play
        </Link>
      </div>
      <CreateSessionForm
        defaults={defaults}
        now={new Date().toISOString()}
        courts={courts}
        isAuthenticated={Boolean(user)}
        resumeAnonymousDraft={params.resume === "draft"}
      />
    </div>
  );
}
