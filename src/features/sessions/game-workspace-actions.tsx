"use client";

import { DotsThree, PencilSimple } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useId, useRef } from "react";

import { Button } from "@/components/ui/button";
import { usePopoverTransition } from "@/components/ui/use-popover-transition";

import { GameQrShare } from "./game-qr-share";
import { ShareButton } from "./share-button";

export function GameWorkspaceActions({
  canManage,
  editHref,
  shareUrl,
  title,
  sessionId,
  qrEnabled,
  qrDetails,
  mode,
}: {
  canManage: boolean;
  editHref: string;
  shareUrl: string;
  title: string;
  sessionId: string;
  qrEnabled: boolean;
  qrDetails: string;
  mode: "mobile" | "desktop";
}) {
  const { open, rendered, hide, toggle } = usePopoverTransition();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const popoverId = useId();

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      const target = event.target as Element;
      if (target.closest("[data-game-qr-dialog]")) return;
      if (!root.current?.contains(target)) hide();
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      hide();
      trigger.current?.focus();
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [hide, open]);

  const actionItems = (
    <>
      {canManage ? (
        <Link
          href={editHref}
          onClick={hide}
          className="pressable flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-[600] text-ink hover:bg-surface-strong"
        >
          <PencilSimple aria-hidden size={17} />
          Edit game
        </Link>
      ) : null}
      {mode === "mobile" ? (
        <ShareButton
          url={shareUrl}
          title={title}
          sessionId={sessionId}
          menuItem
          onSelect={hide}
        />
      ) : null}
      {qrEnabled ? (
        <GameQrShare
          url={shareUrl}
          title={title}
          details={qrDetails}
          sessionId={sessionId}
          menuItem
          onClose={hide}
        />
      ) : null}
    </>
  );

  if (mode === "desktop") {
    return (
      <div ref={root} className="relative flex shrink-0 items-center gap-2">
        <ShareButton url={shareUrl} title={title} sessionId={sessionId} />
        {canManage || qrEnabled ? (
          <Button
            ref={trigger}
            type="button"
            variant="secondary"
            aria-label="More game actions"
            aria-expanded={open}
            aria-controls={popoverId}
            onClick={toggle}
          >
            <DotsThree aria-hidden size={18} weight="bold" />
            More
          </Button>
        ) : null}
        {rendered ? (
          <div
            id={popoverId}
            data-state={open ? "open" : "closed"}
            className="menu-popover absolute right-0 top-[calc(100%+6px)] z-30 min-w-44 rounded-lg border border-line bg-surface p-1 shadow-[0_4px_8px_oklch(0.1_0.01_275/.12)]"
          >
            {actionItems}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div ref={root} className="relative shrink-0">
      <button
        ref={trigger}
        type="button"
        aria-label="Game actions"
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={toggle}
        className="pressable grid h-11 w-11 place-items-center rounded-lg text-ink hover:bg-surface-strong"
      >
        <DotsThree aria-hidden size={24} weight="bold" />
      </button>
      {rendered ? (
        <div
          id={popoverId}
          data-state={open ? "open" : "closed"}
          className="menu-popover absolute right-0 top-[calc(100%+6px)] z-30 min-w-44 rounded-lg border border-line bg-surface p-1 shadow-[0_4px_8px_oklch(0.1_0.01_275/.12)]"
        >
          {actionItems}
        </div>
      ) : null}
    </div>
  );
}
