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
  photoPosition: number
) {
  const bitmap = await decodeStoryPhoto(source);
  try {
    const scale = Math.max(width / bitmap.width, height / bitmap.height);
    const drawWidth = bitmap.width * scale;
    const drawHeight = bitmap.height * scale;
    const overflow = Math.max(0, drawHeight - height);
    context.drawImage(
      bitmap,
      (width - drawWidth) / 2,
      -overflow * (photoPosition / 100),
      drawWidth,
      drawHeight
    );
  } finally {
    bitmap.close();
  }
}
