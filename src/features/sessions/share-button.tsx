"use client";
import { useState } from "react";
import { ShareNetwork } from "@phosphor-icons/react";

export function ShareButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const absolute = new URL(url, window.location.origin).toString();
    try {
      if (navigator.share) await navigator.share({ title, url: absolute });
      else {
        await navigator.clipboard.writeText(absolute);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2500);
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) throw error;
    }
  }
  return <button type="button" onClick={share} className="pressable inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-[13px] font-semibold hover:bg-surface-strong"><ShareNetwork aria-hidden size={16} /><span aria-live="polite">{copied ? "Link copied" : "Share"}</span></button>;
}
