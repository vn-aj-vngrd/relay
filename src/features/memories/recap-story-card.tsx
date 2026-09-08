import Image from "next/image";
import type { ComponentProps, CSSProperties } from "react";

import type { SessionRecap } from "./recap";
import type {
  RecapShareTemplateId,
  StoryInvitationFacts,
  StoryPhase,
} from "./recap-share";
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
  storyPhotoDecorations,
  storyScoreFont,
  storyThemeDecorations,
} from "./story-theme";

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
  const surface =
    props.background.imageUrl && props.photoRole === "foreground"
      ? props.sceneBackground
      : props.background;
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
  storyAsOf,
  className = "",
  phase = "completed",
  invitation,
  courtCount = 0,
  joinMode = "off",
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
    hasPhoto: Boolean(background.imageUrl),
    photoRole,
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
  const surface = scene.framed
    ? (sceneBackground ?? { color: "#ffe0eb", light: true })
    : background;
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
  const header = `RELAY · ${isInvitation ? `GAME INVITE · ${storyAsOf ?? "CURRENT PLAN"}` : phase === "live" ? `LIVE · ${storyAsOf ?? "CURRENT UPDATE"}` : "NIGHT MEMORY"}`;

  return (
    <div
      data-story-theme={theme}
      data-photo-role={background.imageUrl ? photoRole : undefined}
      data-photo-placement={scene.framed ? photoPlacement : undefined}
      role="group"
      aria-roledescription="slide"
      aria-label={`${template.replaceAll("-", " ")} social recap preview`}
      className={`relative isolate aspect-[9/16] overflow-hidden rounded-xl [container-type:inline-size] ${light ? "text-[#17181d]" : "text-white"} ${className}`}
      style={
        {
          backgroundColor: surface.color ?? "#11131a",
          ...(theme !== "minimal" ? { "--score": storyScoreFont(theme) } : {}),
        } as CSSProperties
      }
    >
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
      {background.imageUrl ? (
        <div
          data-story-region="photo"
          className="absolute overflow-hidden"
          style={storyRegionStyle(scene.photo)}
        >
          <Image
            src={background.imageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 90vw, 430px"
            unoptimized
            className="object-cover"
            style={{ objectPosition: `center ${photoPosition}%` }}
          />
          {!scene.framed ? (
            <span
              aria-hidden
              className="absolute inset-0"
              style={{ backgroundColor: `rgba(8,10,16,${overlay / 100})` }}
            />
          ) : null}
        </div>
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
                ? light
                  ? "rgba(23,24,29,.62)"
                  : "rgba(255,255,255,.68)"
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
      {theme !== "minimal" ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 1080 1920"
          className="pointer-events-none absolute inset-0 h-full w-full"
          fill="none"
        >
          <g
            transform={
              scene.frame
                ? undefined
                : `translate(${artTransform.x} ${artTransform.y}) scale(${artTransform.scale})`
            }
          >
            {(scene.frame
              ? storyPhotoDecorations(theme, scene.frame)
              : storyThemeDecorations(theme)
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
