"use client";
import { ShareNetwork } from "@phosphor-icons/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { trackSharedSessionEvent } from "@/features/analytics/actions";

export function ShareButton({
  url,
  title,
  sessionId,
  compactOnMobile = false,
  menuItem = false,
  primary = false,
  onSelect,
  onShared,
}: {
  url: string;
  title: string;
  sessionId?: string;
  compactOnMobile?: boolean;
  menuItem?: boolean;
  primary?: boolean;
  onSelect?: () => void;
  onShared?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  async function share() {
    onSelect?.();
    const absolute = new URL(url, window.location.origin).toString();
    try {
      if (navigator.share) await navigator.share({ title, url: absolute });
      else {
        await navigator.clipboard.writeText(absolute);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2500);
      }
      if (sessionId) await trackSharedSessionEvent({ sessionId, event: "invite_shared" });
      onShared?.();
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) throw error;
    }
  }
  return (
    <Button
      type="button"
      variant={menuItem ? "quiet" : primary ? "primary" : "secondary"}
      role={menuItem ? "menuitem" : undefined}
      onClick={share}
      aria-label={copied ? "Game link copied" : "Share game"}
      className={
        menuItem
          ? "min-h-11 w-full justify-start rounded-md px-3 text-sm"
          : compactOnMobile
            ? "game-workspace-action-button h-11 min-h-11 w-11 border-transparent bg-transparent px-0 sm:h-auto sm:min-h-9 sm:w-auto sm:border-line sm:bg-surface sm:px-3"
            : ""
      }
    >
      <ShareNetwork aria-hidden size={16} />
      <span
        aria-live="polite"
        className={compactOnMobile && !menuItem ? "game-workspace-action-label sr-only sm:not-sr-only" : ""}
      >
        {copied ? "Link copied" : "Share game"}
      </span>
    </Button>
  );
}
