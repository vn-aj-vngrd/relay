"use client";

import {
  CaretLeft,
  CaretRight,
  Check,
  Copy,
  DownloadSimple,
  ImageSquare,
  ShareNetwork,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button, ButtonSpinner } from "@/components/ui/button";
import { TabChipRail } from "@/components/ui/tab-chip-rail";
import { trackSharedSessionEvent } from "@/features/analytics/actions";
import { GameQrShare } from "@/features/sessions/game-qr-share";
import { hasValidImageSignature, isSupportedImageType } from "@/lib/image-file";

import type { SessionRecap } from "./recap";
import {
  invitationStateLabel,
  type RecapShareTemplateId,
  recapShareTemplates,
  type StoryInvitationFacts,
  type StoryPhase,
  viewerStanding,
} from "./recap-share";
import {
  type RecapBackground,
  RecapStoryCard,
  type RecapStoryLayout,
} from "./recap-story-card";

type RecapPhoto = { id: string; url: string; alt: string };

const baseBackgrounds: RecapBackground[] = [
  { id: "court", label: "Court", color: "#18233b" },
  { id: "ink", label: "Ink", color: "#11131a" },
  { id: "paper", label: "Paper", color: "#f4f3ef", light: true },
  { id: "electric", label: "Electric", color: "#4f56c9" },
  { id: "coral", label: "Coral", color: "#a9433f" },
  { id: "optic", label: "Optic", color: "#b7d62e", light: true },
];

const storyLayouts: Array<{
  id: RecapStoryLayout;
  label: string;
  description: string;
}> = [
  { id: "courtside", label: "Courtside", description: "Low and bold" },
  { id: "center", label: "Center court", description: "Balanced focus" },
  { id: "poster", label: "Poster", description: "Headline first" },
  { id: "snapshot", label: "Snapshot", description: "Framed over a photo" },
];

function setFont(
  context: CanvasRenderingContext2D,
  size: number,
  weight = 700,
  mono = false
) {
  context.font = `${weight} ${size}px ${mono ? "ui-monospace, SFMono-Regular, monospace" : "Inter, Arial, sans-serif"}`;
}

function fitText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  minimum = 38
) {
  let size = startSize;
  while (size > minimum) {
    setFont(context, size);
    if (context.measureText(text).width <= maxWidth) break;
    size -= 4;
  }
  return size;
}

async function drawPhoto(
  context: CanvasRenderingContext2D,
  url: string,
  width: number,
  height: number,
  photoPosition: number
) {
  const response = await fetch(url);
  const bitmap = await createImageBitmap(await response.blob());
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
}

function signed(value: number) {
  return `${value > 0 ? "+" : ""}${value}`;
}

