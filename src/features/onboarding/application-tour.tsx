"use client";

import { ArrowLeft, ArrowRight, X } from "@phosphor-icons/react";
import { usePathname, useSearchParams } from "next/navigation";
import { type CSSProperties, useEffect, useLayoutEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { PendingSubmit } from "@/components/ui/pending-submit";
import { safeNextPath } from "@/features/auth/destination-path";

import { completeProductTour } from "./actions";

const steps = [
  {
    key: "welcome",
    target: null,
    title: "Welcome to Relay",
    description:
      "Relay keeps one pickleball game together—from the invite and court plan to scores, payments, and memories.",
  },
  {
    key: "create",
    target: "create",
    title: "Start with a game",
    description:
      "Set the date, court, player limit, and court count. Publishing creates the shared link your friends can open without an account.",
  },
  {
    key: "home",
    target: "home",
    title: "Check your next game",
    description: "Home shows your next game, booking status, roster, payments, and next task.",
  },
  {
    key: "courts",
    target: "courts",
    title: "Find a court",
    description: "Browse verified courts on the map, check the details, and use one in a new game.",
  },
  {
    key: "profile",
    target: "profile",
    title: "Open your profile",
    description:
      "Your profile keeps your games and memories together. Theme, layout, and other preferences live here too.",
  },
] as const;

type TargetRect = { top: number; right: number; bottom: number; left: number; width: number; height: number };

function visibleTarget(name: string) {
  return (
    [...document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`)].find((element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    }) ?? null
  );
}

function popoverPosition(rect: TargetRect | null): CSSProperties {
  const gutter = 16;
  const viewportWidth = typeof window === "undefined" ? 390 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 844 : window.innerHeight;
  const width = Math.min(340, viewportWidth - gutter * 2);
  if (!rect) return { left: "50%", top: "50%", width, transform: "translate(-50%, -50%)" };
  if (viewportWidth >= 700 && rect.right < viewportWidth * 0.35)
    return {
      top: Math.min(Math.max(gutter, rect.top), viewportHeight - 280),
      left: Math.min(rect.right + 14, viewportWidth - width - gutter),
      width,
    };
  if (rect.bottom > viewportHeight * 0.68)
    return {
      bottom: Math.max(gutter, viewportHeight - rect.top + 12),
      left: Math.min(Math.max(gutter, rect.left + rect.width / 2 - width / 2), viewportWidth - width - gutter),
      width,
    };
  if (rect.top < 96 || viewportWidth < 700)
    return {
      top: Math.min(viewportHeight - 280, rect.bottom + 12),
      left: Math.min(Math.max(gutter, rect.left + rect.width / 2 - width / 2), viewportWidth - width - gutter),
      width,
    };
  return {
    top: Math.min(rect.top, viewportHeight - 280),
    left: Math.min(rect.right + 14, viewportWidth - width - gutter),
    width,
  };
}

export function ApplicationTour({ required }: { required: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const open = (required && pathname === "/home") || searchParams.get("tour") === "1";
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const dialog = useRef<HTMLElement>(null);
  const closeForm = useRef<HTMLFormElement>(null);
  const current = steps[step];
  const replay = !required;
  const requestedDestination = safeNextPath(searchParams.get("next"));
  const createDestination = requestedDestination.startsWith("/games/new") ? requestedDestination : "/games/new";
  const continuationDestination = requestedDestination.startsWith("/games/new") ? "/home" : requestedDestination;
  const continuationLabel = continuationDestination.startsWith("/games/") ? "Open saved game" : "Explore Relay";

  useLayoutEffect(() => {
    if (!open) return;
    const target = current.target ? visibleTarget(current.target) : null;
    target?.scrollIntoView({ block: "nearest", inline: "nearest" });
    const update = () => {
      const nextTarget = current.target ? visibleTarget(current.target) : null;
      const rect = nextTarget?.getBoundingClientRect();
      setTargetRect(
        rect
          ? {
              top: rect.top,
              right: rect.right,
              bottom: rect.bottom,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            }
          : null,
      );
    };
    update();
    const frame = requestAnimationFrame(update);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
    };
  }, [current.target, open]);

  useEffect(() => {
    if (!open) return;
    const panel = dialog.current;
    panel?.querySelector<HTMLElement>("[data-tour-primary]")?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeForm.current?.requestSubmit();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const focusable = [
        ...panel.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not([type="hidden"])'),
      ];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, step]);

  if (!open) return null;
  const finalStep = step === steps.length - 1;
  const spotlight = targetRect
    ? {
        top: targetRect.top - 5,
        left: targetRect.left - 5,
        width: targetRect.width + 10,
        height: targetRect.height + 10,
      }
    : null;

  return (
    <div className="fixed inset-0 z-[80]" aria-live="polite">
      <div className="absolute inset-0 bg-transparent" aria-hidden />
      {spotlight ? (
        <div
          data-tour-spotlight
          aria-hidden
          className="pointer-events-none fixed rounded-[10px] ring-2 ring-white/95 shadow-[0_0_0_9999px_rgb(13_15_20/.56)] transition-[top,left,width,height] duration-200 motion-reduce:transition-none"
          style={spotlight}
        />
      ) : (
        <div aria-hidden className="fixed inset-0 bg-[rgb(13_15_20/.56)]" />
      )}
      <section
        ref={dialog}
        data-tour-dialog
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-tour-title"
        aria-describedby="application-tour-description"
        className="fixed rounded-xl border border-line bg-surface p-5 text-ink shadow-[0_8px_24px_rgb(13_15_20/.18)]"
        style={popoverPosition(targetRect)}
      >
        <div className="flex items-center justify-between gap-4">
          <p className="score text-xs font-semibold text-primary">
            {step + 1} / {steps.length}
          </p>
          <form noValidate ref={closeForm} action={completeProductTour}>
            <input type="hidden" name="destination" value={continuationDestination} />
            <button
              type="submit"
              aria-label={replay ? "Close application tour" : "Skip application tour"}
              className="pressable grid h-9 w-9 place-items-center rounded-md text-muted hover:bg-surface-strong hover:text-ink"
            >
              <X aria-hidden size={17} />
            </button>
          </form>
        </div>
        <h2 id="application-tour-title" className="mt-3 text-xl font-bold tracking-[-0.025em]">
          {current.title}
        </h2>
        <p id="application-tour-description" className="mt-2 text-sm leading-6 text-muted">
          {current.description}
        </p>
        <div
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={step + 1}
          className="mt-5 flex gap-1"
          aria-label={`Tour step ${step + 1} of ${steps.length}`}
        >
          {steps.map((item, index) => (
            <span
              key={item.key}
              className={`h-1 flex-1 rounded-full ${index <= step ? "bg-primary" : "bg-surface-strong"}`}
            />
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          {step ? (
            <Button variant="quiet" onClick={() => setStep((value) => value - 1)}>
              <ArrowLeft aria-hidden size={15} />
              Back
            </Button>
          ) : (
            <span />
          )}
          {finalStep ? (
            <div className="flex items-center gap-2">
              <form noValidate action={completeProductTour}>
                <input type="hidden" name="destination" value={continuationDestination} />
                <PendingSubmit
                  pendingLabel="Finishing…"
                  className="pressable inline-flex h-9 items-center rounded-lg px-2.5 text-[13px] font-semibold text-muted hover:bg-surface-strong hover:text-ink"
                >
                  {continuationLabel}
                </PendingSubmit>
              </form>
              <form noValidate action={completeProductTour}>
                <input type="hidden" name="destination" value={createDestination} />
                <PendingSubmit
                  data-tour-primary
                  pendingLabel="Opening…"
                  className="pressable inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-primary px-3 text-[13px] font-semibold text-white hover:bg-primary-hover"
                >
                  Create a game
                  <ArrowRight aria-hidden size={15} />
                </PendingSubmit>
              </form>
            </div>
          ) : (
            <Button data-tour-primary onClick={() => setStep((value) => value + 1)}>
              Next
              <ArrowRight aria-hidden size={15} />
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
