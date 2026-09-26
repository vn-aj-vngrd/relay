"use client";

import { X } from "@phosphor-icons/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Alert } from "./alert";

type Notice = { id: number; message: string; variant: "success" | "danger" };
let notices: Notice[] = [];
let sequence = 0;
const listeners = new Set<() => void>();
const empty: Notice[] = [];
const snapshot = () => notices;
const serverSnapshot = () => empty;
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
function dismiss(id: number) {
  notices = notices.filter((notice) => notice.id !== id);
  for (const listener of listeners) listener();
}

export function notify(message: string, variant: Notice["variant"] = "danger") {
  notices = [...notices.slice(-3), { id: ++sequence, message, variant }];
  for (const listener of listeners) listener();
}

/** Transient action results. Keep field errors and persistent instructions inline. */
export function ActionNotice({
  message,
  variant = "danger",
  response,
}: {
  message: string;
  variant?: Notice["variant"];
  response?: object;
}) {
  const last = useRef<{ message: string; response?: object } | null>(null);
  useEffect(() => {
    if (last.current?.message === message && last.current.response === response)
      return;
    last.current = { message, response };
    if (!message) return;
    notify(message, variant);
  }, [message, variant, response]);
  return null;
}

function Toast({ notice }: { notice: Notice }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || notice.variant === "danger") return;
    const timer = window.setTimeout(() => dismiss(notice.id), 8000);
    return () => window.clearTimeout(timer);
  }, [notice.id, notice.variant, paused]);
  return (
    <div
      role="group"
      aria-label="Action notification"
      className="pointer-events-auto relative rounded-lg bg-surface shadow-lg"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Alert variant={notice.variant} className="pr-12">
        {notice.message}
      </Alert>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => dismiss(notice.id)}
        className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-surface-strong focus-visible:outline-2 focus-visible:outline-primary"
      >
        <X size={16} aria-hidden />
      </button>
    </div>
  );
}

export function ToastViewport() {
  const items = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const host = useRef<HTMLElement>(null);
  useEffect(() => {
    // The top layer keeps failures visible when a native dialog remains open.
    const element = host.current;
    if (!element?.showPopover) return;
    element.setAttribute("popover", "manual");
    element.hidePopover();
    if (items.length) element.showPopover();
  }, [items]);
  return (
    <section
      ref={host}
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-auto left-1/2 top-[max(1rem,env(safe-area-inset-top))] z-[100] m-0 flex w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 flex-col gap-2 overflow-visible border-0 bg-transparent p-0"
    >
      {items.map((notice) => (
        <Toast key={notice.id} notice={notice} />
      ))}
    </section>
  );
}
