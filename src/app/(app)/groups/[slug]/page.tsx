import { CalendarPlus, CaretRight, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Avatar, AvatarStack } from "@/components/shared/avatar-stack";
import { ButtonLink } from "@/components/ui/button";
import { db } from "@/db/client";
import { groupMembers, groups, profiles, sessions } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { AddGroupMemberForm } from "@/features/groups/add-member-form";
import { getSessionMemory } from "@/features/memories/queries";
import { profileAvatarUrl } from "@/features/players/avatar";
import { sessionAccentStyle } from "@/features/sessions/accent";
import { formatSessionDate, formatSessionTime } from "@/features/sessions/format";

export default async function GroupPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser();
  const group = await db.query.groups.findFirst({ where: eq(groups.slug, (await params).slug) });
  if (!group) notFound();
  const membership = await db.query.groupMembers.findFirst({
    where: and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, user.id)),
  });
  if (!membership) notFound();
  const [members, groupSessions] = await Promise.all([
    db
      .select({ member: groupMembers, profile: profiles })
      .from(groupMembers)
      .innerJoin(profiles, eq(groupMembers.userId, profiles.userId))
      .where(eq(groupMembers.groupId, group.id))
      .orderBy(asc(groupMembers.joinedAt)),
    db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.groupId, group.id),
          inArray(
            sessions.status,
            membership.role === "owner"
              ? ["draft", "published", "live", "completed"]
              : ["published", "live", "completed"],
          ),
        ),
      )
      .orderBy(desc(sessions.startsAt)),
  ]);
  const now = new Date();
  const upcoming = groupSessions
    .filter((session) => session.status === "live" || (session.startsAt >= now && session.status !== "completed"))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const past = groupSessions.filter((session) => session.status === "completed");
  const memories = await Promise.all(
    past.slice(0, 6).map(async (session) => ({ session, memory: await getSessionMemory(session.id) })),
  );
  const names = members.map(({ profile }) => profile.name);
  const avatars = members.map(({ profile }) => profileAvatarUrl(profile.avatarPath));

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-col gap-5 border-b border-line pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Group</p>
          <h1 className="mt-1 app-title">{group.name}</h1>
          {group.description ? (
            <p className="mt-3 max-w-xl leading-7 text-muted">{group.description}</p>
          ) : (
            <p className="mt-2 text-muted">A regular crew for faster game nights.</p>
          )}
        </div>
        <ButtonLink href={`/games/new?group=${group.id}`}>
          <CalendarPlus aria-hidden size={17} />
          Start a game
        </ButtonLink>
      </header>

      <div className="grid gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-10">
          <section aria-labelledby="upcoming-group-games">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h2 id="upcoming-group-games" className="text-lg font-bold">
                  Upcoming games
                </h2>
                <p className="mt-1 text-sm text-muted">Plans attached to this crew.</p>
              </div>
            </div>
            {upcoming.length ? (
              <div className="divide-y divide-line border-y border-line">
                {upcoming.map((session) => (
                  <Link
                    key={session.id}
                    href={`/games/${session.id}`}
                    style={sessionAccentStyle(session.accentColor)}
                    className="collection-row group flex min-h-20 items-center gap-3 py-4 sm:px-2"
                  >
                    <span className="h-8 w-1 rounded-full bg-primary" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">{session.title}</h3>
                      <p className="mt-1 truncate text-sm text-muted">
                        {formatSessionDate(session.startsAt)} · {formatSessionTime(session.startsAt, session.endsAt)} ·{" "}
                        {session.venueName}
                      </p>
                    </div>
                    <CaretRight
                      aria-hidden
                      className="text-muted transition-transform group-hover:translate-x-0.5"
                      size={16}
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="border-y border-line py-7">
                <p className="font-semibold">Nothing scheduled</p>
                <p className="mt-1 text-sm text-muted">Start a game and Relay will invite the group.</p>
                <ButtonLink href={`/games/new?group=${group.id}`} variant="secondary" className="mt-5">
                  Start a game
                </ButtonLink>
              </div>
            )}
          </section>

          <section aria-labelledby="group-memories">
            <h2 id="group-memories" className="text-lg font-bold">
              Shared memories
            </h2>
            <p className="mt-1 text-sm text-muted">Completed sessions stay with the crew.</p>
            {memories.length ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {memories.map(({ session, memory }) => {
                  const cover = memory?.media.find((item) => item.url);
                  return (
                    <Link
                      key={session.id}
                      href={`/s/${session.slug}`}
                      style={sessionAccentStyle(session.accentColor)}
                      className="group overflow-hidden rounded-xl border border-line bg-surface hover:border-primary/40"
                    >
                      {cover?.url ? (
                        <Image
                          src={cover.url}
                          alt={cover.altText ?? `Photo from ${session.title}`}
                          width={560}
                          height={320}
                          className="aspect-[16/9] w-full object-cover"
                        />
                      ) : (
                        <div className="aspect-[16/9] bg-[var(--session-cover)] p-5 text-white">
                          <p className="sport-label text-white/65">{formatSessionDate(session.startsAt)}</p>
                          <p className="mt-4 text-xl font-bold">{session.title}</p>
                        </div>
                      )}
                      <div className="p-4">
                        <p className="font-semibold">{session.title}</p>
                        <p className="mt-1 text-sm text-muted">{session.venueName}</p>
                        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                          Open memory <CaretRight aria-hidden size={14} />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 border-y border-line py-7">
                <p className="font-semibold">No shared memories yet</p>
                <p className="mt-1 text-sm text-muted">
                  Photos and results appear after the group’s first completed game.
                </p>
              </div>
            )}
          </section>
        </div>

        <aside className="self-start lg:sticky lg:top-6">
          <section aria-labelledby="group-members">
            <div className="flex items-end justify-between">
              <div>
                <h2 id="group-members" className="text-lg font-bold">
                  Members
                </h2>
                <p className="mt-1 text-sm text-muted">{members.length} in this crew</p>
              </div>
              <AvatarStack names={names.slice(0, 3)} imageUrls={avatars.slice(0, 3)} total={members.length} />
            </div>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {members.map(({ member, profile }, index) => (
                <li key={member.userId} className="flex min-h-14 items-center gap-3 py-2">
                  <Avatar name={profile.name} imageUrl={profileAvatarUrl(profile.avatarPath)} index={index} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{profile.name}</span>
                  <span className="text-xs capitalize text-muted">{member.role}</span>
                </li>
              ))}
            </ul>
            {membership.role === "owner" ? (
              <div className="mt-5">
                <div className="flex items-center gap-2">
                  <UsersThree aria-hidden size={17} className="text-primary" />
                  <h3 className="text-sm font-semibold">Add a Relay player</h3>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Use their exact username. Guests can still join each game by link.
                </p>
                <AddGroupMemberForm groupId={group.id} />
              </div>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
