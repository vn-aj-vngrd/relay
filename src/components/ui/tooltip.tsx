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

import { usePopoverTransition } from "./use-popover-transition";

const OPEN_DELAY_MS = 300;
const CLOSE_DELAY_MS = 150;
const VIEWPORT_GUTTER = 8;
type Side = "top" | "bottom" | "left" | "right";

/** Place inside the trigger, or immediately after it with anchor="previous".
 * The hidden marker preserves geometry; every tooltip uses the same portal,
 * intent delay, accessible description, hover bridge, and popover motion.
 */
export function Tooltip({
  content,
  id,
  anchor = "parent",
  align = "end",
  side = "responsive",
  disabled = false,
  compactSidebarOnly = false,
}: {
  content: ReactNode;
  id?: string;
  anchor?: "parent" | "previous";
  align?: "start" | "center" | "end";
  side?: Side | "responsive";
  disabled?: boolean;
  compactSidebarOnly?: boolean;
}) {
  const generatedId = useId();
  const tooltipId = id ?? generatedId;
  const marker = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerHovered = useRef(false);
  const panelHovered = useRef(false);
  const focused = useRef(false);
  const dismissed = useRef(false);
  const touch = useRef(false);
  const { open, rendered, show, hide } = usePopoverTransition();
  const [position, setPosition] = useState<{
    left: number;
    top: number;
    side: Side;
  } | null>(null);
  const getTrigger = useCallback(
    () =>
      anchor === "parent"
        ? marker.current?.parentElement
        : marker.current?.previousElementSibling,
    [anchor]
  );
  const clearTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  const dismiss = useCallback(() => {
    if (
      !triggerHovered.current &&
      !panelHovered.current &&
      !focused.current &&
      !timer.current
    )
      return;
    clearTimer();
    dismissed.current =
      triggerHovered.current || panelHovered.current || focused.current;
    panelHovered.current = false;
    hide();
  }, [clearTimer, hide]);
  const leave = useCallback(() => {
    clearTimer();
    if (triggerHovered.current || panelHovered.current || focused.current)
      return;
    dismissed.current = false;
    timer.current = setTimeout(hide, CLOSE_DELAY_MS);
  }, [clearTimer, hide]);

  useEffect(() => {
    const trigger = getTrigger();
    if (!trigger) return;
    const focusTarget =
      trigger instanceof HTMLLabelElement
        ? (trigger.control ?? trigger)
        : trigger;
    const eligible = () =>
      !disabled &&
      (!compactSidebarOnly ||
        (document.documentElement.dataset.sidebar === "compact" &&
          window.matchMedia("(min-width: 64rem)").matches));
    const reveal = () => {
      if (eligible() && !dismissed.current) show();
    };
    const enter = (event: Event) => {
      if ((event as PointerEvent).pointerType === "touch") return;
      triggerHovered.current = true;
      clearTimer();
      if (!eligible() || dismissed.current) return;
      timer.current = setTimeout(reveal, OPEN_DELAY_MS);
    };
    const exit = () => {
      triggerHovered.current = false;
      leave();
    };
    const focus = () => {
      focused.current = true;
      clearTimer();
      if (!touch.current) reveal();
    };
    const blur = () => {
      focused.current = false;
      touch.current = false;
      leave();
    };
    const pointerDown = (event: Event) => {
      touch.current = (event as PointerEvent).pointerType === "touch";
      dismiss();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    trigger.addEventListener("pointerenter", enter);
    trigger.addEventListener("pointerleave", exit);
    trigger.addEventListener("pointerdown", pointerDown);
    focusTarget.addEventListener("focusin", focus);
    focusTarget.addEventListener("focusout", blur);
    trigger.addEventListener("click", dismiss);
    document.addEventListener("keydown", escape);
    document.addEventListener("fullscreenchange", dismiss);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    window.addEventListener("relay-sidebar-change", dismiss);
    window.addEventListener("storage", dismiss);
    if (document.activeElement === focusTarget) focus();
    return () => {
      clearTimer();
      trigger.removeEventListener("pointerenter", enter);
      trigger.removeEventListener("pointerleave", exit);
      trigger.removeEventListener("pointerdown", pointerDown);
      focusTarget.removeEventListener("focusin", focus);
      focusTarget.removeEventListener("focusout", blur);
      trigger.removeEventListener("click", dismiss);
      document.removeEventListener("keydown", escape);
      document.removeEventListener("fullscreenchange", dismiss);
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("relay-sidebar-change", dismiss);
      window.removeEventListener("storage", dismiss);
    };
  }, [
    clearTimer,
    compactSidebarOnly,
    disabled,
    dismiss,
    getTrigger,
    leave,
    show,
  ]);

  useEffect(() => {
    if (disabled) dismiss();
  }, [disabled, dismiss]);

  useLayoutEffect(() => {
    const trigger = getTrigger();
    if (!rendered || !open || !trigger || !panel.current) return;
    const rect = trigger.getBoundingClientRect();
    const bounds = panel.current.getBoundingClientRect();
    let resolved: Side =
      side === "responsive"
        ? window.innerWidth >= 640
          ? "top"
          : "bottom"
        : side;
    if (
      resolved === "right" &&
      rect.right + bounds.width > window.innerWidth - VIEWPORT_GUTTER &&
      rect.left >= bounds.width + VIEWPORT_GUTTER
    )
      resolved = "left";
    else if (resolved === "left" && rect.left < bounds.width + VIEWPORT_GUTTER)
      resolved = "right";
    else if (resolved === "top" && rect.top < bounds.height + VIEWPORT_GUTTER)
      resolved = "bottom";
    else if (
      resolved === "bottom" &&
      rect.bottom + bounds.height > window.innerHeight - VIEWPORT_GUTTER &&
      rect.top >= bounds.height + VIEWPORT_GUTTER
    )
      resolved = "top";
    const horizontal = resolved === "left" || resolved === "right";
    const offset = (start: number, length: number, size: number) =>
      align === "start"
        ? start
        : align === "center"
          ? start + (length - size) / 2
          : start + length - size;
    const left = horizontal
      ? resolved === "right"
        ? rect.right
        : rect.left - bounds.width
      : offset(rect.left, rect.width, bounds.width);
    const top = horizontal
      ? offset(rect.top, rect.height, bounds.height)
      : resolved === "bottom"
        ? rect.bottom
        : rect.top - bounds.height;
    setPosition({
      left: Math.max(
        VIEWPORT_GUTTER,
        Math.min(left, window.innerWidth - bounds.width - VIEWPORT_GUTTER)
      ),
      top: Math.max(
        VIEWPORT_GUTTER,
        Math.min(top, window.innerHeight - bounds.height - VIEWPORT_GUTTER)
      ),
      side: resolved,
    });
  }, [align, content, getTrigger, open, rendered, side]);

  useEffect(() => {
    const anchorElement = getTrigger();
    const trigger =
      anchorElement instanceof HTMLLabelElement
        ? (anchorElement.control ?? anchorElement)
        : anchorElement;
    if (!open || !trigger) return;
    const descriptions = new Set(
      (trigger.getAttribute("aria-describedby") ?? "")
        .split(/\s+/)
        .filter(Boolean)
    );
    if (descriptions.has(tooltipId)) return;
    descriptions.add(tooltipId);
    trigger.setAttribute("aria-describedby", [...descriptions].join(" "));
    return () => {
      const remaining = (trigger.getAttribute("aria-describedby") ?? "")
        .split(/\s+/)
        .filter((value) => value && value !== tooltipId);
      if (remaining.length)
        trigger.setAttribute("aria-describedby", remaining.join(" "));
      else trigger.removeAttribute("aria-describedby");
    };
  }, [getTrigger, open, tooltipId]);

  const resolvedSide = position?.side ?? (side === "responsive" ? "top" : side);
  const bridge =
    resolvedSide === "top"
      ? "pb-2"
      : resolvedSide === "bottom"
        ? "pt-2"
        : resolvedSide === "left"
          ? "pr-2"
          : "pl-2";
  return (
    <>
      <span ref={marker} hidden aria-hidden="true" />
      {rendered
        ? createPortal(
            <span
              ref={panel}
              id={tooltipId}
              role="tooltip"
              aria-hidden={!open}
              data-state={open ? "open" : "closed"}
              data-side={resolvedSide}
              className={`tooltip-positioner fixed z-[100] w-max max-w-[min(14rem,calc(100vw-2rem))] ${bridge}`}
              style={{
                left: position?.left ?? 0,
                top: position?.top ?? 0,
                visibility: position ? "visible" : "hidden",
              }}
              onPointerEnter={(event) => {
                if (event.pointerType === "touch" || dismissed.current) return;
                panelHovered.current = true;
                clearTimer();
              }}
              onPointerLeave={() => {
                panelHovered.current = false;
                leave();
              }}
            >
              <span
                data-state={open ? "open" : "closed"}
                className="relay-tooltip block break-words rounded-md px-2.5 py-1.5 text-left text-xs font-medium leading-5"
              >
                {content}
              </span>
            </span>,
            getTrigger()?.closest("dialog") ??
              document.fullscreenElement ??
              document.body
          )
        : null}
    </>
  );
}
