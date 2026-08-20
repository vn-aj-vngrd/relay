import { Heart } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";

import { PendingSubmit } from "@/components/ui/pending-submit";
import { sessionAccent } from "@/features/sessions/accent";
import { formatSessionDateLong } from "@/features/sessions/format";

import { addMemoryComment, toggleMemoryReaction } from "./actions";
import { MemoryPhotoForm } from "./memory-photo-form";
import type { SessionRecap as SessionRecapData } from "./recap";
import { RecapShareCard } from "./recap-share-card";

export type SessionMemoryData = {
  media: Array<{ id: string; url: string | null; altText: string | null; caption: string | null }>;
  comments: Array<{ comment: { id: string; body: string }; profile: { name: string } | null }>;
  reactionCount: number;
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
    item.url ? [{ id: item.id, url: item.url, alt: item.altText ?? `Photo from ${session.title}` }] : [],
  );
  const date = formatSessionDateLong(session.startsAt);
  const accent = sessionAccent(session.accentColor);
  const completed = session.status === "completed";

  if (!completed) {
    return (
      <section className="overflow-hidden rounded-xl bg-[var(--scoreboard-field)] text-white">
        <div className="border-b border-white/15 px-5 py-4 sm:px-8">
          <p className="sport-label text-[var(--scoreboard-line)]">After the last point</p>
        </div>
        <div className="px-5 py-8 sm:px-8 sm:py-10">
          <p className="text-sm font-medium text-white/65">
            {date} · {session.venueName}
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-[-0.035em] sm:text-5xl">
            This night is still being played.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
            When the host ends the session, Story will open share-ready highlights, crew photos, reactions, and notes
            from the night.
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
          <h2 id="share-memory-title" className="mt-2 text-2xl font-bold tracking-[-0.025em]">
            Share the night
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Choose one true highlight, pair it with a Relay color or crew photo, and make a portrait ready to share.
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
            Keep the moments the scoreboard missed. Added photos also become available as story backgrounds.
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
                  {item.caption ? <figcaption className="mt-1 text-xs text-muted">{item.caption}</figcaption> : null}
                </figure>
              ) : null,
            )}
          </div>
        ) : (
          <p className="mt-4 border-y border-line py-7 text-sm text-muted">
            No photos yet. Add the first moment from the night.
          </p>
        )}
        {canContribute ? (
          <div className="mt-5">
            <MemoryPhotoForm sessionId={session.id} />
          </div>
        ) : null}
      </section>

      <section aria-labelledby="memory-crew-title" className="pb-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 id="memory-crew-title" className="text-xl font-bold">
              From the crew
            </h2>
            <p className="mt-1 text-sm text-muted">Reactions and the details people want to remember.</p>
          </div>
          {canContribute ? (
            <form action={toggleMemoryReaction}>
              <input type="hidden" name="sessionId" value={session.id} />
              <PendingSubmit
                pendingLabel="Saving…"
                aria-label="React to this session"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold text-primary hover:bg-primary-soft"
              >
                <Heart aria-hidden size={18} />
                {memory?.reactionCount ?? 0}
              </PendingSubmit>
            </form>
          ) : (
            <span className="inline-flex items-center gap-1 text-sm text-muted">
              <Heart aria-hidden size={16} />
              {memory?.reactionCount ?? 0}
            </span>
          )}
        </div>
        {memory?.comments.length ? (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {memory.comments.map(({ comment, profile }) => (
              <li key={comment.id} className="py-4">
                <p className="text-sm font-semibold">{profile?.name ?? "Player"}</p>
                <p className="mt-1 break-words text-sm leading-6 text-muted">{comment.body}</p>
              </li>
            ))}
          </ul>
        ) : null}
        {canContribute ? (
          <form action={addMemoryComment} className="mt-4 flex gap-2">
            <input type="hidden" name="sessionId" value={session.id} />
            <label className="sr-only" htmlFor="memory-comment">
              Comment
            </label>
            <input
              id="memory-comment"
              name="body"
              required
              maxLength={500}
              autoComplete="off"
              placeholder="Add something worth remembering…"
              className="h-11 min-w-0 flex-1 rounded-[10px] border border-line bg-canvas px-3 placeholder:text-muted"
            />
            <PendingSubmit
              pendingLabel="Posting…"
              className="inline-flex min-h-9 items-center rounded-lg border border-line px-3 text-[13px] font-semibold"
            >
              Post
            </PendingSubmit>
          </form>
        ) : null}
      </section>
    </div>
  );
}
