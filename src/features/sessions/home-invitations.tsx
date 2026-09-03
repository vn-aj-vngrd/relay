"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import type { GameCollectionItem } from "./game-collection-types";
import {
  type ActiveInviteResponse,
  GameInvitationCard,
} from "./game-invitation-card";

function responseMessage(
  game: GameCollectionItem,
  response: ActiveInviteResponse
) {
  if (response === "declined") return `You declined ${game.title}.`;
  if (response === "pending")
    return `Your request to join ${game.title} was sent.`;
  if (response === "waitlisted")
    return `You joined the waitlist for ${game.title}.`;
  return `Your response to ${game.title} was saved.`;
}

export function HomeInvitations({
  initialItems,
}: {
  initialItems: GameCollectionItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [announcement, setAnnouncement] = useState("");
  const handleResponded = useCallback(
    (game: GameCollectionItem, response: ActiveInviteResponse) => {
      setItems((current) => current.filter((item) => item.id !== game.id));
      setAnnouncement(responseMessage(game, response));
    },
    []
  );

  return (
    <>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      {items.length ? (
        <section aria-labelledby="home-invites-heading">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 id="home-invites-heading" className="text-lg font-bold">
              Invites
            </h2>
            <Link
              href="/games?filter=invites"
              className="inline-flex min-h-11 items-center text-sm font-semibold text-primary"
            >
              Review all
            </Link>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {items.map((game) => (
              <GameInvitationCard
                key={game.id}
                game={game}
                source="home"
                onResponded={handleResponded}
              />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
