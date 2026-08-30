import {
  CaretRight,
  ChatText,
  Hand,
  Lifebuoy,
  MapPin,
  PencilSimple,
  ShieldCheck,
  SignOut,
  SlidersHorizontal,
  TennisBall,
} from "@phosphor-icons/react/dist/ssr";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Avatar } from "@/components/shared/avatar-stack";
import { ButtonLink } from "@/components/ui/button";
import { PendingSubmit } from "@/components/ui/pending-submit";
import { db } from "@/db/client";
import { matches, matchPlayers, profiles, sessionPlayers } from "@/db/schema";
import { isAdminEmail } from "@/features/admin/auth";
import { signOut } from "@/features/auth/actions";
import { getCurrentUser } from "@/features/auth/session";
import { profileAvatarUrl } from "@/features/players/avatar";
import { playingExperienceLabel } from "@/features/players/playing-experience";

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const [profile, viewer] = await Promise.all([
    db.query.profiles.findFirst({ where: eq(profiles.username, username) }),
    getCurrentUser(),
  ]);
  if (!profile) notFound();
  const [sessionCount, participation] = await Promise.all([
    db.$count(sessionPlayers, and(eq(sessionPlayers.userId, profile.userId), eq(sessionPlayers.rsvp, "going"))),
    db
      .select({ match: matches, player: matchPlayers })
      .from(matchPlayers)
      .innerJoin(matches, eq(matchPlayers.matchId, matches.id))
      .innerJoin(sessionPlayers, eq(matchPlayers.sessionPlayerId, sessionPlayers.id))
      .where(and(eq(sessionPlayers.userId, profile.userId), eq(matches.status, "completed"))),
  ]);
  const wins = participation.filter(({ match, player }) => match.winningTeam === player.team).length;
  const ownProfile = viewer?.id === profile.userId;
  const imageUrl = profileAvatarUrl(profile.avatarPath);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="flex items-start gap-4 pb-7">
        <Avatar name={profile.name} imageUrl={imageUrl} size="xl" />
        <div className="min-w-0 flex-1 pt-1">
          <div className="flex items-center gap-2.5">
            <h1 className="min-w-0 flex-1 truncate text-[1.75rem] font-[680] tracking-[-0.025em]">{profile.name}</h1>
            {ownProfile ? (
              <ButtonLink
                href={`/profile/${profile.username}/edit`}
                variant="secondary"
                aria-label="Edit profile"
                className="shrink-0 px-2.5 sm:px-3"
              >
                <PencilSimple aria-hidden size={15} />
                <span className="hidden sm:inline">Edit profile</span>
              </ButtonLink>
            ) : null}
          </div>
          <p className="mt-0.5 text-sm text-muted">@{profile.username}</p>
          {profile.city || profile.dominantHand || profile.skillLevel ? (
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
              {profile.city ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin aria-hidden size={15} />
                  {profile.city}
                </span>
              ) : null}
              {profile.dominantHand ? (
                <span className="inline-flex items-center gap-1.5">
                  <Hand aria-hidden size={15} />
                  {profile.dominantHand === "both"
                    ? "Uses both hands"
                    : `${profile.dominantHand.charAt(0).toUpperCase()}${profile.dominantHand.slice(1)}-handed`}
                </span>
              ) : null}
              {profile.skillLevel ? (
                <span className="inline-flex items-center gap-1.5">
                  <TennisBall aria-hidden size={15} />
                  {playingExperienceLabel(profile.skillLevel)}
                </span>
              ) : null}
            </div>
          ) : null}
          {profile.bio ? <p className="mt-3 max-w-xl text-sm leading-6 text-ink/75">{profile.bio}</p> : null}
        </div>
      </header>

      <section aria-label="Playing history" className="grid grid-cols-3 border-y border-line py-5 text-center">
        <div>
          <strong className="score block text-2xl">{sessionCount}</strong>
          <span className="text-xs font-medium text-muted sm:text-sm">Sessions</span>
        </div>
        <div className="border-x border-line">
          <strong className="score block text-2xl">{participation.length}</strong>
          <span className="text-xs font-medium text-muted sm:text-sm">Matches</span>
        </div>
        <div>
          <strong className="score block text-2xl">{wins}</strong>
          <span className="text-xs font-medium text-muted sm:text-sm">Wins</span>
        </div>
      </section>
      <p className="pt-3 text-center text-xs leading-5 text-muted">For fun, not a competitive rating.</p>

      {ownProfile ? (
        <section aria-labelledby="account-title" className="pb-6 pt-10">
          <h2 id="account-title" className="mb-2 text-sm font-semibold">
            Account
          </h2>
          <div className="divide-y divide-line border-y border-line">
            <Link href="/preferences" className="flex min-h-12 items-center gap-3 py-2 text-sm">
              <SlidersHorizontal size={18} className="text-muted" />
              <span className="flex-1">Preferences</span>
              <CaretRight size={15} className="text-muted" />
            </Link>
            <Link href="/help" className="flex min-h-12 items-center gap-3 py-2 text-sm">
              <Lifebuoy size={18} className="text-muted" />
              <span className="flex-1">Help Center</span>
              <CaretRight size={15} className="text-muted" />
            </Link>
            <Link href="/feedback" className="flex min-h-12 items-center gap-3 py-2 text-sm">
              <ChatText size={18} className="text-muted" />
              <span className="flex-1">Send feedback</span>
              <CaretRight size={15} className="text-muted" />
            </Link>
            {isAdminEmail(viewer?.email) ? (
              <Link href="/admin" className="flex min-h-12 items-center gap-3 py-2 text-sm">
                <ShieldCheck size={18} className="text-muted" />
                <span className="flex-1">Admin console</span>
                <CaretRight size={15} className="text-muted" />
              </Link>
            ) : null}
            <form action={signOut}>
              <PendingSubmit
                pendingLabel="Signing out…"
                className="flex min-h-12 w-full items-center gap-3 py-2 text-sm"
              >
                <SignOut size={18} className="text-muted" />
                Sign out
              </PendingSubmit>
            </form>
          </div>
        </section>
      ) : null}
    </div>
  );
}
