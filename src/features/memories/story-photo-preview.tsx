"use client";

import Image from "next/image";
import { useState } from "react";
import type { StoryPhotoCrop } from "./story-collage";

export function StoryPhotoPreview({
  src,
  crop,
}: {
  src: string;
  crop: StoryPhotoCrop;
}) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <div className="grid h-full place-items-center bg-surface-strong p-2 text-center text-xs text-ink">
        Photo unavailable. Choose another in Photos.
      </div>
    );
  return (
    <Image
      src={src}
      alt=""
      fill
      sizes="(max-width: 640px) 90vw, 430px"
      unoptimized
      onError={() => setFailed(true)}
      className="object-cover"
      style={{
        objectPosition: `${crop.x}% ${crop.y}%`,
        transform: `scale(${crop.zoom})`,
        transformOrigin: `${crop.x}% ${crop.y}%`,
      }}
    />
  );
}
