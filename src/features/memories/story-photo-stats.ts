import type { SessionRecap } from "./recap";
import type { StoryRegion } from "./story-scene";

/** Shared photo-overlay geometry for preview and PNG; only recorded results. */
export function storyPhotoStats(box: StoryRegion, recap: SessionRecap) {
  if (recap.matchCount === 0) return null;
  const height = Math.min(160, box.height * 0.28);
  const scale = height / 160;
  const band = { ...box, y: box.y + box.height - height, height };
  const columnWidth = box.width / 2;
  const metrics = [
    {
      value: String(recap.totalPoints),
      label: recap.totalPoints === 1 ? "point played" : "points played",
    },
    {
      value: String(recap.matchCount),
      label: recap.matchCount === 1 ? "match played" : "matches played",
    },
  ].map((metric, index) => ({
    ...metric,
    x: box.x + columnWidth * index + 24 * scale,
    baseline: band.y + 78 * scale,
    labelBaseline: band.y + 124 * scale,
    size: Math.min(
      68 * scale,
      (columnWidth - 48 * scale) / (metric.value.length * 0.65)
    ),
    labelSize: 28 * scale,
  }));
  return { band, metrics };
}

export function drawStoryPhotoStats(
  context: CanvasRenderingContext2D,
  stats: NonNullable<ReturnType<typeof storyPhotoStats>>
) {
  context.save();
  context.fillStyle = "#11131a";
  context.fillRect(
    stats.band.x,
    stats.band.y,
    stats.band.width,
    stats.band.height
  );
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  for (const metric of stats.metrics) {
    context.fillStyle = "#ffffff";
    context.font = `800 ${metric.size}px Inter, Arial, sans-serif`;
    context.fillText(metric.value, metric.x, metric.baseline);
    context.fillStyle = "#ffffff";
    context.font = `500 ${metric.labelSize}px Inter, Arial, sans-serif`;
    context.fillText(metric.label, metric.x, metric.labelBaseline);
  }
  context.restore();
}
