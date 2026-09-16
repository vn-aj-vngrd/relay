import type { ComponentProps, CSSProperties } from "react";
import type { SessionRecap } from "./recap";
import type {
  RecapShareTemplateId,
  StoryInvitationFacts,
  StoryPhase,
} from "./recap-share";
import {
  type StoryCollageLayout,
  type StorySelectedPhoto,
  storyCollageDecorations,
  storyPhotoSlots,
} from "./story-collage";
import {
  framedInvitationLayout,
  invitationSeparators,
} from "./story-framed-invitation";
import {
  storyInvitationHeader,
  storyInvitationLayout,
} from "./story-invitation-layout";
import {
  type StoryJoinDetails,
  storyJoinGeometry,
  storyJoinPalette,
} from "./story-join";
import { StoryJoinFooter } from "./story-join-footer";
import { StoryPhotoPreview } from "./story-photo-preview";
import { storyRecapLayout } from "./story-recap-layout";
import {
  type StoryPhotoPlacement,
  type StoryPhotoRole,
  storyArtTransform,
  storyRegionStyle,
  storyScene,
} from "./story-scene";
import {
  type StoryTheme,
  storyArtSubject,
  storyMemoryInk,
  storyPhotoDecorations,
  storyPosterEdges,
  storyPosterPanel,
  storyResultColor,
  storyScoreFont,
  storySecondaryInk,
  storySurface,
  storyThemeDecorations,
} from "./story-theme";
import styles from "./story-workspace.module.css";

export type RecapBackground = {
  id: string;
  label: string;
  color?: string;
  imageUrl?: string;
  file?: File;
  light?: boolean;
};

export function RecapStoryCard({
  join,
  ...props
}: ComponentProps<typeof StoryContent> & { join?: StoryJoinDetails | null }) {
  if (!join) return <StoryContent {...props} />;
  const surface = storySurface(
    props.theme ?? "minimal",
    props.background.imageUrl && props.photoRole === "foreground"
      ? (props.sceneBackground ?? { color: "#ffe0eb", light: true })
      : props.background
  );
  return (
    <div
      className={`relative isolate aspect-[9/16] overflow-hidden rounded-xl ${props.className ?? ""}`}
      style={{ backgroundColor: surface?.color ?? "#11131a" }}
    >
      <div
        data-story-region="composition"
        className="absolute"
        style={storyRegionStyle(storyJoinGeometry(join.mode).content)}
      >
        <StoryContent
          {...props}
          joinMode={join.mode}
          className="h-full w-full rounded-none"
        />
      </div>
      <StoryJoinFooter
        join={join}
        palette={storyJoinPalette(surface ?? { color: "#ffe0eb", light: true })}
      />
    </div>
  );
}

