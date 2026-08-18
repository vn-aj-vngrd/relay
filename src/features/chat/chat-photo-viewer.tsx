"use client";

import { ArrowsOutSimple, X } from "@phosphor-icons/react";
import Image from "next/image";
import { useRef } from "react";

export function ChatPhotoViewer({ src, alt, sender }: { src: string; alt: string; sender: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label={`Open photo from ${sender}`}
        className="group relative block max-w-80 overflow-hidden text-left"
      >
        <Image
          src={src}
          alt={alt}
          width={640}
          height={640}
          sizes="(min-width: 640px) 320px, 70vw"
          className="max-h-64 w-auto max-w-full object-contain"
        />
        <span
          aria-hidden
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-md bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <ArrowsOutSimple size={15} />
        </span>
      </button>
      <dialog
        ref={dialogRef}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        aria-label={`Photo from ${sender}`}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-6xl overflow-visible border-0 bg-transparent p-0 text-white backdrop:bg-black/75"
      >
        <div className="relative flex max-h-[calc(100dvh-2rem)] items-center justify-center">
          <Image
            src={src}
            alt={alt}
            width={1600}
            height={1200}
            sizes="100vw"
            className="max-h-[calc(100dvh-2rem)] w-auto max-w-full rounded-lg object-contain"
          />
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close photo viewer"
            className="pressable absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-lg bg-black/70 text-white hover:bg-black"
          >
            <X size={18} />
          </button>
        </div>
      </dialog>
    </>
  );
}
