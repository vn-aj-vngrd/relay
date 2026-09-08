"use client";

import {
  CaretDown,
  CaretLeft,
  CaretRight,
  Check,
  DownloadSimple,
  ImageSquare,
  ShareNetwork,
  SlidersHorizontal,
  X,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { Button, ButtonSpinner } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { TabChipRail } from "@/components/ui/tab-chip-rail";
import { trackSharedSessionEvent } from "@/features/analytics/actions";
import { sessionAccents } from "@/features/sessions/accent";
import { hasValidImageSignature, isSupportedImageType } from "@/lib/image-file";

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
import { decodeStoryPhoto, drawStoryPhoto } from "./story-photo";
import { drawStoryRecap, storyRecapLayout } from "./story-recap-layout";
import {
  babyPink,
  type StoryPhotoPlacement,
  type StoryPhotoRole,
  storyArtTransform,
  storyScene,
} from "./story-scene";
import { drawStoryTheme, type StoryTheme, storyThemes } from "./story-theme";
import styles from "./story-workspace.module.css";
import { useStoryQr } from "./use-story-qr";

type RecapPhoto = { id: string; url: string; alt: string };

// Story-only colors do not change the game accent or global app palette.
const storyPalette: RecapBackground[] = [babyPink];

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
  const [customBackground, setCustomBackground] =
    useState<RecapBackground | null>(null);
  const backgrounds = useMemo<RecapBackground[]>(
    () => [
      ...[
        gameAccent,
        ...sessionAccents.filter(({ id }) => id !== gameAccent.id),
      ].map((option) => ({
        id: `accent:${option.id}`,
        label: option.label,
        color: option.solid,
      })),
      ...storyPalette,
      ...photos.map((photo) => ({
        id: `photo:${photo.id}`,
        label: photo.alt,
        imageUrl: photo.url,
      })),
      ...(customBackground ? [customBackground] : []),
    ],
    [customBackground, gameAccent, photos]
  );
  const [template, setTemplate] = useState<RecapShareTemplateId>(
    templates[0].id
  );
  const [theme, setTheme] = useState<StoryTheme>("minimal");
  const [backgroundId, setBackgroundId] = useState(`accent:${gameAccent.id}`);
  const [overlay, setOverlay] = useState(55);
  const [photoPosition, setPhotoPosition] = useState(50);
  const [photoRole, setPhotoRole] = useState<StoryPhotoRole>("foreground");
  const [photoPlacement, setPhotoPlacement] =
    useState<StoryPhotoPlacement>("center");
  const [surfaceId, setSurfaceId] = useState(`accent:${gameAccent.id}`);
  const [customHeadline, setCustomHeadline] = useState("Our kind of game.");
  const [customNote, setCustomNote] = useState("");
  const [joinMode, setJoinMode] = useState<StoryJoinMode>("qr");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [customizeSection, setCustomizeSection] = useState<
    "theme" | "background" | "message"
  >("theme");
  const customizeButton = useRef<HTMLButtonElement>(null);
  const customizationId = useId();
  const previewTitleId = useId();
  const previewDialog = useRef<HTMLDialogElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const customPhotoInput = useRef<HTMLInputElement>(null);
  const photoSelection = useRef(0);
  const background =
    backgrounds.find((item) => item.id === backgroundId) ?? backgrounds[0];
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
    if (!templates.some((item) => item.id === template))
      setTemplate(templates[0].id);
  }, [template, templates]);

  useEffect(
    () => () => {
      if (customBackground?.imageUrl?.startsWith("blob:"))
        URL.revokeObjectURL(customBackground.imageUrl);
    },
    [customBackground]
  );

  useEffect(
    () => () => {
      photoSelection.current += 1;
    },
    []
  );

  useEffect(() => {
    if (previewOpen) previewDialog.current?.showModal();
  }, [previewOpen]);

  async function chooseCustomPhoto(file: File | undefined) {
    if (!file) return;
    const selection = ++photoSelection.current;
    if (
      !isSupportedImageType(file.type) ||
      file.size === 0 ||
      file.size > 10 * 1024 * 1024 ||
      !(await hasValidImageSignature(file))
    ) {
      if (selection === photoSelection.current)
        setMessage("Choose a JPG, PNG, or WebP photo under 10 MB.");
      return;
    }
    try {
      const bitmap = await decodeStoryPhoto(file);
      bitmap.close();
    } catch {
      if (selection === photoSelection.current)
        setMessage(
          "This photo couldn’t be read. Choose another JPG, PNG, or WebP."
        );
      return;
    }
    if (selection !== photoSelection.current) return;
    const imageUrl = URL.createObjectURL(file);
    setCustomBackground({
      id: "custom-photo",
      label: file.name,
      imageUrl,
      file,
    });
    setBackgroundId("custom-photo");
    setMessage("Photo added to this story only. It hasn’t been uploaded.");
  }

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
    const surface = scene.framed ? sceneBackground : background;
    context.fillStyle = surface.color ?? "#11131a";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.save();
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
        await drawStoryPhoto(
          context,
          background.file ?? background.imageUrl,
          canvas.width,
          canvas.height,
          photoPosition,
          scene.framed ? scene.photo : undefined
        );
      } catch (error) {
        throw new Error("Selected photo unavailable", { cause: error });
      }
      if (!scene.framed) {
        context.fillStyle = `rgba(8,10,16,${overlay / 100})`;
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
    }

    const light =
      Boolean(surface.light) && (!background.imageUrl || scene.framed);
    const foreground = light ? "#17181d" : "#ffffff";
    const secondary = light ? "rgba(23,24,29,.62)" : "rgba(255,255,255,.68)";
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
    const isInvitation = template === "invitation" || template === "spots";
    context.fillText(
      `RELAY · ${isInvitation ? `GAME INVITE · ${storyAsOf ?? "CURRENT PLAN"}` : phase === "live" ? `LIVE · ${storyAsOf ?? "CURRENT UPDATE"}` : "NIGHT MEMORY"}`,
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
      drawStoryRecap(context, recapCopy, foreground, secondary, rule);
    }
    if (scene.frame) {
      drawStoryTheme(context, theme, scene.frame);
    } else if (theme !== "minimal") {
      const art = storyArtTransform(scene.art);
      context.save();
      context.translate(art.x, art.y);
      context.scale(art.scale, art.scale);
      drawStoryTheme(context, theme);
      context.restore();
    } else {
      drawStoryTheme(context, theme);
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
        <div className="mb-3 flex items-center justify-end gap-3">
          <Button type="button" variant="quiet" onClick={openPreview}>
            Enlarge preview
          </Button>
        </div>
        <div
          className="mb-3 grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${templates.length}, minmax(0, 1fr))`,
          }}
        >
          {templates.map((item) => (
            <span
              key={item.id}
              aria-hidden
              className={`h-1 rounded-full ${item.id === template ? "bg-primary" : "bg-line"}`}
            />
          ))}
        </div>
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
          <button
            type="button"
            onClick={openPreview}
            className="absolute inset-0 z-10 cursor-zoom-in rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-primary/35"
            aria-label="Expand story preview"
          />
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
        <fieldset className="min-w-0">
          <legend className="sr-only">Story focus</legend>
          <div className="mt-3">
            <TabChipRail
              label="Story focus options"
              className={styles.optionRail}
              items={templates.map((item) => ({
                value: item.id,
                label: item.label,
              }))}
              value={template}
              onChange={chooseTemplate}
            />
          </div>
        </fieldset>

        <div className="mt-6 border-y border-line">
          <button
            type="button"
            ref={customizeButton}
            aria-expanded={customizeOpen}
            aria-controls={customizationId}
            onClick={() => setCustomizeOpen((open) => !open)}
            className="flex min-h-14 w-full items-center gap-3 py-2 text-left"
          >
            <SlidersHorizontal
              aria-hidden
              size={19}
              className="shrink-0 text-primary"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">Customize story</span>
              <span className="mt-0.5 block truncate text-xs font-normal text-muted">
                {storyThemes.find((item) => item.id === theme)?.label} ·{" "}
                {background.label}
              </span>
            </span>
            <CaretDown
              aria-hidden
              size={17}
              className={`shrink-0 text-muted transition-transform motion-reduce:transition-none ${customizeOpen ? "rotate-180" : ""}`}
            />
          </button>
          {customizeOpen ? (
            <div id={customizationId} className="min-w-0 pb-4 pt-2">
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
              <TabChipRail
                label="Customize options"
                items={[
                  { value: "theme", label: "Theme" },
                  { value: "background", label: "Background" },
                  { value: "message", label: "Message" },
                ]}
                value={customizeSection}
                onChange={setCustomizeSection}
                variant="underline"
              />
              {customizeSection === "theme" ? (
                <div>
                  <fieldset className="mt-4 min-w-0">
                    <legend className="text-sm font-bold">Theme</legend>
                    <div className="mt-3">
                      <TabChipRail
                        label="Story theme"
                        className={styles.optionRail}
                        items={storyThemes.map((item) => ({
                          value: item.id,
                          label: item.label,
                        }))}
                        value={theme}
                        onChange={setTheme}
                      />
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted">
                      {
                        storyThemes.find((item) => item.id === theme)
                          ?.description
                      }
                    </p>
                  </fieldset>
                </div>
              ) : null}

              {customizeSection === "background" ? (
                <div>
                  <fieldset className="mt-4 min-w-0">
                    <legend className="text-sm font-bold">Background</legend>
                    <div
                      className="mt-3 flex max-h-52 flex-wrap gap-2 overflow-y-auto p-1"
                      role="group"
                      aria-label="Story background"
                    >
                      {backgrounds.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          aria-label={
                            item.imageUrl
                              ? item.label
                              : `${item.label} background`
                          }
                          aria-pressed={
                            backgroundId === item.id ||
                            (scene.framed && surfaceId === item.id)
                          }
                          onClick={() => {
                            if (!item.imageUrl) setSurfaceId(item.id);
                            if (item.imageUrl || !scene.framed)
                              setBackgroundId(item.id);
                          }}
                          className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 outline-none focus-visible:ring-3 focus-visible:ring-primary/25 ${backgroundId === item.id || (scene.framed && surfaceId === item.id) ? "border-primary" : "border-transparent"}`}
                          style={{ backgroundColor: item.color }}
                        >
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt=""
                              fill
                              sizes="56px"
                              unoptimized={item.imageUrl.startsWith("blob:")}
                              className="object-cover"
                            />
                          ) : null}
                          {backgroundId === item.id ||
                          (scene.framed && surfaceId === item.id) ? (
                            <span className="absolute inset-0 grid place-items-center bg-black/25 text-white">
                              <Check aria-hidden size={17} weight="bold" />
                            </span>
                          ) : null}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => customPhotoInput.current?.click()}
                        className="grid h-14 w-14 place-items-center rounded-lg border border-dashed border-line text-muted hover:border-primary hover:text-primary"
                        aria-label="Add a story photo"
                      >
                        <ImageSquare aria-hidden size={21} />
                      </button>
                      <input
                        ref={customPhotoInput}
                        type="file"
                        aria-label="Choose story photo file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          void chooseCustomPhoto(file);
                        }}
                      />
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted">
                      Device photos stay local. To share them with the game, add
                      them separately in Photos.
                    </p>
                  </fieldset>

                  {background.imageUrl ? (
                    <div className="mt-4 grid gap-4">
                      <fieldset className="min-w-0">
                        <legend className="mb-2 text-sm font-semibold">
                          Photo role
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
                      {scene.framed ? (
                        <fieldset className="min-w-0">
                          <legend className="mb-2 text-sm font-semibold">
                            Photo placement
                          </legend>
                          <TabChipRail
                            label="Photo placement options"
                            items={[
                              { value: "top", label: "Top" },
                              { value: "center", label: "Center" },
                              { value: "bottom", label: "Bottom" },
                            ]}
                            value={photoPlacement}
                            onChange={setPhotoPlacement}
                          />
                          <p className="mt-2 text-xs text-muted">
                            Moves the framed photo; game details fit in a
                            separate space. Color swatches change the paper.
                          </p>
                        </fieldset>
                      ) : null}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-sm font-semibold">
                          Photo crop
                          <input
                            type="range"
                            aria-label="Photo crop"
                            min="0"
                            max="100"
                            value={photoPosition}
                            onChange={(event) =>
                              setPhotoPosition(Number(event.target.value))
                            }
                            className="mt-1 min-h-11 w-full accent-primary"
                          />
                          <span className="mt-1 block text-xs font-normal text-muted">
                            Move the crop from top to bottom.
                          </span>
                        </label>
                        {!scene.framed ? (
                          <label className="text-sm font-semibold">
                            Text contrast
                            <input
                              type="range"
                              aria-label="Text contrast"
                              min="20"
                              max="80"
                              value={overlay}
                              onChange={(event) =>
                                setOverlay(Number(event.target.value))
                              }
                              className="mt-1 min-h-11 w-full accent-primary"
                            />
                            <span className="mt-1 block text-xs font-normal text-muted">
                              Darken the photo behind the story.
                            </span>
                          </label>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {customizeSection === "message" ? (
                <fieldset className="mt-4 min-w-0">
                  <legend className="text-sm font-bold">Message</legend>
                  {template === "custom" ? (
                    <label className="mt-3 block text-sm font-semibold">
                      Headline
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
                  ) : null}
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
                </fieldset>
              ) : null}
              <Button
                type="button"
                variant="quiet"
                className="mt-4"
                onClick={() => {
                  setCustomizeOpen(false);
                  customizeButton.current?.focus();
                }}
              >
                Done customizing
              </Button>
            </div>
          ) : null}
        </div>
        <div className={styles.actions}>
          <Button type="button" onClick={share} disabled={pending || qrBlocked}>
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
            disabled={pending || qrBlocked}
          >
            <DownloadSimple aria-hidden size={16} />
            Download PNG
          </Button>
        </div>
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
                disabled={pending || qrBlocked}
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
                disabled={pending || qrBlocked}
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
