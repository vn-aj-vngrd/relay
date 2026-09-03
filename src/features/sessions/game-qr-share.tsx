"use client";

import { Copy, DownloadSimple, QrCode, X } from "@phosphor-icons/react";
import { useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { trackSharedSessionEvent } from "@/features/analytics/actions";

const subscribeToBrowser = () => () => undefined;

function downloadName(title: string) {
  const safe = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${safe || "relay-game"}-qr.png`;
}

export function GameQrShare({
  url,
  title,
  details,
  sessionId,
  menuItem = false,
  onClose,
  onShared,
}: {
  url: string;
  title: string;
  details: string;
  sessionId: string;
  menuItem?: boolean;
  onClose?: () => void;
  onShared?: (method: "copy" | "download") => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const mounted = useSyncExternalStore(
    subscribeToBrowser,
    () => true,
    () => false,
  );
  const absoluteUrlRef = useRef("");
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
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
      setMessage("The QR code couldn’t be generated. Copy the game link instead.");
    }
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(absoluteUrlRef.current);
      setMessage("Game link copied");
      await trackSharedSessionEvent({ sessionId, event: "invite_shared" });
      onShared?.("copy");
    } catch {
      setMessage("The link couldn’t be copied. Use Share game instead.");
    }
  }

  async function downloadQr() {
    const canvas = canvasRef.current;
    if (!canvas || status !== "ready") return;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) {
      setMessage("The QR code couldn’t be downloaded. Try copying the link.");
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = downloadName(title);
    anchor.click();
    URL.revokeObjectURL(objectUrl);
    setMessage("QR code downloaded");
    await trackSharedSessionEvent({ sessionId, event: "invite_shared" });
    onShared?.("download");
  }

  return (
    <>
      <Button
        type="button"
        variant={menuItem ? "quiet" : "secondary"}
        onClick={() => void openDialog()}
        className={menuItem ? "min-h-11 w-full justify-start rounded-md px-3 text-sm" : ""}
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
              aria-describedby={descriptionId}
            >
              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 id={titleId} className="text-lg font-[680]">
                      Scan to join {title}
                    </h2>
                    <p id={descriptionId} className="mt-1 text-sm leading-6 text-muted">
                      {details}. Players can scan this with their phone camera to view the plan and RSVP.
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

                <div className="relative mx-auto mt-5 aspect-square w-full max-w-72 bg-white p-3 ring-1 ring-black/10">
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
                      {status === "error" ? "QR unavailable" : "Generating QR…"}
                    </p>
                  ) : null}
                </div>

                <p className="mt-4 text-center text-sm font-semibold">Scan to view and RSVP</p>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Button type="button" variant="secondary" onClick={() => void copyLink()}>
                    <Copy aria-hidden size={16} />
                    Copy link
                  </Button>
                  <Button type="button" onClick={() => void downloadQr()} disabled={status !== "ready"}>
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
            document.body,
          )
        : null}
    </>
  );
}
