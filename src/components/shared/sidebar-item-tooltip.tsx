"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

// Keep this component directly inside its link/button. The hidden marker does
// not change rail geometry; the visible tooltip escapes the scrolling aside.
export function SidebarItemTooltip({ children }: { children: ReactNode }) {
  const marker = useRef<HTMLSpanElement>(null);
  const tooltip = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();
  const [position, setPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);

  const cancelHide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => {
    const trigger = marker.current?.parentElement;
    if (!trigger) return;
    let focused = false;
    const hide = () => {
      cancelHide();
      setPosition(null);
    };
    const show = () => {
      cancelHide();
      if (
        document.documentElement.dataset.sidebar !== "compact" ||
        !window.matchMedia("(min-width: 64rem)").matches
      )
        return;
      const rect = trigger.getBoundingClientRect();
      setPosition({ left: rect.right + 10, top: rect.top });
    };
    const leave = () => {
      if (!focused) timer.current = setTimeout(hide, 120);
    };
    const focus = () => {
      focused = true;
      show();
    };
    const blur = () => {
      focused = false;
      hide();
    };
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") hide();
    };
    trigger.addEventListener("mouseenter", show);
    trigger.addEventListener("mouseleave", leave);
    trigger.addEventListener("focus", focus);
    trigger.addEventListener("blur", blur);
    trigger.addEventListener("click", hide);
    document.addEventListener("keydown", keydown);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    window.addEventListener("relay-sidebar-change", hide);
    window.addEventListener("storage", hide);
    return () => {
      cancelHide();
      trigger.removeEventListener("mouseenter", show);
      trigger.removeEventListener("mouseleave", leave);
      trigger.removeEventListener("focus", focus);
      trigger.removeEventListener("blur", blur);
      trigger.removeEventListener("click", hide);
      document.removeEventListener("keydown", keydown);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
      window.removeEventListener("relay-sidebar-change", hide);
      window.removeEventListener("storage", hide);
    };
  }, [cancelHide]);

  useLayoutEffect(() => {
    if (!position || !tooltip.current) return;
    const rect = tooltip.current.getBoundingClientRect();
    const left = Math.max(
      8,
      Math.min(position.left, window.innerWidth - rect.width - 8)
    );
    const top = Math.max(
      8,
      Math.min(position.top, window.innerHeight - rect.height - 8)
    );
    if (left !== position.left || top !== position.top)
      setPosition({ left, top });
  }, [position]);

  useEffect(() => {
    const trigger = marker.current?.parentElement;
    if (!position || !trigger) return;
    const previous = trigger.getAttribute("aria-describedby");
    trigger.setAttribute(
      "aria-describedby",
      [previous, id].filter(Boolean).join(" ")
    );
    return () => {
      if (previous) trigger.setAttribute("aria-describedby", previous);
      else trigger.removeAttribute("aria-describedby");
    };
  }, [id, position]);

  return (
    <>
      <span ref={marker} hidden aria-hidden="true" />
      {position
        ? createPortal(
            <span
              ref={tooltip}
              id={id}
              role="tooltip"
              className="relay-tooltip fixed z-[100] w-max max-w-56 break-words rounded-md px-2 py-1.5 text-xs font-medium leading-5"
              style={position}
              onMouseEnter={cancelHide}
              onMouseLeave={() => {
                if (document.activeElement !== marker.current?.parentElement)
                  setPosition(null);
              }}
            >
              {children}
            </span>,
            document.body
          )
        : null}
    </>
  );
}
