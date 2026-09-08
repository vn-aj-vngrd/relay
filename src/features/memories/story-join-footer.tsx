import {
  type StoryJoinDetails,
  storyJoinGeometry,
  type storyJoinPalette,
  storyJoinText,
} from "./story-join";

export function StoryJoinFooter({
  join,
  palette,
}: {
  join: StoryJoinDetails;
  palette: ReturnType<typeof storyJoinPalette>;
}) {
  const { footer, qr } = storyJoinGeometry(join.mode);
  const text = storyJoinText(join.url, join.mode, join.captions?.[join.mode]);
  return (
    <svg
      data-story-region="join"
      viewBox="0 0 1080 1920"
      className="pointer-events-none absolute inset-0 h-full w-full"
      role="img"
      aria-label={`Game join details: ${join.url}`}
    >
      <title>Game join details</title>
      <rect {...footer} fill={palette.background} />
      {join.mode === "qr" ? (
        join.qrImageUrl ? (
          <image
            {...qr}
            href={join.qrImageUrl}
            aria-label="QR code to view the game and RSVP"
          />
        ) : (
          <text
            x={qr.x + qr.width / 2}
            y={qr.y + qr.height / 2}
            textAnchor="middle"
            fill={palette.foreground}
            fontSize="24"
          >
            {join.qrStatus === "error" ? "QR unavailable" : "Generating QR…"}
          </text>
        )
      ) : null}
      <text
        x={text.x}
        y={text.labelY}
        dominantBaseline="text-before-edge"
        fill={palette.foreground}
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="700"
        fontSize="30"
      >
        {text.label}
      </text>
      <text
        fill={palette.foreground}
        fontFamily="ui-monospace, SFMono-Regular, monospace"
        fontWeight="500"
        fontSize={text.fontSize}
        dominantBaseline="text-before-edge"
      >
        {text.lines.map((line, index) => (
          <tspan
            key={`${index}-${line}`}
            x={text.x}
            y={text.y + index * text.lineHeight}
          >
            {line}
          </tspan>
        ))}
      </text>
    </svg>
  );
}