function drawRule(context: CanvasRenderingContext2D, y: number, color: string) {
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(72, y);
  context.lineTo(1008, y);
  context.stroke();
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  firstBaseline: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 2
) {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    } else {
      line = candidate;
    }
  }
  if (line && lines.length < maxLines) {
    const consumed = lines.join(" ").split(/\s+/).filter(Boolean).length;
    const remaining = words.slice(consumed).join(" ");
    let finalLine = remaining || line;
    while (
      context.measureText(finalLine).width > maxWidth &&
      finalLine.length > 1
    ) {
      finalLine = `${finalLine.slice(0, -2).trimEnd()}…`;
    }
    lines.push(finalLine);
  }
  lines.forEach((value, index) =>
    context.fillText(value, x, firstBaseline + index * lineHeight, maxWidth)
  );
  return firstBaseline + (lines.length - 1) * lineHeight;
}

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
  sharedUrl,
  storyAsOf,
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
  sharedUrl?: string;
  storyAsOf?: string;
}) {
  const templates = useMemo(
    () => recapShareTemplates(recap, viewerPlayerId, phase),
    [phase, recap, viewerPlayerId]
  );
  const [customBackground, setCustomBackground] =
    useState<RecapBackground | null>(null);
  const backgrounds = useMemo<RecapBackground[]>(
    () => [
      ...baseBackgrounds,
      ...photos.map((photo) => ({
        id: `photo:${photo.id}`,
        label: photo.alt,
        imageUrl: photo.url,
      })),
      ...(customBackground ? [customBackground] : []),
    ],
    [customBackground, photos]
  );
  const [template, setTemplate] = useState<RecapShareTemplateId>(
    templates[0].id
  );
  const [layout, setLayout] = useState<RecapStoryLayout>("courtside");
  const [backgroundId, setBackgroundId] = useState("court");
  const [overlay, setOverlay] = useState(55);
  const [photoPosition, setPhotoPosition] = useState(50);
  const [customHeadline, setCustomHeadline] = useState("Our kind of game.");
  const [customNote, setCustomNote] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const touchStart = useRef<number | null>(null);
  const customPhotoInput = useRef<HTMLInputElement>(null);
  const background =
    backgrounds.find((item) => item.id === backgroundId) ?? backgrounds[0];
  const templateIndex = templates.findIndex((item) => item.id === template);
  const activeTemplate = templates[templateIndex] ?? templates[0];

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

  async function chooseCustomPhoto(file: File | undefined) {
    if (!file) return;
    if (
      !isSupportedImageType(file.type) ||
      file.size === 0 ||
      file.size > 10 * 1024 * 1024 ||
      !(await hasValidImageSignature(file))
    ) {
      setMessage("Choose a JPG, PNG, or WebP photo under 10 MB.");
      return;
    }
    const imageUrl = URL.createObjectURL(file);
    setCustomBackground({ id: "custom-photo", label: file.name, imageUrl });
    setBackgroundId("custom-photo");
    setLayout("snapshot");
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

  async function createCard() {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");

    context.fillStyle = background.color ?? "#11131a";
    context.fillRect(0, 0, canvas.width, canvas.height);
    if (background.imageUrl) {
      try {
        await drawPhoto(
          context,
          background.imageUrl,
          canvas.width,
          canvas.height,
          photoPosition
        );
      } catch (error) {
        throw new Error("Selected photo unavailable", { cause: error });
      }
      context.fillStyle = `rgba(8,10,16,${overlay / 100})`;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    const light = Boolean(background.light) && !background.imageUrl;
    const foreground = light ? "#17181d" : "#ffffff";
    const secondary = light ? "rgba(23,24,29,.62)" : "rgba(255,255,255,.68)";
    const rule = light ? "rgba(23,24,29,.18)" : "rgba(255,255,255,.22)";

    context.fillStyle = accent;
    context.beginPath();
    context.arc(82, 84, 10, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = foreground;
    setFont(context, 30);
    context.fillText(
      `RELAY · ${phase === "published" ? `GAME INVITE · ${storyAsOf ?? "CURRENT PLAN"}` : phase === "live" ? `LIVE · ${storyAsOf ?? "CURRENT UPDATE"}` : "NIGHT MEMORY"}`,
      112,
      94
    );

    const contentOffset =
      layout === "poster" ? -500 : layout === "center" ? -250 : 0;
    if (layout === "snapshot") {
      context.fillStyle = light ? "rgba(255,255,255,.82)" : "rgba(8,10,16,.62)";
      context.fillRect(48, 820, 984, 1020);
      context.strokeStyle = rule;
      context.lineWidth = 2;
      context.strokeRect(48, 820, 984, 1020);
    }
    context.save();
    context.translate(0, contentOffset);

    if (template === "invitation" && invitation) {
      context.fillStyle = foreground;
      setFont(context, 72);
      drawWrappedText(context, title, 72, 1080, 936, 82, 2);
      context.fillStyle = secondary;
      setFont(context, 29, 500);
      drawWrappedText(context, `${date} · ${venue}`, 72, 1265, 936, 38, 2);
      setFont(context, 27, 600);
      context.fillText(`Hosted by ${invitation.hostName}`, 72, 1365, 936);
      drawRule(context, 1415, rule);
      context.fillStyle = foreground;
      setFont(context, 62, 700, true);
      context.fillText(invitation.priceLabel, 72, 1515);
      context.textAlign = "right";
      context.fillText(
        `${invitation.goingCount}/${invitation.capacity}`,
        1008,
        1515
      );
      context.textAlign = "left";
      context.fillStyle = secondary;
      setFont(context, 27, 500);
      context.fillText("per player", 72, 1565);
      context.textAlign = "right";
      context.fillText("Going", 1008, 1565);
      context.textAlign = "left";
      drawRule(context, 1615, rule);
      context.fillText(invitationStateLabel(invitation), 72, 1675, 936);
    }

    if (template === "spots" && invitation) {
      const spots = Math.max(0, invitation.capacity - invitation.goingCount);
      context.fillStyle = secondary;
      setFont(context, 28);
      context.fillText("WHO’S IN?", 72, 1020);
      context.fillStyle = foreground;
      setFont(context, invitation.waitlistOpen ? 132 : 190, 700, true);
      context.fillText(
        invitation.waitlistOpen ? "FULL" : String(spots),
        72,
        1250
      );
      context.fillStyle = secondary;
      setFont(context, 31, 500);
      context.fillText(
        invitation.waitlistOpen
          ? "Waitlist open"
          : `${spots} ${spots === 1 ? "spot" : "spots"} open`,
        72,
        1320
      );
      drawRule(context, 1390, rule);
      context.fillStyle = foreground;
      setFont(context, 54, 700);
      drawWrappedText(context, title, 72, 1470, 936, 62, 2);
      context.fillStyle = secondary;
      setFont(context, 28, 500);
      drawWrappedText(context, `${date} · ${venue}`, 72, 1615, 936, 36, 2);
      setFont(context, 27, 600);
      context.fillText(`Hosted by ${invitation.hostName}`, 72, 1680, 936);
    }

    if (template === "live") {
      context.fillStyle = secondary;
      setFont(context, 28);
      context.fillText(`LIVE · AS OF ${storyAsOf ?? "THIS UPDATE"}`, 72, 1020);
      context.fillStyle = foreground;
      setFont(context, 72);
      drawWrappedText(context, title, 72, 1120, 936, 82, 2);
      context.fillStyle = secondary;
      setFont(context, 30, 500);
      drawWrappedText(context, venue, 72, 1290, 936, 38, 2);
      drawRule(context, 1380, rule);
      context.fillStyle = foreground;
      setFont(context, 68, 700, true);
      context.fillText(String(recap.matchCount), 72, 1500);
      context.textAlign = "right";
      context.fillText(String(courtCount), 1008, 1500);
      context.textAlign = "left";
      context.fillStyle = secondary;
      setFont(context, 27, 500);
      context.fillText("completed matches", 72, 1550);
      context.textAlign = "right";
      context.fillText(
        courtCount === 1 ? "planned court" : "planned courts",
        1008,
        1550
      );
      context.textAlign = "left";
    }

    if (template === "live-pulse") {
      context.fillStyle = secondary;
      setFont(context, 28);
      context.fillText("MATCH PULSE", 72, 1030);
      context.fillStyle = foreground;
      setFont(context, 190, 700, true);
      context.fillText(String(recap.matchCount), 72, 1280);
      context.fillStyle = secondary;
      setFont(context, 31, 500);
      context.fillText(
        recap.matchCount === 1
          ? "match complete at this snapshot"
          : "matches complete at this snapshot",
        72,
        1350
      );
      drawRule(context, 1420, rule);
      context.fillStyle = foreground;
      setFont(context, 54, 700);
      drawWrappedText(context, title, 72, 1500, 936, 62, 2);
      context.fillStyle = secondary;
      setFont(context, 30, 500);
      drawWrappedText(context, `Live at ${venue}`, 72, 1650, 936, 38, 2);
    }

    if (template === "overview") {
      context.fillStyle = foreground;
      setFont(context, fitText(context, title, 936, 84));
      context.fillText(title, 72, 1200, 936);
      context.fillStyle = secondary;
      setFont(context, 32, 500);
      context.fillText(`${date} · ${venue}`, 72, 1260, 936);
      drawRule(context, 1350, rule);
      const stats = [
        [String(recap.matchCount), "matches"],
        [String(recap.totalPoints), "points"],
        [recap.playMinutes ? String(recap.playMinutes) : "—", "minutes"],
      ];
      stats.forEach(([value, label], index) => {
        const x = 72 + index * 312;
        context.fillStyle = foreground;
        setFont(context, 68, 700, true);
        context.fillText(value, x, 1450);
        context.fillStyle = secondary;
        setFont(context, 27, 500);
        context.fillText(label, x, 1495);
      });
      drawRule(context, 1565, rule);
    }

    if (template === "personal") {
      const personal = viewerStanding(recap, viewerPlayerId);
      if (personal) {
        context.fillStyle = secondary;
        setFont(context, 28);
        context.fillText("MY GAME", 72, 1080);
        context.fillStyle = foreground;
        setFont(context, 150, 700, true);
        context.fillText(`${personal.wins}–${personal.losses}`, 72, 1250);
        setFont(context, fitText(context, personal.name, 936, 72));
        context.fillText(personal.name, 72, 1340, 936);
        drawRule(context, 1420, rule);
        const stats = [
          [`#${personal.rank}`, "standing"],
          [signed(personal.differential), "point diff"],
          [`${Math.round(personal.winPercentage * 100)}%`, "wins"],
        ];
        stats.forEach(([value, label], index) => {
          const x = 72 + index * 312;
          context.fillStyle = foreground;
          setFont(context, 60, 700, true);
          context.fillText(value, x, 1530);
          context.fillStyle = secondary;
          setFont(context, 27, 500);
          context.fillText(label, x, 1575);
        });
      }
    }

    if (template === "winning-team" && recap.topPair) {
      context.fillStyle = secondary;
      setFont(context, 28);
      context.fillText("WINNING TEAM", 72, 1080);
      const names = recap.topPair.names.join(" + ");
      context.fillStyle = foreground;
      setFont(context, fitText(context, names, 936, 82));
      context.fillText(names, 72, 1190, 936);
      setFont(context, 170, 700, true);
      context.fillText(String(recap.topPair.wins), 72, 1420);
      context.fillStyle = secondary;
      setFont(context, 31, 500);
      context.fillText(
        `${recap.topPair.wins === 1 ? "win" : "wins"} together · ${recap.topPair.played} played`,
        72,
        1480
      );
    }

    if (template === "leader" && recap.standout) {
      context.fillStyle = secondary;
      setFont(context, 28);
      context.fillText("TOP OF THE TABLE", 72, 1080);
      context.fillStyle = foreground;
      setFont(context, fitText(context, recap.standout.name, 936, 82));
      context.fillText(recap.standout.name, 72, 1190, 936);
      setFont(context, 160, 700, true);
      context.fillText(
        `${recap.standout.wins}–${recap.standout.losses}`,
        72,
        1400
      );
      context.fillStyle = secondary;
      setFont(context, 31, 500);
      context.fillText(
        `${signed(recap.standout.differential)} point difference · ${Math.round(recap.standout.winPercentage * 100)}% wins`,
        72,
        1470
      );
    }

    if (template === "standings") {
      context.fillStyle = foreground;
      setFont(context, 68);
      context.fillText("Session Standings", 72, 980);
      recap.standings.slice(0, 5).forEach((row, index) => {
        const y = 1080 + index * 115;
        drawRule(context, y - 46, rule);
        context.fillStyle = secondary;
        setFont(context, 30, 600, true);
        context.fillText(String(index + 1), 72, y);
        context.fillStyle = foreground;
        setFont(context, fitText(context, row.name, 540, 40, 30));
        context.fillText(row.name, 135, y, 540);
        context.textAlign = "right";
        setFont(context, 34, 700, true);
        context.fillText(
          `${row.wins}–${row.losses} · ${signed(row.differential)}`,
          1008,
          y
        );
        context.textAlign = "left";
      });
    }

    if (template === "closest" && recap.closestMatch) {
      context.fillStyle = secondary;
      setFont(context, 28);
      context.fillText("CLOSEST FINISH", 72, 1060);
      context.fillStyle = foreground;
      setFont(context, 172, 700, true);
      context.fillText(recap.closestMatch.score, 72, 1270);
      const teams = `${recap.closestMatch.teamA.join(" + ")}  vs  ${recap.closestMatch.teamB.join(" + ")}`;
      setFont(context, fitText(context, teams, 936, 46, 30));
      context.fillText(teams, 72, 1380, 936);
      context.fillStyle = secondary;
      setFont(context, 30, 500);
      context.fillText(
        `${recap.closestMatch.courtLabel} · ${recap.closestMatch.margin}-point margin`,
        72,
        1450
      );
    }

    if (template === "court" && recap.busiestCourt) {
      context.fillStyle = secondary;
      setFont(context, 28);
      context.fillText("BUSIEST COURT", 72, 1080);
      context.fillStyle = foreground;
      setFont(context, fitText(context, recap.busiestCourt.label, 936, 86));
      context.fillText(recap.busiestCourt.label, 72, 1190, 936);
      setFont(context, 180, 700, true);
      context.fillText(String(recap.busiestCourt.matches), 72, 1430);
      context.fillStyle = secondary;
      setFont(context, 31, 500);
      context.fillText(
        recap.busiestCourt.matches === 1
          ? "match played here"
          : "matches played here",
        72,
        1490
      );
    }

    if (template === "points") {
      context.fillStyle = secondary;
      setFont(context, 28);
      context.fillText("POINTS PLAYED", 72, 1080);
      context.fillStyle = foreground;
      setFont(context, 190, 700, true);
      context.fillText(String(recap.totalPoints), 72, 1330);
      context.fillStyle = secondary;
      setFont(context, 31, 500);
      context.fillText(
        `across ${recap.matchCount} ${recap.matchCount === 1 ? "match" : "matches"}`,
        72,
        1400
      );
    }

    if (template === "court-time") {
      context.fillStyle = secondary;
      setFont(context, 28);
      context.fillText("COURT TIME", 72, 1080);
      context.fillStyle = foreground;
      setFont(context, 190, 700, true);
      context.fillText(String(recap.playMinutes), 72, 1330);
      context.fillStyle = secondary;
      setFont(context, 31, 500);
      context.fillText("minutes of play together", 72, 1400);
    }

    if (template === "crew") {
      context.fillStyle = secondary;
      setFont(context, 28);
      context.fillText("THE CREW", 72, 1060);
      const names = recap.standings.map((row) => row.name).join(" · ");
      context.fillStyle = foreground;
      setFont(context, fitText(context, names, 936, 76, 34));
      context.fillText(names, 72, 1190, 936);
      context.fillStyle = secondary;
      setFont(context, 31, 500);
      context.fillText(
        `${recap.standings.length} players · one game`,
        72,
        1390
      );
    }

    if (template === "custom") {
      context.fillStyle = secondary;
      setFont(context, 28);
      context.fillText("OUR NIGHT", 72, 1060);
      context.fillStyle = foreground;
      setFont(context, fitText(context, customHeadline || title, 936, 88, 42));
      context.fillText(customHeadline || title, 72, 1190, 936);
      context.fillStyle = secondary;
      setFont(context, 31, 500);
      context.fillText(`${date} · ${venue}`, 72, 1280, 936);
    }

    if (customNote) {
      const noteRuleY = phase === "published" ? 1730 : 1580;
      drawRule(context, noteRuleY, rule);
      context.fillStyle = foreground;
      setFont(context, 30, 600);
      drawWrappedText(context, customNote, 72, noteRuleY + 55, 936, 38, 2);
    }
    context.restore();

    context.fillStyle = secondary;
    setFont(context, 26, 500);
    context.fillText(
      "Pickleball with friends, kept together in Relay.",
      72,
      1880,
      936
    );
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

  async function download() {
    setPending(true);
    setMessage("");
    try {
      const file = storyFile(await createCard());
      saveFile(file);
      setMessage("Story downloaded at 1080 × 1920.");
    } catch {
      setMessage(
        "The story image couldn’t be created. Try another photo or background."
      );
    } finally {
      setPending(false);
    }
  }

  async function copyLink() {
    if (!sharedUrl) return;
    try {
      await navigator.clipboard.writeText(
        new URL(sharedUrl, window.location.origin).toString()
      );
      setMessage(
        phase === "published" ? "Game link copied." : "Story link copied."
      );
      trackStoryShare(
        sessionId,
        phase === "completed" ? "recap_shared" : "invite_shared"
      );
    } catch {
      setMessage("The link couldn’t be copied. Try again.");
    }
  }

  async function share() {
    setPending(true);
    setMessage("");
    try {
      const file = storyFile(await createCard());
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
          "The story image couldn’t be created. Try another photo or background."
        );
    } finally {
      setPending(false);
    }
  }

  const actionLabel =
    phase === "published"
      ? "Share invitation"
      : phase === "live"
        ? "Share live update"
        : "Share story";

  return (
    <div className="grid items-start gap-7 md:grid-cols-[260px_1fr]">
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
        onTouchStart={(event) => {
          touchStart.current = event.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          if (touchStart.current === null) return;
          const distance =
            (event.changedTouches[0]?.clientX ?? touchStart.current) -
            touchStart.current;
          touchStart.current = null;
          if (Math.abs(distance) > 44) moveTemplate(distance > 0 ? -1 : 1);
        }}
        className="mx-auto w-full max-w-[280px] rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-primary/25 md:sticky md:top-4 md:max-w-none"
      >
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
              className={`h-1 rounded-full ${item.id === template ? "bg-primary" : "bg-surface-raised"}`}
            />
          ))}
        </div>
        <RecapStoryCard
          title={title}
          venue={venue}
          date={date}
          accent={accent}
          recap={recap}
          template={template}
          background={background}
          viewerPlayerId={viewerPlayerId}
          layout={layout}
          overlay={overlay}
          photoPosition={photoPosition}
          customHeadline={customHeadline}
          customNote={customNote}
          phase={phase}
          storyAsOf={storyAsOf}
          invitation={invitation}
          courtCount={courtCount}
          className="w-full shadow-[0_3px_8px_rgb(20_24_34_/_0.12)]"
        />
        <div className="mt-3 grid grid-cols-[44px_1fr_44px] items-center gap-2">
          <button
            type="button"
            onClick={() => moveTemplate(-1)}
            className="grid h-11 w-11 place-items-center rounded-lg text-muted hover:bg-surface-strong hover:text-ink"
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
            className="grid h-11 w-11 place-items-center rounded-lg text-muted hover:bg-surface-strong hover:text-ink"
            aria-label="Next story"
          >
            <CaretRight aria-hidden size={17} />
          </button>
        </div>
      </div>
      <div className="min-w-0">
        <fieldset>
          <legend className="font-bold">Focus</legend>
          <p className="mt-1 text-sm leading-6 text-muted">
            {phase === "completed"
              ? "Choose a factual highlight from the final game."
              : phase === "live"
                ? "Only safe progress from the courts is included."
                : "Share the current plan as a truthful invitation."}
          </p>
          <TabChipRail
            label="Story focus"
            items={templates.map((item) => ({
              value: item.id,
              label: item.label,
            }))}
            value={template}
            onChange={chooseTemplate}
            className="mt-2"
            itemClassName="!min-h-11"
          />
        </fieldset>

        <details className="mt-6 border-y border-line py-1">
          <summary className="flex min-h-11 cursor-pointer items-center font-bold">
            Customize
          </summary>
          <div className="pb-6 pt-3">
            <fieldset>
              <legend className="font-bold">Look</legend>
              <TabChipRail
                label="Story look"
                items={storyLayouts.map((item) => ({
                  value: item.id,
                  label: item.label,
                }))}
                value={layout}
                onChange={setLayout}
                className="mt-2"
                itemClassName="!min-h-11"
              />
            </fieldset>

            <fieldset className="mt-7">
              <legend className="font-bold">Choose a background</legend>
              <p className="mt-1 text-sm leading-6 text-muted">
                Pick a Relay color, a session photo, or a private photo from
                this device.
              </p>
              <div
                className="mt-3 flex flex-wrap gap-2"
                role="radiogroup"
                aria-label="Story background"
              >
                {backgrounds.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-label={
                      item.imageUrl ? item.label : `${item.label} background`
                    }
                    aria-checked={backgroundId === item.id}
                    onClick={() => setBackgroundId(item.id)}
                    className={`relative h-14 w-14 overflow-hidden rounded-lg border-2 ${backgroundId === item.id ? "border-primary" : "border-transparent"}`}
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
                    {backgroundId === item.id ? (
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
                  aria-label="Add a background photo"
                >
                  <ImageSquare aria-hidden size={21} />
                </button>
                <input
                  ref={customPhotoInput}
                  type="file"
                  aria-label="Choose background photo file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) =>
                    void chooseCustomPhoto(event.target.files?.[0])
                  }
                />
              </div>
              <p className="mt-2 text-xs leading-5 text-muted">
                Device photos stay local unless you separately add them to the
                session below.
              </p>
            </fieldset>

            {background.imageUrl ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-semibold">
                  Photo position
                  <input
                    type="range"
                    aria-label="Photo position"
                    min="0"
                    max="100"
                    value={photoPosition}
                    onChange={(event) =>
                      setPhotoPosition(Number(event.target.value))
                    }
                    className="mt-3 w-full accent-primary"
                  />
                  <span className="mt-1 block text-xs font-normal text-muted">
                    Move the crop from top to bottom.
                  </span>
                </label>
                <label className="text-sm font-semibold">
                  Text contrast
                  <input
                    type="range"
                    aria-label="Text contrast"
                    min="20"
                    max="80"
                    value={overlay}
                    onChange={(event) => setOverlay(Number(event.target.value))}
                    className="mt-3 w-full accent-primary"
                  />
                  <span className="mt-1 block text-xs font-normal text-muted">
                    Darken the photo behind the story.
                  </span>
                </label>
              </div>
            ) : null}

            <fieldset className="mt-7">
              <legend className="font-bold">Add your words</legend>
              <p className="mt-1 text-sm leading-6 text-muted">
                Keep it short enough to read before the story advances.
              </p>
              {template === "custom" ? (
                <label className="mt-3 block text-sm font-semibold">
                  Headline
                  <input
                    value={customHeadline}
                    onChange={(event) => setCustomHeadline(event.target.value)}
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
          </div>
        </details>

        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            onClick={share}
            disabled={pending}
            className="w-full sm:w-auto"
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
            onClick={download}
            disabled={pending}
            className="w-full sm:w-auto"
          >
            <DownloadSimple aria-hidden size={16} />
            Download PNG
          </Button>
          {sharedUrl ? (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void copyLink()}
              >
                <Copy aria-hidden size={16} />
                Copy link
              </Button>
              {sessionId ? (
                <GameQrShare
                  url={sharedUrl}
                  title={title}
                  details={`${date} · ${venue}`}
                  sessionId={sessionId}
                  heading={`Scan to open ${title}`}
                  description="Open the game in Relay from another phone."
                  scanLabel="Scan to open game"
                  event={
                    phase === "completed" ? "recap_shared" : "invite_shared"
                  }
                />
              ) : null}
            </>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-muted">
          Exports a 1080 × 1920 image for Instagram, Facebook, and chat apps.
        </p>
        {message ? (
          <p role="status" className="mt-2 text-sm font-medium text-muted">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
