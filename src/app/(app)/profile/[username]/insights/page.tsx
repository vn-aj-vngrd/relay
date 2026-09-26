export const metadata = { title: "Your game insights" };

import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/shared/content-state";
import { FocusedMobileHeader } from "@/components/shared/focused-mobile-header";
import { ButtonLink } from "@/components/ui/button";
import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { getPlayerInsights } from "@/features/players/insights";
import { formatSessionDate } from "@/features/sessions/format";

export default async function PlayerInsightsPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await requireUser(`/profile/${username}/insights`);
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.username, username),
  });
  if (!profile || profile.userId !== user.id) notFound();

  const insights = await getPlayerInsights(user.id);

  return (
    <div className="player-insights-page mx-auto w-full max-w-6xl">
      <FocusedMobileHeader
        title="Your game insights"
        isAuthenticated
        backHref={`/profile/${profile.username}`}
        backLabel="Back to profile"
        heading
      />
      <header className="hidden border-b border-line pb-6 lg:block">
        <h1 className="app-title">Your game insights</h1>
        <p className="mt-2 text-sm text-muted">
          A personal look at your hosted games and time on court.
        </p>
      </header>

      <section aria-labelledby="record-title" className="pb-8 pt-2 lg:py-10">
        <h2 id="record-title" className="text-lg font-semibold">
          Match record
        </h2>
        <div className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-5 sm:gap-x-12">
          <div className="flex items-end gap-5 sm:gap-8">
            <div>
              <p className="text-xs font-medium text-muted">Wins</p>
              <strong className="score mt-1 block text-5xl font-semibold text-primary sm:text-6xl">
                {insights.wins}
              </strong>
            </div>
            <span aria-hidden className="pb-1 text-3xl text-line sm:text-4xl">
              /
            </span>
            <div>
              <p className="text-xs font-medium text-muted">Losses</p>
              <strong className="score mt-1 block text-5xl font-semibold sm:text-6xl">
                {insights.losses}
              </strong>
            </div>
          </div>
          <div className="border-l border-line pb-1 pl-6">
            <p className="score text-2xl font-semibold">{insights.winRate}%</p>
            <p className="mt-1 text-xs text-muted">Win rate</p>
          </div>
        </div>
        <div
          aria-hidden
          className="mt-6 flex h-1.5 w-full max-w-xl bg-surface-strong"
        >
          {insights.wins > 0 ? (
            <span
              className="bg-primary"
              style={{
                width: `${(insights.wins / insights.matchesPlayed) * 100}%`,
              }}
            />
          ) : null}
        </div>
        <p className="mt-3 text-xs leading-5 text-muted">
          {insights.matchesPlayed} recorded{" "}
          {insights.matchesPlayed === 1 ? "match" : "matches"} · For fun, not a
          competitive rating.
        </p>
      </section>

      <div className="grid border-t border-line md:grid-cols-2">
        <div className="py-8 md:pr-10">
          <section aria-labelledby="games-title">
            <h2 id="games-title" className="text-lg font-semibold">
              Games and play
            </h2>
            <dl className="mt-4 divide-y divide-line border-y border-line">
              {[
                ["Games hosted", insights.hostedGames],
                ["Games played", insights.gamesPlayed],
                ["Matches played", insights.matchesPlayed],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <dt className="text-sm text-muted">{label}</dt>
                  <dd className="score text-lg font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs leading-5 text-muted">
              Hosted games are completed games you created. Played games have at
              least one recorded match.
            </p>
          </section>

          <section aria-labelledby="points-title" className="mt-8">
            <h2 id="points-title" className="text-lg font-semibold">
              Points
            </h2>
            <dl className="mt-4 grid grid-cols-2 border-y border-line py-4">
              <div>
                <dt className="text-xs text-muted">Scored</dt>
                <dd className="score mt-1 text-2xl font-semibold">
                  {insights.pointsFor}
                </dd>
              </div>
              <div className="border-l border-line pl-6">
                <dt className="text-xs text-muted">Conceded</dt>
                <dd className="score mt-1 text-2xl font-semibold">
                  {insights.pointsAgainst}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted">
              Your team&apos;s scores in completed matches.
            </p>
          </section>
        </div>

        <section
          aria-labelledby="recent-title"
          className="border-t border-line py-8 md:border-t-0 md:border-l md:pl-10"
        >
          <h2 id="recent-title" className="text-lg font-semibold">
            Recent games
          </h2>
          {insights.recentGames.length ? (
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {insights.recentGames.map((game) => (
                <li key={game.id}>
                  <Link
                    href={`/games/${game.id}/play`}
                    className="pressable flex min-h-16 items-center gap-4 py-3 hover:text-primary"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {game.title}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {formatSessionDate(game.startsAt, game.timezone)} ·{" "}
                        {game.matches}{" "}
                        {game.matches === 1 ? "match" : "matches"}
                      </p>
                    </div>
                    <span
                      className="score shrink-0 text-sm font-semibold"
                      aria-label={`${game.wins} wins, ${game.losses} losses`}
                    >
                      {game.wins}–{game.losses}
                    </span>
                    <ArrowUpRight
                      aria-hidden
                      size={16}
                      className="shrink-0 text-muted"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon="results"
              title="No recorded matches yet"
              description="Your games and scores will appear here after a match is completed."
              compact
              className="mt-4 border-y border-line"
            >
              <ButtonLink href="/games" variant="secondary">
                View your games
              </ButtonLink>
            </EmptyState>
          )}
        </section>
      </div>
    </div>
  );
}
