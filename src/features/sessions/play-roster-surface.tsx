"use client";

import { Broadcast } from "@phosphor-icons/react";
import { useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

import { rosterPanelUrl } from "./players-destination";

/** Only this roster surface reads URL state; courts remain mounted siblings. */
export function PlayRosterSurface({
  status,
  count,
  pendingCount = 0,
  children,
}: {
  status: string;
  count: number;
  pendingCount?: number;
  children: ReactNode;
}) {
  const params = useSearchParams();
  const open = params.get("panel") === "players";
  const live = status === "live";
  const ended = status === "completed" || status === "cancelled";
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  function setOpen(next: boolean) {
    // Native history integrates with Next's search params without fetching or
    // replacing the server tree (and therefore without interrupting score writes).
    const url = rosterPanelUrl(window.location.href, next);
    if (next) window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
  }

  useEffect(() => {
    if (live && open) {
      if (!dialog.current?.open) dialog.current?.showModal();
    } else if (dialog.current?.open) {
      dialog.current.close();
      trigger.current?.focus();
    }
    if (!live && open) heading.current?.focus();
  }, [live, open]);

  if (live) {
    return (
      <section
        className="flex flex-wrap items-center justify-end gap-3"
        aria-label="Play roster access"
      >
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-live">
          <Broadcast aria-hidden size={17} />
          Play in progress
        </span>
        <Button
          ref={trigger}
          type="button"
          variant="secondary"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          Players ({count})
        </Button>
        {pendingCount > 0 ? (
          <span className="text-sm text-muted">
            {pendingCount} join {pendingCount === 1 ? "request" : "requests"}
          </span>
        ) : null}
        <Dialog
          ref={dialog}
          variant="drawer"
          aria-labelledby="play-roster-title"
          onCancel={(event) => {
            if (event.target !== event.currentTarget) return;
            event.preventDefault();
            setOpen(false);
          }}
        >
          <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 sm:px-6">
            <h2 id="play-roster-title" className="text-lg font-bold">
              Players ({count})
            </h2>
            <Button
              type="button"
              variant="quiet"
              className="min-h-11"
              onClick={() => setOpen(false)}
            >
              Close players
            </Button>
          </div>
          <div className="px-4 pb-8 sm:px-6">{children}</div>
        </Dialog>
      </section>
    );
  }

  return (
    <section className="py-5" aria-labelledby="play-roster-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          ref={heading}
          tabIndex={-1}
          id="play-roster-title"
          className="text-lg font-bold"
        >
          {ended ? "Final roster" : "Players"}
        </h2>
        {ended ? (
          <Button
            type="button"
            variant="secondary"
            aria-expanded={open}
            aria-controls="play-roster-content"
            onClick={() => setOpen(!open)}
          >
            {open ? "Hide roster" : "Show roster"}
          </Button>
        ) : null}
      </div>
      <div id="play-roster-content" hidden={ended && !open}>
        {children}
      </div>
    </section>
  );
}
