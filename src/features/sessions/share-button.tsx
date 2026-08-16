"use client";
import { useState } from "react";
import { ShareNetwork } from "@phosphor-icons/react";

export function ShareButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const absolute = new URL(url, window.location.origin).toString();
    if (navigator.share) await navigator.share({ title, url: absolute });
    else { await navigator.clipboard.writeText(absolute); setCopied(true); }
  }
  return <button onClick={share} className="pressable inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-line px-4 text-sm font-semibold hover:bg-surface"><ShareNetwork size={17} />{copied ? "Link copied" : "Share"}</button>;
}
