"use client";

import { SidebarSimple } from "@phosphor-icons/react";
import { useSyncExternalStore } from "react";

const storageKey = "relay-sidebar";
const changeEvent = "relay-sidebar-change";

function isCompact() {
  return document.documentElement.dataset.sidebar === "compact";
}

function subscribe(callback: () => void) {
  window.addEventListener(changeEvent, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(changeEvent, callback);
    window.removeEventListener("storage", callback);
  };
}

export function SidebarCollapseToggle() {
  const compact = useSyncExternalStore(subscribe, isCompact, () => false);

  const toggle = () => {
    const next = compact ? "expanded" : "compact";
    if (next === "compact")
      document.documentElement.dataset.sidebar = "compact";
    else delete document.documentElement.dataset.sidebar;
    localStorage.setItem(storageKey, next);
    window.dispatchEvent(new Event(changeEvent));
  };

  const label = compact ? "Open sidebar" : "Close sidebar";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-expanded={!compact}
      className="sidebar-collapse-toggle pressable group relative grid h-9 w-9 shrink-0 place-items-center rounded-md text-muted hover:bg-surface-strong hover:text-ink"
    >
      <SidebarSimple aria-hidden size={19} weight="regular" />
      <span
        role="tooltip"
        className="sidebar-toggle-tooltip relay-tooltip pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-md px-2 py-1.5 text-xs font-medium group-hover:block group-focus-visible:block"
      >
        {label}
      </span>
    </button>
  );
}
