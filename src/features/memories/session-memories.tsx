"use client";

import Image from "next/image";
import { useState } from "react";

import { TabChipRail } from "@/components/ui/tab-chip-rail";
import { sessionAccent } from "@/features/sessions/accent";
import {
  formatSessionDateLong,
  formatSessionTime,
  peso,
} from "@/features/sessions/format";

import { MemoryPhotoForm } from "./memory-photo-form";
import type { SessionRecap as SessionRecapData } from "./recap";
import { RecapShareCard } from "./recap-share-card";

export type SessionMemoryData = {
  media: Array<{
    id: string;
    url: string | null;
    altText: string | null;
    caption: string | null;
  }>;
} | null;

export function SessionMemories({
  session,
  recap,
  memory,
  canContribute,
  viewerPlayerId,
  goingCount,
  hostName,
  storyAsOf,
}: {
  session: {
    id: string;
    title: string;
    venueName: string;
    startsAt: Date;
    endsAt: Date;
    timezone: string;
    accentColor: string;
    status: "draft" | "published" | "live" | "completed" | "cancelled";
    slug: string;
    visibility: "public" | "link" | "private";
    playerPriceCents: number | null;
    capacity: number;
    courtCount: number;
    requiresApproval: boolean;
  };
  recap: SessionRecapData;
  memory: SessionMemoryData;
  canContribute: boolean;
  viewerPlayerId?: string | null;
  goingCount: number;
  hostName: string;
  storyAsOf: string;
}) {
  const photos = (memory?.media ?? []).flatMap((item) =>
    item.url
      ? [
          {
            id: item.id,
            url: item.url,
            alt: item.altText ?? `Photo from ${session.title}`,
          },
        ]
      : []
  );
  const date = `${formatSessionDateLong(session.startsAt, session.timezone)} · ${formatSessionTime(session.startsAt, session.endsAt, session.timezone)}`;
  const accent = sessionAccent(session.accentColor);
  const completed = session.status === "completed";
  const showPhotos = completed || photos.length > 0;
  const [view, setView] = useState<"make" | "photos">("make");
  const activeView = showPhotos ? view : "make";
  const sharedUrl =
    session.visibility === "private"
      ? undefined
      : `/s/${session.slug}${completed || session.status === "live" ? "/story" : ""}`;

  if (session.status === "draft" || session.status === "cancelled") {
    return (
      <section
        className="border-y border-line py-8"
        aria-labelledby="story-state-title"
      >
        <h2 id="story-state-title" className="text-xl font-bold">
          {session.status === "draft"
            ? "Publish the game to make its invitation"
            : "This game was cancelled"}
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
          {session.status === "draft"
            ? "Story will use the published plan and sharing policy, so nobody receives an unfinished invitation."
            : "Story sharing is unavailable because this game did not continue."}
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-7">
      {showPhotos ? (
        <TabChipRail
          label="Story views"
          items={[
            { value: "make", label: "Make" },
            { value: "photos", label: "Photos", count: photos.length },
          ]}
          value={activeView}
          onChange={setView}
          variant="underline"
          className="border-b border-line"
        />
      ) : null}

      {activeView === "make" ? (
        <section aria-labelledby="share-memory-title">
          <div>
            <h2
              id="share-memory-title"
              className="text-2xl font-bold tracking-[-0.025em]"
            >
              {completed
                ? "Share the game"
                : session.status === "live"
                  ? "Share what’s happening"
                  : "Invite the crew"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              {completed
                ? "Choose one true highlight and make a portrait ready to share."
                : session.status === "live"
                  ? "Share safe game progress without provisional results or player details."
                  : "Turn the current plan, price, and roster availability into a clear invitation."}
            </p>
          </div>
          <div className="mt-6 border-y border-line py-7">
            <RecapShareCard
              sessionId={session.id}
              title={session.title}
              venue={session.venueName}
              date={date}
              accent={accent.solid}
              recap={recap}
              photos={photos}
              viewerPlayerId={viewerPlayerId}
              phase={session.status as "published" | "live" | "completed"}
              invitation={{
                hostName,
                priceLabel:
                  session.playerPriceCents === null
                    ? "Price not set"
                    : session.playerPriceCents === 0
                      ? "Free"
                      : (peso(session.playerPriceCents) ?? "Price not set"),
                goingCount,
                capacity: session.capacity,
                requiresApproval: session.requiresApproval,
                waitlistOpen: goingCount >= session.capacity,
              }}
              courtCount={session.courtCount}
              sharedUrl={sharedUrl}
              storyAsOf={storyAsOf}
            />
          </div>
        </section>
      ) : null}

      {activeView === "photos" ? (
        <section aria-labelledby="memory-photos-title">
          <div>
            <h2 id="memory-photos-title" className="text-xl font-bold">
              Photos from the game
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
              Keep the moments the scoreboard missed. Added photos also become
              available as story backgrounds.
            </p>
          </div>
          {photos.length ? (
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {memory?.media.map((item) =>
                item.url ? (
                  <figure key={item.id}>
                    <Image
                      src={item.url}
                      alt={item.altText ?? "Session photo"}
                      width={640}
                      height={640}
                      className="aspect-square w-full rounded-[10px] object-cover"
                    />
                    {item.caption ? (
                      <figcaption className="mt-1 text-xs text-muted">
                        {item.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                ) : null
              )}
            </div>
          ) : (
            <p className="mt-4 border-y border-line py-7 text-sm text-muted">
              No photos yet. Add the first moment from the game.
            </p>
          )}
          {canContribute ? (
            <div className="mt-5">
              <MemoryPhotoForm sessionId={session.id} />
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
