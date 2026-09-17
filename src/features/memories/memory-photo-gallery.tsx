"use client";

import {
  ArrowsOutSimple,
  CaretLeft,
  CaretRight,
  X,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

import styles from "./story-workspace.module.css";

type GalleryPhoto = {
  id: string;
  url: string;
  alt: string;
  caption?: string | null;
};

export function MemoryPhotoGallery({ photos }: { photos: GalleryPhoto[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const index = Math.max(
    0,
    photos.findIndex((photo) => photo.id === selectedId)
  );
  const active = photos[index];

  function move(direction: number) {
    if (!photos.length) return;
    setSelectedId(
      photos[(index + direction + photos.length) % photos.length].id
    );
  }

  return (
    <>
      <div
        className={photos.length === 1 ? styles.singlePhoto : styles.photoGrid}
      >
        {photos.map((photo, position) => (
          <figure key={photo.id} className="min-w-0">
            <button
              type="button"
              aria-label={`Open photo ${position + 1}: ${photo.alt}`}
              aria-haspopup="dialog"
              className="relative block w-full overflow-hidden rounded-[10px] text-left outline-none focus-visible:ring-3 focus-visible:ring-primary/40"
              onClick={(event) => {
                trigger.current = event.currentTarget;
                setSelectedId(photo.id);
                setFailedUrl(null);
                dialog.current?.showModal();
              }}
            >
              <Image
                src={photo.url}
                alt={photo.alt}
                width={640}
                height={640}
                sizes="(max-width: 640px) 100vw, 320px"
                className="aspect-square w-full object-cover"
              />
              <span
                aria-hidden
                className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-md bg-black/60 text-white"
              >
                <ArrowsOutSimple size={18} />
              </span>
            </button>
            {photo.caption ? (
              <figcaption className="mt-2 break-words text-sm leading-5 text-muted">
                {photo.caption}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>
      <Dialog
        ref={dialog}
        variant="fullscreen"
        aria-label="Game photo viewer"
        onClose={() => {
          setSelectedId(null);
          touchStart.current = null;
          trigger.current?.focus();
        }}
        onKeyDown={(event) => {
          if (
            photos.length > 1 &&
            (event.key === "ArrowLeft" || event.key === "ArrowRight")
          ) {
            event.preventDefault();
            move(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
      >
        {selectedId !== null && active ? (
          <div className={styles.photoViewer}>
            <header className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Photos from the game</h2>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                aria-label="Close photo viewer"
                onClick={() => dialog.current?.close()}
              >
                <X aria-hidden size={20} />
              </Button>
            </header>
            <div
              className="relative min-h-0 min-w-0"
              onTouchStart={(event) => {
                const touch =
                  event.touches.length === 1 ? event.touches[0] : null;
                touchStart.current = touch
                  ? { x: touch.clientX, y: touch.clientY }
                  : null;
              }}
              onTouchCancel={() => {
                touchStart.current = null;
              }}
              onTouchEnd={(event) => {
                const start = touchStart.current;
                const end = event.changedTouches[0];
                touchStart.current = null;
                if (!start || !end || event.touches.length || photos.length < 2)
                  return;
                const dx = end.clientX - start.x;
                const dy = end.clientY - start.y;
                if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.5)
                  move(dx > 0 ? -1 : 1);
              }}
            >
              {failedUrl === active.url ? (
                <p
                  role="status"
                  className="grid h-full place-items-center p-6 text-center text-sm text-muted"
                >
                  This photo could not load. Close the viewer and refresh the
                  page to try again.
                </p>
              ) : (
                <Image
                  key={active.url}
                  src={active.url}
                  alt={active.alt}
                  fill
                  sizes="100vw"
                  loading="eager"
                  className="object-contain"
                  onError={() => setFailedUrl(active.url)}
                />
              )}
            </div>
            <footer className="min-w-0">
              {active.caption ? (
                <p className="mb-3 max-h-[20svh] overflow-y-auto break-words text-center text-sm leading-6">
                  {active.caption}
                </p>
              ) : null}
              <div className="flex items-center justify-center gap-5">
                {photos.length > 1 ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    aria-label="Previous photo"
                    onClick={() => move(-1)}
                  >
                    <CaretLeft aria-hidden size={20} />
                  </Button>
                ) : null}
                <p
                  aria-live="polite"
                  aria-atomic="true"
                  className="min-w-16 text-center text-sm tabular-nums"
                >
                  {index + 1} / {photos.length}
                </p>
                {photos.length > 1 ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    aria-label="Next photo"
                    onClick={() => move(1)}
                  >
                    <CaretRight aria-hidden size={20} />
                  </Button>
                ) : null}
              </div>
            </footer>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
