"use client";

import { type ReactNode, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

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
        onClose={(event) => {
          if (event.target === event.currentTarget) onOpenChange(false);
        }}
      >
        <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3">
          <h2 id="preview-players-title" className="text-lg font-bold">
            Players (8)
          </h2>
          <Button
            type="button"
            variant="quiet"
            className="min-h-11"
            onClick={() => dialog.current?.close()}
          >
            Close players
          </Button>
        </div>
        {children}
      </Dialog>
    </div>
  );
}
