"use client";

import { CaretLeft, CaretRight, Check, ShareNetwork } from "@phosphor-icons/react";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";

import { Button, ButtonSpinner } from "@/components/ui/button";

import type { SessionRecap } from "./recap";
import { type RecapShareTemplateId, recapShareTemplates, viewerStanding } from "./recap-share";
import { type RecapBackground, RecapStoryCard } from "./recap-story-card";

type RecapPhoto = { id: string; url: string; alt: string };

const baseBackgrounds: RecapBackground[] = [
  { id: "court", label: "Court", color: "#18233b" },
  { id: "ink", label: "Ink", color: "#11131a" },
  { id: "paper", label: "Paper", color: "#f4f3ef", light: true },
];

function setFont(context: CanvasRenderingContext2D, size: number, weight = 700, mono = false) {
  context.font = `${weight} ${size}px ${mono ? "ui-monospace, SFMono-Regular, monospace" : "Inter, Arial, sans-serif"}`;
}

function fitText(context: CanvasRenderingContext2D, text: string, maxWidth: number, startSize: number, minimum = 38) {
  let size = startSize;
  while (size > minimum) {
    setFont(context, size);
    if (context.measureText(text).width <= maxWidth) break;
    size -= 4;
  }
  return size;
}

async function drawPhoto(context: CanvasRenderingContext2D, url: string, width: number, height: number) {
  const response = await fetch(url);
  const bitmap = await createImageBitmap(await response.blob());
  const scale = Math.max(width / bitmap.width, height / bitmap.height);
  const drawWidth = bitmap.width * scale;
  const drawHeight = bitmap.height * scale;
  context.drawImage(bitmap, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
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

export function RecapShareCard({
  title,
  venue,
  date,
  accent,
  recap,
  photos,
  viewerPlayerId,
}: {
  title: string;
  venue: string;
  date: string;
  accent: string;
  recap: SessionRecap;
  photos: RecapPhoto[];
  viewerPlayerId?: string | null;
}) {
  const templates = useMemo(() => recapShareTemplates(recap, viewerPlayerId), [recap, viewerPlayerId]);
  const backgrounds = useMemo<RecapBackground[]>(
    () => [
      ...baseBackgrounds,
      ...photos.map((photo) => ({ id: `photo:${photo.id}`, label: photo.alt, imageUrl: photo.url })),
    ],
    [photos],
  );
  const [template, setTemplate] = useState<RecapShareTemplateId>(templates[0].id);
  const [backgroundId, setBackgroundId] = useState("court");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const touchStart = useRef<number | null>(null);
  const background = backgrounds.find((item) => item.id === backgroundId) ?? backgrounds[0];
  const templateIndex = templates.findIndex((item) => item.id === template);
  const activeTemplate = templates[templateIndex] ?? templates[0];

  function chooseTemplate(id: RecapShareTemplateId) {
    setTemplate(id);
    setMessage("");
  }

  function moveTemplate(direction: -1 | 1) {
    const next = (templateIndex + direction + templates.length) % templates.length;
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
        await drawPhoto(context, background.imageUrl, canvas.width, canvas.height);
      } catch {
        // Keep the card shareable if a signed image expires while the page is open.
      }
      context.fillStyle = "rgba(8,10,16,.58)";
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
    context.fillText("RELAY · SESSION RECAP", 112, 94);

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
        1480,
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
      context.fillText(`${recap.standout.wins}–${recap.standout.losses}`, 72, 1400);
      context.fillStyle = secondary;
      setFont(context, 31, 500);
      context.fillText(
        `${signed(recap.standout.differential)} point difference · ${Math.round(recap.standout.winPercentage * 100)}% wins`,
        72,
        1470,
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
        context.fillText(`${row.wins}–${row.losses} · ${signed(row.differential)}`, 1008, y);
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
      context.fillText(`${recap.closestMatch.courtLabel} · ${recap.closestMatch.margin}-point margin`, 72, 1450);
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
      context.fillText(recap.busiestCourt.matches === 1 ? "match played here" : "matches played here", 72, 1490);
    }

    context.fillStyle = secondary;
    setFont(context, 26, 500);
    context.fillText("Pickleball with friends, kept together in Relay.", 72, 1810, 936);
    return new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Image unavailable"))), "image/png"),
    );
  }

  async function share() {
    setPending(true);
    setMessage("");
    try {
      const blob = await createCard();
      const file = new File([blob], `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-relay-recap.png`, {
        type: "image/png",
      });
      if (navigator.share && navigator.maxTouchPoints > 0 && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: `${title} · Relay recap`, files: [file] });
        setMessage("Recap ready to share.");
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        link.click();
        URL.revokeObjectURL(url);
        setMessage("Recap downloaded.");
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        setMessage("The recap image couldn’t be created. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid items-start gap-7 md:grid-cols-[260px_1fr]">
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Shareable recap stories"
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
          const distance = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
          touchStart.current = null;
          if (Math.abs(distance) > 44) moveTemplate(distance > 0 ? -1 : 1);
        }}
        className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-primary/25"
      >
        <div className="mb-3 grid gap-1" style={{ gridTemplateColumns: `repeat(${templates.length}, minmax(0, 1fr))` }}>
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
          className="w-full shadow-[0_3px_8px_rgb(20_24_34_/_0.12)]"
        />
        <div className="mt-3 grid grid-cols-[36px_1fr_36px] items-center gap-2">
          <button
            type="button"
            onClick={() => moveTemplate(-1)}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-strong hover:text-ink"
            aria-label="Previous recap story"
          >
            <CaretLeft aria-hidden size={17} />
          </button>
          <p className="text-center text-xs font-semibold" aria-live="polite">
            {activeTemplate.label} · {templateIndex + 1} of {templates.length}
          </p>
          <button
            type="button"
            onClick={() => moveTemplate(1)}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-strong hover:text-ink"
            aria-label="Next recap story"
          >
            <CaretRight aria-hidden size={17} />
          </button>
        </div>
      </div>
      <div className="min-w-0">
        <fieldset>
          <legend className="font-bold">Choose a story</legend>
          <p className="mt-1 text-sm leading-6 text-muted">Swipe the portrait or choose one true highlight.</p>
          <div className="mt-3 divide-y divide-line border-y border-line">
            {templates.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={template === item.id}
                onClick={() => chooseTemplate(item.id)}
                className="flex min-h-12 w-full items-center gap-3 py-2 text-left"
              >
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${template === item.id ? "border-primary bg-primary text-white" : "border-line"}`}
                >
                  {template === item.id ? <Check aria-hidden size={12} weight="bold" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="block truncate text-xs text-muted">{item.description}</span>
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="font-bold">Choose a background</legend>
          <p className="mt-1 text-sm leading-6 text-muted">Use a clean Relay color or one of the session’s photos.</p>
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Recap background">
            {backgrounds.map((item) => (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-label={item.imageUrl ? item.label : `${item.label} background`}
                aria-checked={backgroundId === item.id}
                onClick={() => setBackgroundId(item.id)}
                className={`relative h-14 w-14 overflow-hidden rounded-lg border-2 ${backgroundId === item.id ? "border-primary" : "border-transparent"}`}
                style={{ backgroundColor: item.color }}
              >
                {item.imageUrl ? <Image src={item.imageUrl} alt="" fill sizes="56px" className="object-cover" /> : null}
                {backgroundId === item.id ? (
                  <span className="absolute inset-0 grid place-items-center bg-black/25 text-white">
                    <Check aria-hidden size={17} weight="bold" />
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          {!photos.length ? (
            <p className="mt-2 text-xs text-muted">Add a photo below to use it as the story background.</p>
          ) : null}
        </fieldset>

        <Button type="button" onClick={share} disabled={pending} className="mt-6 w-full sm:w-auto">
          {pending ? <ButtonSpinner /> : <ShareNetwork aria-hidden size={16} />}
          {pending ? "Creating story…" : "Share story"}
        </Button>
        {message ? (
          <p role="status" className="mt-2 text-sm font-medium text-muted">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
