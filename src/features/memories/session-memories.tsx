import Image from "next/image";

import { sessionAccent } from "@/features/sessions/accent";
import { formatSessionDateLong } from "@/features/sessions/format";

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
}: {
  session: {
    id: string;
    title: string;
    venueName: string;
    startsAt: Date;
    accentColor: string;
    status: "draft" | "published" | "live" | "completed" | "cancelled";
  };
  recap: SessionRecapData;
  memory: SessionMemoryData;
  canContribute: boolean;
  viewerPlayerId?: string | null;
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
  const date = formatSessionDateLong(session.startsAt);
  const accent = sessionAccent(session.accentColor);
  const completed = session.status === "completed";

  if (!completed) {
    const inProgress = session.status === "live";
    return (
      <section className="overflow-hidden rounded-xl bg-[var(--scoreboard-field)] text-white">
        <div className="border-b border-white/15 px-5 py-4 sm:px-8">
          <p className="sport-label text-[var(--scoreboard-line)]">
            {inProgress ? "Game in progress" : "After the game"}
          </p>
        </div>
        <div className="px-5 py-8 sm:px-8 sm:py-10">
          <p className="text-sm font-medium text-white/65">
            {date} · {session.venueName}
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-[-0.035em] sm:text-5xl">
            {inProgress
              ? "This game is still being played."
              : "Story unlocks when the game ends."}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
            {inProgress
              ? "Final scores and game photos will appear here after the host ends the game."
              : "Once play is complete, this space will hold the final scores and game photos."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-12">
      <section aria-labelledby="share-memory-title">
        <div>
          <p className="text-sm font-semibold text-primary">Story maker</p>
          <h2
            id="share-memory-title"
            className="mt-2 text-2xl font-bold tracking-[-0.025em]"
          >
            Share the game
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Choose one true highlight, pair it with a Relay color or crew photo,
            and make a portrait ready to share.
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
          />
        </div>
      </section>

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
    </div>
  );
}
