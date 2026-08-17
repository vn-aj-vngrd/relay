"use client";
import { useState } from "react";
import { ShareNetwork } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

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
  return <Button type="button" variant="secondary" onClick={share}><ShareNetwork aria-hidden size={16} /><span aria-live="polite">{copied ? "Link copied" : "Share game"}</span></Button>;
}
