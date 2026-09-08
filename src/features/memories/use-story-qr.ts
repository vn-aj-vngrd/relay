"use client";

import { useEffect, useMemo, useState } from "react";

import { drawGameQr } from "@/features/sessions/game-qr";

type QrRequest = { url: string };
type QrResult =
  | {
      request: QrRequest;
      status: "ready";
      canvas: HTMLCanvasElement;
      imageUrl: string;
    }
  | { request: QrRequest; status: "error" };

export function useStoryQr(url: string | null) {
  const request = useMemo(() => (url ? { url } : null), [url]);
  const [result, setResult] = useState<QrResult | null>(null);
  useEffect(() => {
    if (!request) return;
    const current = request;
    let cancelled = false;
    const canvas = document.createElement("canvas");
    async function generate() {
      try {
        await drawGameQr(canvas, current.url);
        const imageUrl = canvas.toDataURL("image/png");
        if (!cancelled) {
          setResult({ request: current, status: "ready", canvas, imageUrl });
        }
      } catch {
        if (!cancelled) setResult({ request: current, status: "error" });
      }
    }
    void generate();
    return () => {
      cancelled = true;
    };
  }, [request]);
  // Synchronous identity check also rejects old QR results after Off → QR.
  return request && result?.request === request ? result : null;
}
