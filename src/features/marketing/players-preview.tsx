"use client";

import { X } from "@phosphor-icons/react";
import { type ReactNode, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { IconTooltip } from "@/components/ui/icon-tooltip";

/** Illustrative roster access, without writing demo state into the visitor's URL. */
export function PlayersPreview({
  children,
  onOpenChange,
}: {
  children: ReactNode;
  onOpenChange: (open: boolean) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <div className="mb-5 flex justify-end">
      <Button
        type="button"
        variant="secondary"
        aria-haspopup="dialog"
        onClick={() => {
          dialog.current?.showModal();
          onOpenChange(true);
        }}
      >
        Players (8)
      </Button>
      <Dialog
        ref={dialog}
        variant="drawer"
        aria-labelledby="preview-players-title"
        onDismiss={() => dialog.current?.close()}
        onClose={(event) => {
          if (event.target === event.currentTarget) onOpenChange(false);
        }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-2 sm:px-5">
          <h2 id="preview-players-title" className="text-base font-semibold">
            Players (8)
          </h2>
          <IconTooltip label="Close players">
            <Button
              type="button"
              variant="quiet"
              size="icon"
              className="rounded-full"
              aria-label="Close players"
              onClick={() => dialog.current?.close()}
            >
              <X aria-hidden size={18} />
            </Button>
          </IconTooltip>
        </div>
        {children}
      </Dialog>
    </div>
  );
}
