"use client";

import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import type { GameCollectionItem } from "./game-collection-types";
import {
  type ActiveInviteResponse,
  GameInvitationCard,
} from "./game-invitation-card";
import { GameStatusChip } from "./game-status";
import { playerPriceText } from "./player-price";

export function invitationHistoryLabel(game: GameCollectionItem) {
  if (game.status === "cancelled") return null;
  if (
    game.viewerRsvp === "invited" &&
    (game.status === "completed" ||
      new Date(game.endsAt).getTime() <= Date.now())
  )
    return "Not answered";
  return (
    {
      invited: "Needs response",
      going: "Going",
      maybe: "Maybe",
      declined: "Can’t go",
      pending: "Awaiting approval",
      waitlisted: "Waitlisted",
    } as const
  )[game.viewerRsvp];
}

export function InvitationHistoryItems({
  items,
  mode,
  onResponded,
}: {
  items: GameCollectionItem[];
  mode: "list" | "grid";
  onResponded: (
    game: GameCollectionItem,
    response: ActiveInviteResponse
  ) => void;
}) {
  const compact = mode === "list";
  return (
    <div
      className={
        compact
          ? "divide-y divide-line border-y border-line"
          : "grid gap-3 min-[380px]:grid-cols-2 lg:grid-cols-3"
      }
    >
      {items.map((game) =>
        invitationHistoryLabel(game) === "Needs response" ? (
          <GameInvitationCard
            key={game.id}
            game={game}
            source="games"
            onResponded={onResponded}
            compact={compact}
          />
        ) : (
          <article
            key={game.id}
            className={
              compact
                ? "flex min-h-[4.5rem] flex-wrap items-center gap-4 py-3.5 sm:min-h-20 sm:px-3 sm:py-4"
                : "min-w-0 rounded-xl border border-line bg-surface p-4 sm:p-5"
            }
          >
            {compact ? (
              <time className="score hidden w-20 shrink-0 text-sm font-bold text-primary sm:block">
                {game.date}
              </time>
            ) : null}
            {!compact ? (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <time className="score text-xs font-bold text-primary">
                  {game.date}
                </time>
                <GameStatusChip status={game.status} endsAt={game.endsAt} />
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <h3
                  className={`min-w-0 font-[650] ${compact ? "truncate" : "break-words"}`}
                >
                  <Link href={game.href} className="hover:text-primary">
                    {game.title}
                  </Link>
                </h3>
                {compact ? (
                  <GameStatusChip status={game.status} endsAt={game.endsAt} />
                ) : null}
              </div>
              <p className="mt-1 text-sm text-muted">
                {game.date} · {game.time} · {game.venue}
              </p>
              <p className="mt-1 text-sm text-muted">
                Hosted by {game.hostName}
              </p>
              <p className="mt-1 text-sm text-muted">{playerPriceText(game)}</p>
            </div>
            <p
              className={
                compact
                  ? "text-sm font-semibold text-muted"
                  : "mt-4 text-sm font-semibold text-muted"
              }
            >
              {invitationHistoryLabel(game) ? (
                <span>{invitationHistoryLabel(game)}</span>
              ) : null}
            </p>
            {game.status === "completed" ? (
              <ButtonLink
                href={`${game.href}/play`}
                variant="secondary"
                className={compact ? "" : "mt-4"}
              >
                View recap
              </ButtonLink>
            ) : null}
          </article>
        )
      )}
    </div>
  );
}
