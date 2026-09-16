"use client";

import {
  CaretLeft,
  CaretRight,
  Check,
  DownloadSimple,
  ShareNetwork,
  X,
} from "@phosphor-icons/react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { Button, ButtonSpinner } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { TabChipRail } from "@/components/ui/tab-chip-rail";
import { trackSharedSessionEvent } from "@/features/analytics/actions";
import { sessionAccents } from "@/features/sessions/accent";

import type { SessionRecap } from "./recap";
import {
  invitationJoinCaption,
  type RecapShareTemplateId,
  recapShareTemplates,
  type StoryInvitationFacts,
  type StoryPhase,
} from "./recap-share";
import { type RecapBackground, RecapStoryCard } from "./recap-story-card";
import {
  type StoryCollageLayout,
  storyCollageDecorations,
  storyCollageLayouts,
  storyPhotoSlots,
} from "./story-collage";
import { storyColorsForGame } from "./story-color";
import {
  drawFramedInvitation,
  framedInvitationLayout,
} from "./story-framed-invitation";
import {
  storyInvitationHeader,
  storyInvitationLayout,
} from "./story-invitation-layout";
import {
  drawStoryJoin,
  type StoryJoinDetails,
  type StoryJoinMode,
  storyJoinGeometry,
  storyJoinPalette,
} from "./story-join";
import { StoryJoinHelp } from "./story-join-help";
import { drawStoryPhoto } from "./story-photo";
import { StoryPhotoEditor } from "./story-photo-editor";
import { drawStoryPhotoStats } from "./story-photo-stats";
import { drawStoryRecap, storyRecapLayout } from "./story-recap-layout";
import {
  type StoryPhotoPlacement,
  type StoryPhotoRole,
  storyArtTransform,
  storyScene,
} from "./story-scene";
import {
  defaultStoryTheme,
  drawStoryDecorations,
  drawStoryTheme,
  type StoryTheme,
  storyArtSubject,
  storyMemoryInk,
  storyPosterEdges,
  storyPosterPanel,
  storyResultColor,
  storySecondaryInk,
  storySurface,
} from "./story-theme";
import { StoryThemePicker } from "./story-theme-picker";
import styles from "./story-workspace.module.css";
import { useStoryPhotos } from "./use-story-photos";
import { useStoryQr } from "./use-story-qr";

type RecapPhoto = { id: string; url: string; alt: string };

function trackStoryShare(
  sessionId: string | undefined,
  event: "invite_shared" | "recap_shared"
) {
  if (!sessionId) return;
  try {
    void Promise.resolve(trackSharedSessionEvent({ sessionId, event })).catch(
      () => undefined
    );
  } catch {
    // Analytics is best-effort and must not change successful share feedback.
  }
}

