"use client";

import { Copy, DownloadSimple, QrCode, X } from "@phosphor-icons/react";
import { useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { RelayMark } from "@/components/shared/brand";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { trackSharedSessionEvent } from "@/features/analytics/actions";

const subscribeToBrowser = () => () => undefined;

function trackQrShare(
  sessionId: string,
  event: "invite_shared" | "recap_shared"
) {
  try {
    void Promise.resolve(trackSharedSessionEvent({ sessionId, event })).catch(
      () => undefined
    );
  } catch {
    // Analytics is best-effort and must not change successful share feedback.
  }
}

function downloadName(title: string) {
  const safe = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${safe || "relay-game"}-qr.png`;
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = word;
  }
  if (line) lines.push(line);
  const visible = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    let last = visible[maxLines - 1] ?? "";
    while (last && context.measureText(`${last}…`).width > maxWidth) {
      last = last.slice(0, -1);
    }
    visible[maxLines - 1] = `${last.trimEnd()}…`;
  }
  visible.forEach((value, index) =>
    context.fillText(value, x, y + index * lineHeight)
  );
  return y + visible.length * lineHeight;
}

function createBrandedQrCanvas({
  qr,
  title,
  details,
  scanLabel,
}: {
  qr: HTMLCanvasElement;
  title: string;
  details: string;
  scanLabel: string;
}) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1500;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.fillStyle = "#172033";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "#91aa1e";
  context.beginPath();
  context.arc(80, 82, 30, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#b7d62e";
  context.beginPath();
  context.arc(76, 78, 26, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#ffffff";
  context.font = "700 38px Inter, system-ui, sans-serif";
  context.textBaseline = "middle";
  context.fillText("Relay", 128, 82);
  context.font = "500 22px Inter, system-ui, sans-serif";
  context.fillStyle = "#bfd4df";
  context.fillText("Pickleball plans in one link", 128, 122);

  context.textBaseline = "alphabetic";
  context.fillStyle = "#ffffff";
  context.font = "700 58px Inter, system-ui, sans-serif";
  const titleBottom = drawWrappedText(context, title, 80, 220, 920, 66, 2);
  context.font = "500 28px Inter, system-ui, sans-serif";
  context.fillStyle = "#bfd4df";
  drawWrappedText(context, details, 80, titleBottom + 18, 920, 38, 2);

  roundedRect(context, 120, 460, 840, 840, 28);
  context.fillStyle = "#ffffff";
  context.fill();
  context.imageSmoothingEnabled = false;
  context.drawImage(qr, 156, 496, 768, 768);

  context.fillStyle = "#ffffff";
  context.font = "700 28px Inter, system-ui, sans-serif";
  context.textAlign = "center";
  context.fillText(scanLabel, 540, 1410);
  context.textAlign = "start";

  return canvas;
}

export function GameQrShare({
  url,
  title,
  details,
  sessionId,
  menuItem = false,
  onClose,
  onShared,
  heading,
  description,
  scanLabel = "Scan to view and RSVP",
  event = "invite_shared",
}: {
  url: string;
  title: string;
  details: string;
  sessionId: string;
  menuItem?: boolean;
  onClose?: () => void;
  onShared?: (method: "copy" | "download") => void;
  heading?: string;
  description?: string;
  scanLabel?: string;
  event?: "invite_shared" | "recap_shared";
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const mounted = useSyncExternalStore(
    subscribeToBrowser,
    () => true,
    () => false
  );
  const absoluteUrlRef = useRef("");
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function openDialog() {
    dialogRef.current?.showModal();
    setStatus("loading");
    setMessage("");
    try {
      const absolute = new URL(url, window.location.origin).toString();
      absoluteUrlRef.current = absolute;
      const { toCanvas } = await import("qrcode");
      const canvas = canvasRef.current;
      if (!canvas) return;
      await toCanvas(canvas, absolute, {
        width: 1024,
        margin: 4,
        errorCorrectionLevel: "M",
        color: { dark: "#111827", light: "#ffffff" },
      });
      // qrcode writes its output size as inline CSS. Keep the 1024px bitmap for download,
      // but constrain its displayed size to the dialog frame.
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      setStatus("ready");
    } catch {
      setStatus("error");
      setMessage(
        "The QR code couldn’t be generated. Copy the game link instead."
      );
    }
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(absoluteUrlRef.current);
      setMessage("Game link copied");
      trackQrShare(sessionId, event);
      onShared?.("copy");
    } catch {
      setMessage("The link couldn’t be copied. Use Share game instead.");
    }
  }

  async function downloadQr() {
    const canvas = canvasRef.current;
    if (!canvas || status !== "ready") return;
    const brandedCanvas = createBrandedQrCanvas({
      qr: canvas,
      title,
      details,
      scanLabel,
    });
    if (!brandedCanvas) {
      setMessage("The QR code couldn’t be downloaded. Try copying the link.");
      return;
    }

    let blob: Blob | null = null;
    try {
      blob = await new Promise<Blob | null>((resolve) => {
        brandedCanvas.toBlob(resolve, "image/png");
      });
    } catch {
      // Canvas export can fail when a browser blocks or cannot encode the image.
    }
    if (!blob) {
      setMessage("The QR code couldn’t be downloaded. Try copying the link.");
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = downloadName(title);
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    setMessage("QR code downloaded");
    trackQrShare(sessionId, event);
    onShared?.("download");
  }

  return (
    <>
      <Button
        type="button"
        variant={menuItem ? "quiet" : "secondary"}
        onClick={() => void openDialog()}
        className={
          menuItem
            ? "min-h-11 w-full justify-start rounded-md px-3 text-sm"
            : ""
        }
      >
        <QrCode aria-hidden size={17} />
        Show QR
      </Button>
      {mounted
        ? createPortal(
            <Dialog
              ref={dialogRef}
              data-game-qr-dialog
              onClose={onClose}
              aria-labelledby={titleId}
              className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
              aria-describedby={descriptionId}
            >
              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 id={titleId} className="text-lg font-[680]">
                      {heading ?? `Scan to join ${title}`}
                    </h2>
                    <p
                      id={descriptionId}
                      className="mt-1 text-sm leading-6 text-muted"
                    >
                      {description ??
                        `${details}. Players can scan this with their phone camera to view the plan and RSVP.`}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="quiet"
                    onClick={closeDialog}
                    aria-label="Close QR code"
                    className="-mr-2 -mt-2"
                  >
                    <X aria-hidden size={18} />
                  </Button>
                </div>

                <div className="mx-auto mt-5 w-full max-w-80 overflow-hidden rounded-2xl bg-court text-white ring-1 ring-black/10">
                  <div className="border-b border-white/10 px-5 pb-5 pt-4">
                    <div
                      aria-hidden="true"
                      className="flex items-center gap-2 text-sm font-bold tracking-[-0.025em]"
                    >
                      <RelayMark className="h-5 w-5" />
                      <span>Relay</span>
                    </div>
                    <p className="mt-4 break-words text-xl font-bold leading-6 text-white">
                      {title}
                    </p>
                    <p className="mt-1.5 break-words text-xs leading-5 text-court-line">
                      {details}
                    </p>
                  </div>
                  <div className="p-4">
                    <div className="relative aspect-square w-full rounded-xl bg-white p-3">
                      <canvas
                        ref={canvasRef}
                        role="img"
                        aria-label={`QR code for ${title}`}
                        className={`h-full w-full ${status === "ready" ? "block" : "invisible"}`}
                      />
                      {status !== "ready" ? (
                        <p
                          className="absolute inset-3 grid place-items-center text-center text-sm text-slate-600"
                          role="status"
                        >
                          {status === "error"
                            ? "QR unavailable"
                            : "Generating QR…"}
                        </p>
                      ) : null}
                    </div>
                    <p className="mt-4 text-center text-sm font-semibold text-white">
                      {scanLabel}
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void copyLink()}
                  >
                    <Copy aria-hidden size={16} />
                    Copy link
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void downloadQr()}
                    disabled={status !== "ready"}
                  >
                    <DownloadSimple aria-hidden size={16} />
                    Download PNG
                  </Button>
                </div>
                <p
                  className={`mt-3 min-h-5 text-center text-xs ${message.includes("couldn’t") ? "text-danger" : "text-muted"}`}
                  aria-live="polite"
                >
                  {message}
                </p>
              </div>
            </Dialog>,
            document.body
          )
        : null}
    </>
  );
}
