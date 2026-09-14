import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { defaultPhotoCrop, storyPhotoLimit } from "./story-collage";
import type { useStoryPhotos } from "./use-story-photos";

export function StoryPhotoEditor({
  selection,
  gamePhotos,
}: {
  selection: ReturnType<typeof useStoryPhotos>;
  gamePhotos: { id: string; url: string; alt: string }[];
}) {
  const input = useRef<HTMLInputElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = selection.photos.find((photo) => photo.id === activeId);
  return (
    <div className="mt-4 min-w-0">
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm font-semibold">
          {selection.photos.length
            ? `${selection.photos.length} / 4 photos in this story`
            : "Choose up to 4 moments"}
        </p>
        <Button
          type="button"
          variant="secondary"
          disabled={
            selection.adding || selection.photos.length >= storyPhotoLimit
          }
          onClick={() => input.current?.click()}
        >
          {selection.adding ? "Adding photos…" : "Add photos"}
        </Button>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted">
        Device photos stay in your story. Your game album is unchanged.
      </p>
      <input
        ref={input}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        aria-label="Choose story photo file"
        className="sr-only"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          void selection.addFiles(files);
        }}
      />
      {selection.photos.length ? (
        <>
          <div
            className="mt-3 grid grid-cols-4 gap-2"
            role="group"
            aria-label="Selected story photos"
          >
            {selection.photos.map((photo, index) => (
              <button
                key={photo.id}
                type="button"
                aria-label={`Edit photo ${index + 1}: ${photo.label}`}
                aria-pressed={photo.id === activeId}
                onClick={() => setActiveId(photo.id)}
                className={`relative aspect-square overflow-hidden rounded-lg border-2 outline-none focus-visible:ring-3 focus-visible:ring-primary/25 ${photo.id === activeId ? "border-primary" : "border-line"}`}
              >
                <Image
                  src={photo.imageUrl}
                  alt=""
                  fill
                  unoptimized
                  sizes="100px"
                  className="object-cover"
                />
                <span className="absolute bottom-1 left-1 grid h-5 w-5 place-items-center rounded-full bg-ink text-xs font-bold text-surface">
                  {index + 1}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">
            Tap a photo to crop, move or remove it. The first photo leads your
            collage.
          </p>
        </>
      ) : null}
      {active ? (
        <fieldset className="mt-4 min-w-0 rounded-lg bg-surface-strong p-3">
          <legend className="sr-only">Edit selected photo</legend>
          <p className="truncate text-sm font-semibold">
            Photo {selection.photos.indexOf(active) + 1} · {active.label}
          </p>
          <div className="mt-2 grid gap-x-4 sm:grid-cols-2">
            {(
              [
                {
                  key: "x",
                  label: "Horizontal crop",
                  min: 0,
                  max: 100,
                  step: 1,
                },
                { key: "y", label: "Vertical crop", min: 0, max: 100, step: 1 },
                {
                  key: "zoom",
                  label: "Photo zoom",
                  min: 1,
                  max: 3,
                  step: 0.05,
                },
              ] as const
            ).map(({ key, label, ...range }) => (
              <label key={key} className="text-xs font-semibold">
                {label}
                <input
                  type="range"
                  {...range}
                  value={active.crop[key]}
                  onChange={(event) =>
                    selection.crop(active.id, {
                      ...active.crop,
                      [key]: Number(event.target.value),
                    })
                  }
                  className="block min-h-11 w-full accent-primary"
                />
              </label>
            ))}
          </div>
          <p className="text-xs text-muted">
            Zoom in to move a photo that already fits its frame.
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            <Button
              type="button"
              variant="quiet"
              onClick={() => selection.crop(active.id, { ...defaultPhotoCrop })}
            >
              Reset crop
            </Button>
            <Button
              type="button"
              variant="quiet"
              disabled={selection.photos.indexOf(active) === 0}
              onClick={() => selection.move(active.id, -1)}
            >
              Move earlier
            </Button>
            <Button
              type="button"
              variant="quiet"
              disabled={
                selection.photos.indexOf(active) === selection.photos.length - 1
              }
              onClick={() => selection.move(active.id, 1)}
            >
              Move later
            </Button>
            <Button
              type="button"
              variant="quiet"
              onClick={() => {
                selection.remove(active.id);
                setActiveId(null);
              }}
            >
              Remove photo
            </Button>
          </div>
        </fieldset>
      ) : null}
      {gamePhotos.length ? (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold">Or use game photos</p>
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            role="group"
            aria-label="Game photos for your memory"
          >
            {gamePhotos.map((photo) => {
              const index = selection.photos.findIndex(
                (item) => item.id === `photo:${photo.id}`
              );
              return (
                <button
                  key={photo.id}
                  type="button"
                  aria-label={`Use ${photo.alt}`}
                  aria-pressed={index >= 0}
                  disabled={
                    selection.adding ||
                    (index < 0 && selection.photos.length >= storyPhotoLimit)
                  }
                  onClick={() => selection.toggle(photo)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 outline-none focus-visible:ring-3 focus-visible:ring-primary/25 disabled:opacity-40 ${index >= 0 ? "border-primary" : "border-line"}`}
                >
                  <Image
                    src={photo.url}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                  {index >= 0 ? (
                    <span className="absolute bottom-1 left-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-xs font-bold text-white">
                      {index + 1}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      {selection.message ? (
        <p role="status" className="mt-3 text-xs leading-5 text-muted">
          {selection.message}
        </p>
      ) : null}
    </div>
  );
}