export function RecapShareCard({
  sessionId,
  title,
  venue,
  date,
  accent,
  recap,
  photos,
  viewerPlayerId,
  phase = "completed",
  invitation,
  courtCount = 0,
  storyAsOf,
  joinUrl,
}: {
  sessionId?: string;
  title: string;
  venue: string;
  date: string;
  accent: string;
  recap: SessionRecap;
  photos: RecapPhoto[];
  viewerPlayerId?: string | null;
  phase?: StoryPhase;
  invitation?: StoryInvitationFacts;
  courtCount?: number;
  storyAsOf?: string;
  joinUrl?: string | null;
}) {
  const templates = useMemo(
    () => recapShareTemplates(recap, viewerPlayerId, phase),
    [phase, recap, viewerPlayerId]
  );
  const gameAccent =
    sessionAccents.find(
      (option) => option.solid.toLowerCase() === accent.toLowerCase()
    ) ?? sessionAccents[0];
  const photoSelection = useStoryPhotos();
  const [editorSection, setEditorSection] = useState<
    "photos" | "layout" | "look" | "details"
  >("photos");
  const [collageLayout, setCollageLayout] =
    useState<StoryCollageLayout>("editorial");
  const backgrounds = useMemo(
    () => storyColorsForGame(gameAccent.id),
    [gameAccent.id]
  );
  const [template, setTemplate] = useState<RecapShareTemplateId>(
    templates.find((item) => item.id === "custom")?.id ?? templates[0].id
  );
  const [theme, setTheme] = useState<StoryTheme>(defaultStoryTheme);
  const [backgroundId, setBackgroundId] = useState(`accent:${gameAccent.id}`);
  const [overlay, setOverlay] = useState(55);
  const [moreStoriesOpen, setMoreStoriesOpen] = useState(false);
  const [moreLayoutsOpen, setMoreLayoutsOpen] = useState(false);
  const storyOptionsId = useId();
  const photoEditorId = useId();
  const photoPosition = 50;
  const [requestedPhotoRole, setPhotoRole] =
    useState<StoryPhotoRole>("foreground");
  const [photoPlacement, setPhotoPlacement] =
    useState<StoryPhotoPlacement>("center");
  const [surfaceId, setSurfaceId] = useState(`accent:${gameAccent.id}`);
  const [customHeadline, setCustomHeadline] = useState("Same court next week?");
  const [customNote, setCustomNote] = useState("");
  const [showMemoryStats, setShowMemoryStats] = useState(true);
  const [joinMode, setJoinMode] = useState<StoryJoinMode>("qr");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewTitleId = useId();
  const previewDialog = useRef<HTMLDialogElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const photoRole =
    photoSelection.photos.length > 1 ? "foreground" : requestedPhotoRole;
  const background: RecapBackground =
    photoSelection.photos[0] ??
    backgrounds.find((item) => item.id === backgroundId) ??
    backgrounds[0];
  const sceneBackground =
    backgrounds.find((item) => item.id === surfaceId) ?? backgrounds[0];
  const templateIndex = templates.findIndex((item) => item.id === template);
  const activeTemplate = templates[templateIndex] ?? templates[0];

  const eligibleJoinUrl =
    phase === "published" &&
    (activeTemplate.id === "invitation" || activeTemplate.id === "spots")
      ? (joinUrl ?? null)
      : null;
  const qr = useStoryQr(
    eligibleJoinUrl && joinMode === "qr" ? eligibleJoinUrl : null
  );
  const join: StoryJoinDetails | null =
    eligibleJoinUrl && joinMode !== "off"
      ? {
          url: eligibleJoinUrl,
          mode: joinMode,
          captions:
            invitation &&
            (activeTemplate.id === "invitation" ||
              activeTemplate.id === "spots")
              ? {
                  qr: invitationJoinCaption(
                    activeTemplate.id,
                    invitation,
                    "qr"
                  ),
                  link: invitationJoinCaption(
                    activeTemplate.id,
                    invitation,
                    "link"
                  ),
                }
              : undefined,
          qrImageUrl: qr?.status === "ready" ? qr.imageUrl : undefined,
          qrStatus: qr?.status ?? "loading",
        }
      : null;
  const photoRequired = template === "custom" && !background.imageUrl;
  const qrBlocked = join?.mode === "qr" && qr?.status !== "ready";
  const joinKey = `${eligibleJoinUrl ?? ""}|${joinMode}|${activeTemplate.id}`;
  const currentJoinKey = useRef(joinKey);
  currentJoinKey.current = joinKey;
  const scene = storyScene(
    theme,
    Boolean(background.imageUrl),
    photoRole,
    photoPlacement,
    Boolean(join)
  );

  useEffect(() => {
    setMessage("");
  }, [photoSelection.photos]);

  useEffect(() => {
    if (!templates.some((item) => item.id === template))
      setTemplate(templates[0].id);
  }, [template, templates]);

  useEffect(() => {
    if (previewOpen) previewDialog.current?.showModal();
  }, [previewOpen]);

  function chooseTemplate(id: RecapShareTemplateId) {
    setTemplate(id);
    setMessage("");
  }

  function moveTemplate(direction: -1 | 1) {
    const next =
      (templateIndex + direction + templates.length) % templates.length;
    chooseTemplate(templates[next].id);
  }

  function openPreview() {
    setPreviewOpen(true);
  }

  function closePreview() {
    previewDialog.current?.close();
    setPreviewOpen(false);
  }

  async function createCard(linkOnly = false) {
    photoSelection.clearMessage();
    if (photoRequired) throw new Error("Add a photo to this memory first");
    const exportJoin =
      join && linkOnly ? { ...join, mode: "link" as const } : join;
    if (exportJoin?.mode === "qr" && qr?.status !== "ready") {
      throw new Error("Story QR is not ready");
    }
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    // Use the same loaded face as the SVG preview, including poster weights.
    if (
      template === "custom" &&
      (theme === "scrapbook" || theme === "coquette")
    )
      await document.fonts?.load?.('700 104px "Relay Hand"');
    await document.fonts?.ready;

    const framedCopy =
      background.imageUrl &&
      photoRole === "foreground" &&
      (template === "invitation" || template === "spots") &&
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
            joinMode: exportJoin?.mode ?? "off",
          })
        : null;
    const nonframedCopy =
      !framedCopy &&
      (template === "invitation" || template === "spots") &&
      invitation
        ? storyInvitationLayout({
            title,
            date,
            venue,
            invitation,
            template,
            customNote,
            theme,
            placement: photoPlacement,
            joinMode: exportJoin?.mode ?? "off",
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
      photoCount: photoSelection.photos.length,
      showMemoryStats,
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
        Boolean(exportJoin),
        { bottom: storyJoinGeometry(exportJoin?.mode ?? "off").footer.y - 32 }
      );
    const selectedSurface = scene.framed ? sceneBackground : background;
    const surface = storySurface(theme, selectedSurface);
    const artOptions = {
      subject: storyArtSubject(template),
      accent: selectedSurface.color,
    };
    context.fillStyle = surface.color ?? "#11131a";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.save();
    if (!background.imageUrl)
      drawStoryDecorations(
        context,
        storyPosterEdges(theme, surface.light ? "#17181d" : "#ffffff")
      );
    if (scene.frame) {
      context.fillStyle = "#fff8f0";
      context.fillRect(
        scene.frame.x,
        scene.frame.y,
        scene.frame.width,
        scene.frame.height
      );
    }
    if (background.imageUrl) {
      try {
        const slots = storyPhotoSlots(
          scene.photo,
          photoSelection.photos.length,
          collageLayout
        );
        for (const [index, photo] of photoSelection.photos.entries()) {
          await drawStoryPhoto(
            context,
            photo.file ?? photo.imageUrl,
            canvas.width,
            canvas.height,
            photoPosition,
            scene.framed ? slots[index] : undefined,
            photo.crop
          );
        }
      } catch (error) {
        throw new Error("Selected photo unavailable", { cause: error });
      }
      if (scene.framed) {
        drawStoryDecorations(
          context,
          storyCollageDecorations(
            scene.photo,
            photoSelection.photos.length,
            collageLayout,
            selectedSurface.color ?? "#635bde"
          )
        );
      }
      if (!scene.framed) {
        context.fillStyle = `rgba(8,10,16,${overlay / 100})`;
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
    }

    const light =
      Boolean(surface.light) && (!background.imageUrl || scene.framed);
    const foreground = light ? "#17181d" : "#ffffff";
    const secondary = storySecondaryInk(light);
    const rule = light ? "rgba(23,24,29,.18)" : "rgba(255,255,255,.22)";

    context.fillStyle = "#91aa1e";
    context.beginPath();
    context.arc(82, 84, 12, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#b7d62e";
    context.beginPath();
    context.arc(80, 82, 10, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = foreground;
    context.font = `700 ${storyInvitationHeader.size}px Inter, Arial, sans-serif`;
    context.textBaseline = "alphabetic";
    context.fillText(
      "RELAY",
      storyInvitationHeader.x,
      storyInvitationHeader.baseline
    );

    if (invitationCopy) {
      drawFramedInvitation(
        context,
        invitationCopy,
        foreground,
        secondary,
        rule
      );
    }
    if (recapCopy) {
      drawStoryRecap(
        context,
        recapCopy,
        foreground,
        secondary,
        rule,
        storyResultColor(theme, selectedSurface, foreground),
        template === "custom" ? storyMemoryInk(theme, foreground) : foreground
      );
    }
    if (scene.frame) {
      drawStoryTheme(context, theme, scene.frame, artOptions);
    } else if (theme !== "minimal" && !background.imageUrl) {
      if (theme === "court-pop" && !background.imageUrl)
        drawStoryDecorations(context, storyPosterPanel(scene.art));
      const art = storyArtTransform(scene.art);
      context.save();
      context.translate(art.x, art.y);
      context.scale(art.scale, art.scale);
      drawStoryTheme(context, theme, undefined, artOptions);
      context.restore();
    } else if (!background.imageUrl) {
      drawStoryTheme(context, theme);
    }
    if (recapCopy?.photoStats) {
      drawStoryPhotoStats(context, recapCopy.photoStats);
    }
    context.restore();
    if (currentJoinKey.current !== joinKey)
      throw new Error("Join details changed");
    if (exportJoin) {
      drawStoryJoin(
        context,
        exportJoin,
        qr?.status === "ready" ? qr.canvas : undefined,
        storyJoinPalette(surface)
      );
    }
    return new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("Image unavailable")),
        "image/png"
      )
    );
  }

  function storyFile(blob: Blob) {
    return new File(
      [blob],
      `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-relay-story.png`,
      {
        type: "image/png",
      }
    );
  }

  function saveFile(file: File) {
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function download(linkOnly = false) {
    if (pending || (qrBlocked && !linkOnly)) return;
    setPending(true);
    setMessage("");
    try {
      const file = storyFile(await createCard(linkOnly));
      if (currentJoinKey.current !== joinKey) {
        setMessage("Join details changed. Export the current story again.");
        return;
      }
      saveFile(file);
      if (linkOnly) setJoinMode("link");
      setMessage(
        linkOnly
          ? "Story downloaded with link only at 1080 × 1920."
          : "Story downloaded at 1080 × 1920."
      );
    } catch {
      setMessage(
        currentJoinKey.current !== joinKey
          ? "Join details changed. Export the current story again."
          : "The story image couldn’t be created. Try another photo or background."
      );
    } finally {
      setPending(false);
    }
  }

  async function share() {
    if (pending || qrBlocked) return;
    setPending(true);
    setMessage("");
    try {
      const file = storyFile(await createCard());
      if (currentJoinKey.current !== joinKey) {
        setMessage("Join details changed. Export the current story again.");
        return;
      }
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `${title} · ${phase === "published" ? "Game invitation" : phase === "live" ? "Live update" : "Game story"}`,
          files: [file],
        });
        setMessage("Story ready to share.");
      } else {
        saveFile(file);
        setMessage(
          "Sharing isn’t available here, so the story was downloaded."
        );
      }
      trackStoryShare(
        sessionId,
        phase === "completed" ? "recap_shared" : "invite_shared"
      );
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        setMessage(
          currentJoinKey.current !== joinKey
            ? "Join details changed. Export the current story again."
            : "The story image couldn’t be created. Try another photo or background."
        );
    } finally {
      setPending(false);
    }
  }

  const actionLabel = "Share Story";

  return (
    <div className={styles.workspace}>
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Shareable memory stories"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            moveTemplate(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
        className={`${styles.carousel} rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-primary/25`}
      >
        <div
          className={styles.portrait}
          onTouchStart={(event) => {
            const touch = event.touches.length === 1 ? event.touches[0] : null;
            touchStart.current = touch
              ? { x: touch.clientX, y: touch.clientY }
              : null;
          }}
          onTouchCancel={() => {
            touchStart.current = null;
          }}
          onTouchEnd={(event) => {
            const start = touchStart.current;
            const end = event.changedTouches[0];
            touchStart.current = null;
            if (!start || !end) return;
            const x = end.clientX - start.x;
            const y = end.clientY - start.y;
            if (Math.abs(x) > 44 && Math.abs(x) > Math.abs(y) * 1.5) {
              moveTemplate(x > 0 ? -1 : 1);
            }
          }}
        >
          <RecapStoryCard
            title={title}
            join={join}
            venue={venue}
            date={date}
            accent={accent}
            recap={recap}
            template={template}
            background={background}
            selectedPhotos={photoSelection.photos}
            collageLayout={collageLayout}
            showMemoryStats={showMemoryStats}
            photoPlaceholder={photoRequired}
            onAddPhoto={() => {
              setEditorSection("photos");
              document
                .getElementById(photoEditorId)
                ?.scrollIntoView({ behavior: "instant", block: "nearest" });
            }}
            viewerPlayerId={viewerPlayerId}
            theme={theme}
            overlay={overlay}
            photoPosition={photoPosition}
            photoRole={photoRole}
            photoPlacement={photoPlacement}
            sceneBackground={sceneBackground}
            customHeadline={customHeadline}
            customNote={customNote}
            phase={phase}
            storyAsOf={storyAsOf}
            invitation={invitation}
            courtCount={courtCount}
            className="w-full shadow-[0_3px_8px_rgb(20_24_34_/_0.12)]"
          />
          {!photoRequired ? (
            <button
              type="button"
              onClick={openPreview}
              className="absolute inset-0 z-10 cursor-zoom-in rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-primary/35"
              aria-label="Expand story preview"
            />
          ) : null}
        </div>
        <div className="mt-3 grid grid-cols-[44px_1fr_44px] items-center gap-2">
          <button
            type="button"
            onClick={() => moveTemplate(-1)}
            className="grid h-11 w-11 place-items-center rounded-lg text-muted outline-none hover:bg-surface-strong hover:text-ink focus-visible:ring-3 focus-visible:ring-primary/25"
            aria-label="Previous story"
          >
            <CaretLeft aria-hidden size={17} />
          </button>
          <p className="text-center text-xs font-semibold" aria-live="polite">
            {activeTemplate.label} · {templateIndex + 1} of {templates.length}
          </p>
          <button
            type="button"
            onClick={() => moveTemplate(1)}
            className="grid h-11 w-11 place-items-center rounded-lg text-muted outline-none hover:bg-surface-strong hover:text-ink focus-visible:ring-3 focus-visible:ring-primary/25"
            aria-label="Next story"
          >
            <CaretRight aria-hidden size={17} />
          </button>
        </div>
      </div>
      <div className="min-w-0">
        <section
          className="mb-5"
          aria-label="Story editor controls"
          id={photoEditorId}
        >
          <h2 className="text-lg font-bold">Make it your memory</h2>
          <p className="mt-1 text-sm text-muted">
            Pick your moments. Make them yours.
          </p>
          <div className="mt-4">
            <TabChipRail
              label="Story editor"
              items={[
                { value: "photos", label: "Photos" },
                { value: "layout", label: "Layout" },
                { value: "look", label: "Look" },
                { value: "details", label: "Details" },
              ]}
              value={editorSection}
              onChange={setEditorSection}
            />
          </div>
          <div hidden={editorSection !== "photos"}>
            <StoryPhotoEditor selection={photoSelection} gamePhotos={photos} />
          </div>
          {editorSection === "layout" ? (
            <fieldset className="mt-4 min-w-0">
              <legend className="text-sm font-semibold">
                {photoSelection.photos.length > 1
                  ? "Collage layout"
                  : "Photo layout"}
              </legend>
              {photoSelection.photos.length > 1 ? (
                <>
                  <div className="mt-3">
                    <TabChipRail
                      label="Collage layout"
                      className={styles.collageRail}
                      itemClassName={styles.collageOption}
                      items={storyCollageLayouts.filter(
                        (item) =>
                          moreLayoutsOpen ||
                          [
                            "editorial",
                            "grid",
                            "scrapbook",
                            collageLayout,
                          ].includes(item.value)
                      )}
                      value={collageLayout}
                      onChange={setCollageLayout}
                      renderItem={({ value, label }) => (
                        <span className="flex flex-col items-center gap-2">
                          <svg
                            aria-hidden
                            viewBox="0 0 936 1120"
                            className={styles.collageThumbnail}
                            fill="currentColor"
                          >
                            <rect width="936" height="1120" fill="#f5f3ee" />
                            {storyPhotoSlots(
                              { x: 40, y: 40, width: 856, height: 1040 },
                              Math.max(2, photoSelection.photos.length),
                              value
                            ).map((slot, index) => (
                              <rect
                                key={index}
                                {...slot}
                                fill={index === 0 ? "#34544f" : "#8a9e94"}
                              />
                            ))}
                            {storyCollageDecorations(
                              { x: 40, y: 40, width: 856, height: 1040 },
                              photoSelection.photos.length,
                              value,
                              sceneBackground.color ?? accent
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
                          {label}
                        </span>
                      )}
                    />
                  </div>
                  <button
                    type="button"
                    className="mt-2 min-h-9 rounded-lg px-1 text-sm font-semibold text-primary hover:underline"
                    aria-expanded={moreLayoutsOpen}
                    onClick={() => setMoreLayoutsOpen((open) => !open)}
                  >
                    {moreLayoutsOpen ? "Fewer layouts" : "More layouts"}
                  </button>
                  <p className="mt-2 text-xs text-muted">
                    All your photos stay selected. Put your favorite first in
                    Photos.
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-muted">
                  One photo makes a poster. Choose 2–4 photos to create a
                  collage.
                </p>
              )}
              {photoSelection.photos.length === 1 ? (
                <fieldset className="mt-4 min-w-0">
                  <legend className="mb-2 text-sm font-semibold">
                    Photo style
                  </legend>
                  <TabChipRail
                    label="Photo role"
                    items={[
                      { value: "background", label: "Full background" },
                      { value: "foreground", label: "Framed foreground" },
                    ]}
                    value={photoRole}
                    onChange={setPhotoRole}
                  />
                </fieldset>
              ) : null}
              {photoRole === "foreground" ? (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-semibold">Photo placement</p>
                  <TabChipRail
                    label="Photo placement options"
                    items={[
                      { value: "top", label: "Photo first" },
                      { value: "center", label: "Balanced" },
                      { value: "bottom", label: "Details first" },
                    ]}
                    value={photoPlacement}
                    onChange={setPhotoPlacement}
                  />
                </div>
              ) : null}
            </fieldset>
          ) : null}
          {editorSection === "look" ? (
            <div className="space-y-5">
              <StoryThemePicker
                theme={theme}
                subject={storyArtSubject(template)}
                photoUrl={background.imageUrl}
                photos={photoSelection.photos}
                collageLayout={collageLayout}
                onChange={setTheme}
                light={(scene.framed ? sceneBackground : background).light}
                accent={
                  (scene.framed ? sceneBackground : background).color ?? accent
                }
              />
              {!background.imageUrl || scene.framed ? (
                <fieldset className="min-w-0">
                  <legend className="text-sm font-semibold">Color</legend>
                  <p className="mt-1 text-xs text-muted" aria-live="polite">
                    {(scene.framed ? sceneBackground : background).label}
                    {(scene.framed ? surfaceId : backgroundId) ===
                    `accent:${gameAccent.id}`
                      ? " · Game color"
                      : ""}
                  </p>
                  <div
                    className="mt-3 flex flex-wrap gap-2"
                    role="group"
                    aria-label="Story background"
                  >
                    {backgrounds.map((item) => {
                      const selected =
                        (scene.framed ? surfaceId : backgroundId) === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          aria-label={`${item.label} background`}
                          aria-pressed={selected}
                          onClick={() => {
                            setSurfaceId(item.id);
                            setBackgroundId(item.id);
                          }}
                          className={`grid h-9 w-9 place-items-center rounded-full border-2 outline-none focus-visible:ring-3 focus-visible:ring-primary/25 ${selected ? "border-ink" : "border-transparent"}`}
                          style={{
                            backgroundColor: storySurface(theme, item).color,
                          }}
                        >
                          {selected ? (
                            <span className="grid h-5 w-5 place-items-center rounded-full bg-black/65 text-white">
                              <Check aria-hidden size={14} weight="bold" />
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted">
                    Colors adapt to your theme. Changes apply to this story
                    only.
                  </p>
                </fieldset>
              ) : null}
              {background.imageUrl && !scene.framed ? (
                <label className="text-sm font-semibold">
                  Text contrast
                  <input
                    type="range"
                    aria-label="Text contrast"
                    min="20"
                    max="80"
                    value={overlay}
                    onChange={(event) => setOverlay(Number(event.target.value))}
                    className="mt-1 min-h-11 w-full accent-primary"
                  />
                  <span className="mt-1 block text-xs font-normal text-muted">
                    Darken the photo behind the story.
                  </span>
                </label>
              ) : null}
            </div>
          ) : null}
          {editorSection === "details" ? (
            <div className="mt-4 space-y-5">
              <fieldset className="min-w-0">
                <legend className="text-sm font-semibold">Story type</legend>
                <div id={storyOptionsId} className="mt-3">
                  <TabChipRail
                    label="Story focus options"
                    className={styles.optionRail}
                    items={templates
                      .filter(
                        (item) =>
                          moreStoriesOpen ||
                          templates.length <= 4 ||
                          [
                            "custom",
                            "overview",
                            "personal",
                            "crew",
                            template,
                          ].includes(item.id)
                      )
                      .map((item) => ({ value: item.id, label: item.label }))}
                    value={template}
                    onChange={chooseTemplate}
                  />
                </div>
                {templates.length > 4 ? (
                  <button
                    type="button"
                    className="mt-2 min-h-9 rounded-lg px-1 text-sm font-semibold text-primary hover:underline"
                    aria-expanded={moreStoriesOpen}
                    aria-controls={storyOptionsId}
                    onClick={() => setMoreStoriesOpen((open) => !open)}
                  >
                    {moreStoriesOpen ? "Fewer stories" : "More stories"}
                  </button>
                ) : null}
                <p className="mt-2 text-sm leading-5 text-muted">
                  {activeTemplate.description}
                </p>
              </fieldset>
              {template === "custom" ? (
                <>
                  {recap.matchCount > 0 ? (
                    <label className="flex min-h-9 cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={showMemoryStats}
                        onChange={(event) =>
                          setShowMemoryStats(event.target.checked)
                        }
                        className="size-4 accent-primary"
                      />
                      Show game stats
                    </label>
                  ) : null}
                  <label className="mt-3 block text-sm font-semibold">
                    Your caption
                    <input
                      value={customHeadline}
                      onChange={(event) =>
                        setCustomHeadline(event.target.value)
                      }
                      maxLength={56}
                      className="field"
                      placeholder="Our kind of game."
                    />
                  </label>
                  <div className="mt-2">
                    <TabChipRail
                      label="Memory caption ideas"
                      items={[
                        "Same court next week?",
                        "Our kind of game.",
                        "Good games. Better company.",
                      ].map((line) => ({ value: line, label: line }))}
                      value={customHeadline}
                      onChange={setCustomHeadline}
                    />
                  </div>
                </>
              ) : null}

              <fieldset className="mt-4 min-w-0">
                <legend className="sr-only">Message</legend>

                <label className="mt-3 block text-sm font-semibold">
                  Personal line{" "}
                  <span className="font-normal text-muted">(optional)</span>
                  <input
                    value={customNote}
                    onChange={(event) => setCustomNote(event.target.value)}
                    maxLength={72}
                    className="field"
                    placeholder="Let’s play again soon."
                  />
                </label>
                <div className="mt-3">
                  <TabChipRail
                    label="Personal line suggestions"
                    items={(phase === "published"
                      ? [
                          "Meet you at the kitchen.",
                          "Bring a paddle. Bring a friend.",
                        ]
                      : ["Same court next time?", "Good games. Better company."]
                    ).map((line) => ({ value: line, label: line }))}
                    value={customNote}
                    onChange={setCustomNote}
                  />
                </div>
              </fieldset>
              {eligibleJoinUrl ? (
                <fieldset className="mb-4 min-w-0">
                  <legend className="text-sm font-bold">Join details</legend>
                  <div className="mt-3">
                    <TabChipRail
                      label="Join details options"
                      className={styles.optionRail}
                      items={[
                        { value: "qr", label: "QR + link" },
                        { value: "link", label: "Link only" },
                        { value: "off", label: "Off" },
                      ]}
                      value={joinMode}
                      onChange={setJoinMode}
                    />
                  </div>
                </fieldset>
              ) : null}
            </div>
          ) : null}
        </section>
        <div
          role="group"
          aria-label="Story export actions"
          className={`${styles.actions} ${styles.shareActions}`}
        >
          <Button
            type="button"
            onClick={share}
            disabled={
              pending || photoSelection.adding || qrBlocked || photoRequired
            }
          >
            {pending ? (
              <ButtonSpinner />
            ) : (
              <ShareNetwork aria-hidden size={16} />
            )}
            {pending ? "Creating story…" : actionLabel}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void download()}
            disabled={
              pending || photoSelection.adding || qrBlocked || photoRequired
            }
          >
            <DownloadSimple aria-hidden size={16} />
            Download PNG
          </Button>
        </div>
        {photoRequired ? (
          <p className="mt-2 text-xs text-muted">
            Add a photo to share this memory.
          </p>
        ) : null}
        <StoryJoinHelp
          blocked={qrBlocked}
          failed={qr?.status === "error"}
          pending={pending}
          onLinkOnly={() => void download(true)}
        />
        {message ? (
          <p role="status" className="mt-2 text-sm font-medium text-muted">
            {message}
          </p>
        ) : null}
      </div>

      {previewOpen ? (
        <Dialog
          ref={previewDialog}
          variant="media"
          aria-labelledby={previewTitleId}
          onClose={() => setPreviewOpen(false)}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              event.preventDefault();
              moveTemplate(event.key === "ArrowLeft" ? -1 : 1);
            }
          }}
        >
          <div className={styles.expanded}>
            <div className="mb-3 flex w-full max-w-md items-center justify-between gap-3">
              <div className="min-w-0">
                <h2
                  id={previewTitleId}
                  className="truncate text-base font-bold"
                >
                  {title}
                </h2>
                <p className="text-xs text-white/65">{activeTemplate.label}</p>
              </div>
              <Button
                type="button"
                variant="quiet"
                onClick={closePreview}
                aria-label="Close expanded story"
                className="shrink-0 text-white hover:bg-white/10 hover:text-white"
              >
                <X aria-hidden size={18} />
              </Button>
            </div>
            <div className={styles.expandedPortrait}>
              <RecapStoryCard
                title={title}
                join={join}
                venue={venue}
                date={date}
                accent={accent}
                recap={recap}
                template={template}
                background={background}
                selectedPhotos={photoSelection.photos}
                collageLayout={collageLayout}
                showMemoryStats={showMemoryStats}
                photoPlaceholder={photoRequired}
                onAddPhoto={() => {
                  setEditorSection("photos");
                  document
                    .getElementById(photoEditorId)
                    ?.scrollIntoView({ behavior: "instant", block: "nearest" });
                }}
                viewerPlayerId={viewerPlayerId}
                theme={theme}
                overlay={overlay}
                photoPosition={photoPosition}
                photoRole={photoRole}
                photoPlacement={photoPlacement}
                sceneBackground={sceneBackground}
                customHeadline={customHeadline}
                customNote={customNote}
                phase={phase}
                storyAsOf={storyAsOf}
                invitation={invitation}
                courtCount={courtCount}
                className="w-full"
              />
            </div>
            <div className="mt-3 grid w-full max-w-md grid-cols-[44px_1fr_44px] items-center gap-2">
              <button
                type="button"
                onClick={() => moveTemplate(-1)}
                className="grid h-11 w-11 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
                aria-label="Previous expanded story"
              >
                <CaretLeft aria-hidden size={18} />
              </button>
              <p
                className="text-center text-xs font-semibold text-white"
                aria-live="polite"
              >
                {activeTemplate.label} · {templateIndex + 1} of{" "}
                {templates.length}
              </p>
              <button
                type="button"
                onClick={() => moveTemplate(1)}
                className="grid h-11 w-11 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
                aria-label="Next expanded story"
              >
                <CaretRight aria-hidden size={18} />
              </button>
            </div>
            <div className={`${styles.actions} w-full max-w-md`}>
              <Button
                type="button"
                onClick={share}
                disabled={
                  pending || photoSelection.adding || qrBlocked || photoRequired
                }
              >
                {pending ? (
                  <ButtonSpinner />
                ) : (
                  <ShareNetwork aria-hidden size={16} />
                )}
                {pending ? "Creating…" : actionLabel}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void download()}
                disabled={
                  pending || photoSelection.adding || qrBlocked || photoRequired
                }
                aria-label="Download PNG"
              >
                <DownloadSimple aria-hidden size={16} />
                Download PNG
              </Button>
            </div>
            {eligibleJoinUrl ? (
              <div className="w-full max-w-md">
                <StoryJoinHelp
                  blocked={qrBlocked}
                  failed={qr?.status === "error"}
                  pending={pending}
                  onLinkOnly={() => void download(true)}
                  className="text-white/70"
                />
              </div>
            ) : null}
            {message ? (
              <p
                role="status"
                className="mt-2 w-full max-w-md text-sm text-white"
              >
                {message}
              </p>
            ) : null}
          </div>
        </Dialog>
      ) : null}
    </div>
  );
}
