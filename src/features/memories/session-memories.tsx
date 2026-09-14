"use client";

import { useState } from "react";

import { ButtonLink } from "@/components/ui/button";
import { TabChipRail } from "@/components/ui/tab-chip-rail";
import {
  type GamePhotoAllowance,
  mediaPolicy,
} from "@/features/billing/domain";
import { sessionAccent } from "@/features/sessions/accent";
import {
  formatSessionDate,
  formatSessionTime,
} from "@/features/sessions/format";
import {
  type PlayerPriceInput,
  playerPriceText,
} from "@/features/sessions/player-price";
import { MemoryPhotoForm } from "./memory-photo-form";
import { MemoryPhotoGallery } from "./memory-photo-gallery";
import type { SessionRecap as SessionRecapData } from "./recap";
import { RecapShareCard } from "./recap-share-card";
import styles from "./story-workspace.module.css";

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
  uploadsDisabled = false,
  viewerPlayerId,
  goingCount,
  hostName,
  storyAsOf,
  joinUrl,
  price,
  photoAllowance,
  canManageStorage = false,
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
  uploadsDisabled?: boolean;
  viewerPlayerId?: string | null;
  goingCount: number;
  hostName: string;
  storyAsOf: string;
  joinUrl?: string | null;
  price?: PlayerPriceInput;
  photoAllowance?: GamePhotoAllowance;
  canManageStorage?: boolean;
}) {
  const photos = (memory?.media ?? []).flatMap((item) =>
    item.url
      ? [
          {
            id: item.id,
            url: item.url,
            alt: item.altText ?? `Photo from ${session.title}`,
            caption: item.caption,
          },
        ]
      : []
  );
  const date = `${formatSessionDate(session.startsAt, session.timezone)} · ${formatSessionTime(session.startsAt, session.endsAt, session.timezone)}`;
  const accent = sessionAccent(session.accentColor);
  const completed = session.status === "completed";
  const showPhotos = completed || photos.length > 0;
  const [view, setView] = useState<"make" | "photos">("make");
  const activeView = showPhotos ? view : "make";
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
    <div
      className={`${styles.storySurface} flex min-w-0 flex-col gap-4 sm:gap-6`}
    >
      {showPhotos ? (
        <TabChipRail
          label="Story views"
          items={[
            { value: "make", label: "Make" },
            { value: "photos", label: "Photos", count: photos.length },
          ]}
          value={activeView}
          onChange={setView}
          variant="chip"
        />
      ) : null}

      {/* Keep the local photo and edits when browsing game photos. */}
      <section aria-label="Create a story" hidden={activeView !== "make"}>
        <RecapShareCard
          sessionId={session.id}
          joinUrl={joinUrl}
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
            priceLabel: playerPriceText(price ?? session),
            goingCount,
            capacity: session.capacity,
            requiresApproval: session.requiresApproval,
            waitlistOpen: goingCount >= session.capacity,
          }}
          courtCount={session.courtCount}
          storyAsOf={storyAsOf}
        />
      </section>

      {activeView === "photos" ? (
        <section
          aria-labelledby="memory-photos-title"
          className={styles.photosWorkspace}
        >
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id="memory-photos-title" className="text-xl font-bold">
                Photos from the game
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                Keep your game moments here, then use them in Make.
              </p>
            </div>
            {canManageStorage ? (
              <ButtonLink
                href="/settings/plan/media"
                variant="secondary"
                className="shrink-0"
              >
                Manage photos
              </ButtonLink>
            ) : null}
          </header>
          <div
            className={
              canContribute && !uploadsDisabled
                ? styles.photosWithUpload
                : styles.photosLayout
            }
          >
            {canContribute && !uploadsDisabled ? (
              <div className={styles.photoUpload}>
                <MemoryPhotoForm
                  sessionId={session.id}
                  allowance={photoAllowance}
                  canManageStorage={canManageStorage}
                />
              </div>
            ) : null}
            <div className={styles.photoGallery}>
              <h3 className="mb-3 text-sm font-semibold">
                {photoAllowance?.photosUsed ?? memory?.media.length ?? 0} /{" "}
                {photoAllowance?.photoLimit ?? mediaPolicy.memory.perGame} game
                photos
              </h3>
              {photos.length ? (
                <MemoryPhotoGallery photos={photos} />
              ) : (
                <div className="rounded-xl bg-surface-strong px-5 py-8">
                  <p className="text-sm font-semibold">
                    Your game album starts here
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    {canContribute && !uploadsDisabled
                      ? "No photos yet. Add the first moment from the game."
                      : "No photos have been added to this game yet."}
                  </p>
                </div>
              )}
              {canContribute && uploadsDisabled ? (
                <p className="mt-4 text-sm leading-6 text-muted">
                  The host has turned off participant photo uploads. Existing
                  photos remain available.
                </p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
