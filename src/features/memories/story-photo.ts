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
  bounds?: StoryRegion
) {
  const bitmap = await decodeStoryPhoto(source);
  try {
    const box = bounds ?? { x: 0, y: 0, width, height };
    const scale = Math.max(
      box.width / bitmap.width,
      box.height / bitmap.height
    );
    const drawWidth = bitmap.width * scale;
    const drawHeight = bitmap.height * scale;
    const overflow = Math.max(0, drawHeight - box.height);
    if (bounds) {
      context.save();
      context.beginPath();
      context.rect(box.x, box.y, box.width, box.height);
      context.clip();
    }
    try {
      context.drawImage(
        bitmap,
        box.x + (box.width - drawWidth) / 2,
        box.y - overflow * (photoPosition / 100),
        drawWidth,
        drawHeight
      );
    } finally {
      if (bounds) context.restore();
    }
  } finally {
    bitmap.close();
  }
}