function StoryContent({
  title,
  venue,
  date,
  recap,
  template,
  background,
  viewerPlayerId,
  theme = "minimal",
  overlay = 55,
  photoPosition = 50,
  photoRole = "background",
  photoPlacement = "center",
  sceneBackground,
  customHeadline = "Our kind of game.",
  customNote = "",
  className = "",
  invitation,
  courtCount = 0,
  joinMode = "off",
  photoPlaceholder = false,
  onAddPhoto,
  selectedPhotos,
  collageLayout = "editorial",
  showMemoryStats = true,
}: {
  title: string;
  venue: string;
  date: string;
  accent: string;
  recap: SessionRecap;
  template: RecapShareTemplateId;
  background: RecapBackground;
  viewerPlayerId?: string | null;
  theme?: StoryTheme;
  overlay?: number;
  photoPosition?: number;
  photoRole?: StoryPhotoRole;
  photoPlacement?: StoryPhotoPlacement;
  sceneBackground?: RecapBackground;
  customHeadline?: string;
  customNote?: string;
  storyAsOf?: string;
  className?: string;
  phase?: StoryPhase;
  invitation?: StoryInvitationFacts;
  courtCount?: number;
  joinMode?: "qr" | "link" | "off";
  photoPlaceholder?: boolean;
  onAddPhoto?: () => void;
  selectedPhotos?: StorySelectedPhoto[];
  collageLayout?: StoryCollageLayout;
  showMemoryStats?: boolean;
}) {
  const isInvitation = template === "invitation" || template === "spots";
  const framedCopy =
    background.imageUrl &&
    photoRole === "foreground" &&
    isInvitation &&
    invitation
      ? framedInvitationLayout({
          title,
          date,
          venue,
          invitation,
          template,
          customNote,
          theme,
          placement: photoPlacement,
          joinMode,
        })
      : null;
  const nonframedCopy =
    !framedCopy && isInvitation && invitation
      ? storyInvitationLayout({
          title,
          date,
          venue,
          invitation,
          template,
          customNote,
          theme,
          placement: photoPlacement,
          joinMode,
        })
      : null;
  const invitationCopy = framedCopy ?? nonframedCopy;
  const recapCopy = storyRecapLayout({
    title,
    date,
    venue,
    recap,
    template,
    viewerPlayerId,
    courtCount,
    customHeadline,
    customNote,
    theme,
    hasPhoto: Boolean(background.imageUrl) || photoPlaceholder,
    photoCount: background.imageUrl ? selectedPhotos?.length || 1 : 0,
    showMemoryStats,
    photoRole: photoPlaceholder ? "foreground" : photoRole,
    photoPlacement,
  });
  const scene =
    invitationCopy?.scene ??
    recapCopy?.scene ??
    storyScene(
      theme,
      Boolean(background.imageUrl),
      photoRole,
      photoPlacement,
      true,
      { bottom: storyJoinGeometry(joinMode).footer.y - 32 }
    );
  const selectedSurface = scene.framed
    ? (sceneBackground ?? { color: "#ffe0eb", light: true })
    : background;
  const surface = storySurface(theme, selectedSurface);
  const artOptions = {
    subject: storyArtSubject(template),
    accent: selectedSurface.color,
  };
  const light =
    Boolean(surface.light) && (!background.imageUrl || scene.framed);
  const artTransform = storyArtTransform(scene.art);
  const blocks = invitationCopy
    ? invitationCopy.blocks.map((block) => ({
        ...block,
        fontFamily: "Inter, Arial, sans-serif",
      }))
    : (recapCopy?.blocks ?? []);
  const separators = invitationCopy
    ? invitationSeparators(invitationCopy)
    : (recapCopy?.separators ?? []);
  const header = "RELAY";

  return (
    <div
      data-story-theme={theme}
      data-photo-role={background.imageUrl ? photoRole : undefined}
      data-photo-placement={scene.framed ? photoPlacement : undefined}
      role="group"
      aria-roledescription="slide"
      aria-label={`${template.replaceAll("-", " ")} social recap preview`}
      className={`${styles.photoMemory} relative isolate aspect-[9/16] overflow-hidden rounded-xl [container-type:inline-size] ${light ? "text-[#17181d]" : "text-white"} ${className}`}
      style={
        {
          backgroundColor: surface.color ?? "#11131a",
          ...(theme !== "minimal" ? { "--score": storyScoreFont(theme) } : {}),
        } as CSSProperties
      }
    >
      {!background.imageUrl && !photoPlaceholder ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 1080 1920"
          className="pointer-events-none absolute inset-0 h-full w-full"
          fill="none"
        >
          {storyPosterEdges(theme, surface.light ? "#17181d" : "#ffffff").map(
            (decoration) => (
              <path
                key={decoration.path}
                d={decoration.path}
                fill={decoration.fill ?? "none"}
                stroke={decoration.stroke}
                strokeWidth={decoration.strokeWidth}
              />
            )
          )}
        </svg>
      ) : null}
      {scene.frame ? (
        <span
          aria-hidden
          className="absolute"
          style={{
            ...storyRegionStyle(scene.frame),
            backgroundColor: "#fff8f0",
          }}
        />
      ) : null}
      {photoPlaceholder ? (
        <button
          type="button"
          onClick={onAddPhoto}
          aria-label="Add your photo to this memory"
          className={`absolute ${styles.photoPlaceholder}`}
          style={storyRegionStyle(scene.photo)}
        >
          <svg
            aria-hidden="true"
            width="88"
            height="100"
            viewBox="0 0 88 100"
            fill="none"
          >
            <path
              d="M22 8h24q14 0 14 16v27q0 13-14 13h-6v27H28V63q-20 0-20-16V24Q8 8 22 8Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M20 23h28M20 30h28M29 76h11M29 83h11"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle
              cx="65"
              cy="67"
              r="18"
              fill="#cfda9e"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M59 59h.1M71 59h.1M65 67h.1M59 75h.1M71 75h.1"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
          <span className="font-bold" style={{ fontSize: "5cqw" }}>
            Your photo goes here
          </span>
          <span style={{ fontSize: "3.5cqw" }}>
            The crew. The court. Your favorite moment.
          </span>
          <span
            className="mt-2 rounded-full border border-current px-4 py-2 font-semibold"
            style={{ fontSize: "3.5cqw" }}
          >
            Add your photo
          </span>
        </button>
      ) : null}
      {background.imageUrl
        ? (() => {
            const images = selectedPhotos?.length
              ? selectedPhotos
              : [
                  {
                    id: background.id,
                    label: background.label,
                    imageUrl: background.imageUrl,
                    crop: { x: photoPosition, y: photoPosition, zoom: 1 },
                  },
                ];
            const slots = storyPhotoSlots(
              scene.photo,
              images.length,
              collageLayout
            );
            return (
              <>
                {images.map((photo, index) => (
                  <div
                    key={photo.id}
                    data-story-region="photo"
                    data-photo-id={photo.id}
                    className="absolute overflow-hidden"
                    style={storyRegionStyle(slots[index])}
                  >
                    <StoryPhotoPreview
                      key={photo.imageUrl}
                      src={photo.imageUrl}
                      crop={photo.crop}
                    />
                  </div>
                ))}
                {scene.framed ? (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 1080 1920"
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    data-story-collage={collageLayout}
                  >
                    {storyCollageDecorations(
                      scene.photo,
                      images.length,
                      collageLayout,
                      selectedSurface.color ?? "#635bde"
                    ).map((part, index) => (
                      <path
                        key={index}
                        d={part.path}
                        fill={part.fill ?? "none"}
                        stroke={part.stroke}
                        strokeWidth={part.strokeWidth}
                      />
                    ))}
                  </svg>
                ) : null}
                {!scene.framed ? (
                  <span
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      backgroundColor: `rgba(8,10,16,${overlay / 100})`,
                    }}
                  />
                ) : null}
              </>
            );
          })()
        : null}
      {background.imageUrl && recapCopy?.photoStats ? (
        <svg
          role="img"
          aria-label={recapCopy.photoStats.metrics
            .map((metric) => `${metric.value} ${metric.label}`)
            .join(". ")}
          viewBox="0 0 1080 1920"
          className="pointer-events-none absolute inset-0 z-1 h-full w-full"
          data-story-region="photo-stats"
        >
          <rect {...recapCopy.photoStats.band} fill="#11131a" />
          {recapCopy.photoStats.metrics.map((metric) => (
            <g
              key={metric.label}
              fill="#ffffff"
              fontFamily="Inter, Arial, sans-serif"
            >
              <text
                x={metric.x}
                y={metric.baseline}
                fontSize={metric.size}
                fontWeight="800"
              >
                {metric.value}
              </text>
              <text
                x={metric.x}
                y={metric.labelBaseline}
                fontSize={metric.labelSize}
                fontWeight="500"
              >
                {metric.label}
              </text>
            </g>
          ))}
        </svg>
      ) : null}
      <svg
        aria-hidden="true"
        viewBox="0 0 1080 1920"
        className="pointer-events-none absolute inset-0 h-full w-full"
        data-story-region="header"
      >
        <circle cx="82" cy="84" r="12" fill="#91aa1e" />
        <circle cx="80" cy="82" r="10" fill="#b7d62e" />
        <text
          x={storyInvitationHeader.x}
          y={storyInvitationHeader.baseline}
          fontSize={storyInvitationHeader.size}
          fontFamily="Inter, Arial, sans-serif"
          fontWeight="700"
          fill="currentColor"
        >
          {header}
        </text>
      </svg>
      <svg
        role="img"
        aria-label={blocks.map((block) => block.text).join(". ")}
        viewBox="0 0 1080 1920"
        className="pointer-events-none absolute inset-0 h-full w-full"
        data-story-region={invitationCopy ? "compact-facts" : "recap-facts"}
      >
        {separators.map((line) => (
          <rect
            key={line.y}
            data-story-separator={
              invitationCopy ? "plan-rsvp" : "session-context"
            }
            x={line.x}
            y={line.y}
            width={line.width}
            height={line.height}
            fill={light ? "rgba(23,24,29,.18)" : "rgba(255,255,255,.22)"}
          />
        ))}
        {blocks.map((block) => (
          <text
            key={block.id}
            data-story-fact={block.id}
            x={block.x}
            y={block.baseline}
            fontFamily={block.fontFamily}
            fontSize={block.size}
            fontWeight={block.weight}
            fill={
              block.secondary
                ? storySecondaryInk(light)
                : block.id === "result"
                  ? storyResultColor(theme, selectedSurface, "currentColor")
                  : template === "custom" && block.id === "headline"
                    ? storyMemoryInk(theme, light ? "#17181d" : "#ffffff")
                    : "currentColor"
            }
          >
            {block.lines.map((line, index) => (
              <tspan
                key={`${block.id}-${index}`}
                x={block.x}
                y={block.baseline + index * block.size * 1.25}
              >
                {line}
                {index < block.lines.length - 1 ? " " : ""}
              </tspan>
            ))}
          </text>
        ))}
      </svg>
      {theme !== "minimal" && (!background.imageUrl || scene.frame) ? (
        <svg
          data-story-region="theme-art"
          aria-hidden="true"
          viewBox="0 0 1080 1920"
          className="pointer-events-none absolute inset-0 h-full w-full"
          fill="none"
        >
          {theme === "court-pop" && !scene.frame && !background.imageUrl
            ? storyPosterPanel(scene.art).map((decoration) => (
                <path
                  key={decoration.path}
                  d={decoration.path}
                  fill={decoration.fill ?? "none"}
                  stroke={decoration.stroke}
                  strokeWidth={decoration.strokeWidth}
                />
              ))
            : null}
          <g
            transform={
              scene.frame
                ? undefined
                : `translate(${artTransform.x} ${artTransform.y}) scale(${artTransform.scale})`
            }
          >
            {(scene.frame
              ? storyPhotoDecorations(theme, scene.frame, artOptions)
              : storyThemeDecorations(theme, artOptions)
            ).map((decoration) => (
              <path
                key={decoration.path}
                d={decoration.path}
                fill={decoration.fill ?? "none"}
                stroke={decoration.stroke}
                strokeWidth={decoration.strokeWidth}
              />
            ))}
          </g>
        </svg>
      ) : null}
    </div>
  );
}
