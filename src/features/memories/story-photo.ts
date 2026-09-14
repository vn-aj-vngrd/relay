import { type StoryPhotoCrop, storyPhotoGeometry } from "./story-collage";
import type { StoryRegion } from "./story-scene";

export async function decodeStoryPhoto(source: string | Blob) {
  // Device files must not be fetched through their preview blob: URL:
  // Relay intentionally allows blob: images, not blob: network connections.
  let blob: Blob;
  if (typeof source === "string") {
    const response = await fetch(source);
    if (!response.ok) throw new Error("Selected photo unavailable");
    blob = await response.blob();
  } else {
    blob = source;
  }
  return createImageBitmap(blob);
}

export async function drawStoryPhoto(
  context: CanvasRenderingContext2D,
  source: string | Blob,
  width: number,
  height: number,
  photoPosition: number,
  bounds?: StoryRegion,
  crop?: StoryPhotoCrop
) {
  const bitmap = await decodeStoryPhoto(source);
  try {
    const box = bounds ?? { x: 0, y: 0, width, height };
    const geometry = storyPhotoGeometry(
      bitmap.width,
      bitmap.height,
      box,
      crop ?? { x: photoPosition, y: photoPosition, zoom: 1 }
    );
    if (bounds) {
      context.save();
      context.beginPath();
      context.rect(box.x, box.y, box.width, box.height);
      context.clip();
    }
    try {
      context.drawImage(
        bitmap,
        geometry.x,
        geometry.y,
        geometry.width,
        geometry.height
      );
    } finally {
      if (bounds) context.restore();
    }
  } finally {
    bitmap.close();
  }
}
