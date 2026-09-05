"use client";

import { SidebarSimple } from "@phosphor-icons/react";
import { useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipId = useId();
  const [tooltipPosition, setTooltipPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);

  const showTooltip = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltipPosition({
      left: rect.right + 10,
      top: rect.top + rect.height / 2,
    });
  };

  const hideTooltip = () => setTooltipPosition(null);

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
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        aria-label={label}
        aria-describedby={tooltipId}
        aria-expanded={!compact}
        className="sidebar-collapse-toggle pressable grid h-9 w-9 shrink-0 place-items-center rounded-md text-muted hover:bg-surface-strong hover:text-ink"
      >
        <SidebarSimple aria-hidden size={19} weight="regular" />
      </button>
      {tooltipPosition
        ? createPortal(
            <span
              id={tooltipId}
              role="tooltip"
              className="relay-tooltip pointer-events-none fixed z-[100] -translate-y-1/2 whitespace-nowrap rounded-md px-2 py-1.5 text-xs font-medium"
              style={tooltipPosition}
            >
              {label}
            </span>,
            document.body
          )
        : null}
    </>
  );
}
