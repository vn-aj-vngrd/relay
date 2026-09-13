"use client";
import { ShareNetwork } from "@phosphor-icons/react";
import { useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
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
  const [pending, setPending] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  async function share() {
    if (pending) return;
    setPending(true);
    const absolute = new URL(url, window.location.origin).toString();
    try {
      let shared = false;
      if (navigator.share) {
        try {
          await navigator.share({ title, url: absolute });
          shared = true;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError")
            return;
        }
      }
      if (!shared) {
        await navigator.clipboard.writeText(absolute);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2500);
      }
      if (sessionId)
        void trackSharedSessionEvent({
          sessionId,
          event: "invite_shared",
        }).catch(() => undefined);
      onShared?.();
      onSelect?.();
    } catch {
      setFallbackUrl(absolute);
      dialog.current?.showModal();
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <Button
        type="button"
        variant={menuItem ? "quiet" : primary ? "primary" : "secondary"}
        onClick={share}
        disabled={pending}
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
          className={
            compactOnMobile && !menuItem
              ? "game-workspace-action-label sr-only sm:not-sr-only"
              : ""
          }
        >
          {copied ? "Link copied" : "Share game"}
        </span>
      </Button>
      <Dialog ref={dialog} aria-labelledby={titleId} onClose={onSelect}>
        <div className="p-5">
          <h2 id={titleId} className="text-lg font-bold">
            Copy the game link
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Your browser couldn’t share or copy the link. Select it below and
            copy it to your message.
          </p>
          <input
            aria-label="Game link"
            readOnly
            value={fallbackUrl}
            onFocus={(event) => event.currentTarget.select()}
            className="field mt-3 w-full"
          />
          <Button
            type="button"
            variant="secondary"
            className="mt-4"
            onClick={() => dialog.current?.close()}
          >
            Done
          </Button>
        </div>
      </Dialog>
    </>
  );
}
