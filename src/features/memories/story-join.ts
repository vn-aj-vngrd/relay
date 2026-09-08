import type { StoryRegion } from "./story-scene";

export type StoryJoinMode = "qr" | "link" | "off";
export type StoryJoinDetails = {
  url: string;
  mode: "qr" | "link";
  captions?: { qr: string; link: string };
  qrImageUrl?: string;
  qrStatus?: "loading" | "ready" | "error";
};

/** Footer space is allocated inside the canonical scene, never by scaling it. */
export function storyJoinGeometry(mode: StoryJoinMode) {
  const height = mode === "qr" ? 384 : mode === "link" ? 192 : 0;
  return {
    scale: 1,
    content: { x: 0, y: 0, width: 1080, height: 1920 },
    footer: { x: 0, y: 1920 - height, width: 1080, height },
    qr: { x: 72, y: 1584, width: 288, height: 288 },
  } satisfies {
    scale: number;
    content: StoryRegion;
    footer: StoryRegion;
    qr: StoryRegion;
  };
}

/** Photo backgrounds need an opaque ink field; framed photos use scene paper. */
export function storyJoinPalette(surface: {
  color?: string;
  light?: boolean;
  imageUrl?: string;
}) {
  return {
    background: surface.color ?? "#11131a",
    foreground: surface.light && !surface.imageUrl ? "#17181d" : "#ffffff",
  };
}

export function storyJoinText(
  url: string,
  mode: "qr" | "link",
  caption?: string
) {
  const displayUrl = url.replace(/^https?:\/\//i, "");
  const columns = mode === "qr" ? 34 : 46;
  const lines = Array.from(
    { length: Math.ceil(displayUrl.length / columns) },
    (_, index) => displayUrl.slice(index * columns, (index + 1) * columns)
  );
  const fontSize = Math.min(
    mode === "qr" ? 28 : 32,
    (mode === "qr" ? 192 : 88) / Math.max(1, lines.length) / 1.35
  );
  return {
    lines,
    fontSize,
    lineHeight: fontSize * 1.35,
    x: mode === "qr" ? 408 : 72,
    y: mode === "qr" ? 1668 : 1812,
    labelY: mode === "qr" ? 1608 : 1758,
    label:
      caption ??
      (mode === "qr" ? "Scan to view and RSVP" : "View the game and RSVP"),
  };
}

export function drawStoryJoin(
  context: CanvasRenderingContext2D,
  join: StoryJoinDetails,
  qr?: HTMLCanvasElement,
  palette = storyJoinPalette({})
) {
  if (join.mode === "qr" && !qr) throw new Error("Story QR is not ready");
  const { footer, qr: box } = storyJoinGeometry(join.mode);
  context.save();
  context.fillStyle = palette.background;
  context.fillRect(footer.x, footer.y, footer.width, footer.height);
  if (qr && join.mode === "qr") {
    context.imageSmoothingEnabled = false;
    context.drawImage(qr, box.x, box.y, box.width, box.height);
  }
  const text = storyJoinText(join.url, join.mode, join.captions?.[join.mode]);
  context.fillStyle = palette.foreground;
  context.textAlign = "left";
  context.textBaseline = "top";
  context.font = "700 30px Inter, Arial, sans-serif";
  context.fillText(text.label, text.x, text.labelY);
  context.font = `500 ${text.fontSize}px ui-monospace, SFMono-Regular, monospace`;
  text.lines.forEach((line, index) =>
    context.fillText(line, text.x, text.y + index * text.lineHeight)
  );
  context.restore();
}
