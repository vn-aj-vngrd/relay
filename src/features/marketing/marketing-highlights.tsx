"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

import { MarketingHighlightVisual } from "./marketing-highlight-visuals";

type MarketingHighlight = {
  stage: string;
  title: string;
  detail: string;
  visual:
    | "find"
    | "plan"
    | "invite"
    | "organize"
    | "play"
    | "repay"
    | "sync"
    | "remember";
  dark?: boolean;
};

const highlights: readonly MarketingHighlight[] = [
  {
    stage: "Find",
    title: "Find a court in the Philippines.",
    detail:
      "Search the Philippines-only directory by court or place, check the details, and use it in a new game.",
    visual: "find",
  },
  {
    stage: "Plan",
    title: "Set the plan.",
    detail: "Add the time, court, player limit, cost, and booking details.",
    visual: "plan",
  },
  {
    stage: "Invite",
    title: "Invite players with one link.",
    detail:
      "Guests can see the plan and RSVP by name. Relay handles the player limit and waitlist.",
    visual: "invite",
  },
  {
    stage: "Organize",
    title: "Keep regular players together.",
    detail:
      "Save groups, manage the roster, use the calendar, and set up another game.",
    visual: "organize",
  },
  {
    stage: "Play",
    title: "Run the courts from one phone.",
    detail:
      "Check players in, choose a format, run a timer, and record scores.",
    visual: "play",
    dark: true,
  },
  {
    stage: "Repay",
    title: "Split the cost.",
    detail:
      "Share payment details, adjust each share, and review proof of payment.",
    visual: "repay",
  },
  {
    stage: "Stay in sync",
    title: "Keep messages with the game.",
    detail: "Send messages, photos, and reactions. Get updates about the game.",
    visual: "sync",
  },
  {
    stage: "Remember",
    title: "Save and share the result.",
    detail: "Keep the final scores and photos, then make an image to share.",
    visual: "remember",
  },
];

export function MarketingHighlights() {
  const railRef = useRef<HTMLUListElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollPrevious, setCanScrollPrevious] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  function updateScrollState() {
    const rail = railRef.current;
    if (!rail) return;
    const maximum = Math.max(0, rail.scrollWidth - rail.clientWidth);
    setCanScrollPrevious(rail.scrollLeft > 2);
    setCanScrollNext(rail.scrollLeft < maximum - 2);
  }

  useEffect(() => {
    updateScrollState();
    const update = () => updateScrollState();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  function moveTo(index: number) {
    const nextIndex = Math.max(0, Math.min(highlights.length - 1, index));
    const rail = railRef.current;
    const card = rail?.children.item(nextIndex) as HTMLElement | null;
    if (!rail || !card) return;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const maximum = Math.max(0, rail.scrollWidth - rail.clientWidth);
    const target = Math.max(
      0,
      Math.min(card.offsetLeft - rail.offsetLeft, maximum)
    );
    rail.scrollTo({
      left: target,
      behavior: reducedMotion ? "auto" : "smooth",
    });
    setActiveIndex(nextIndex);
    setCanScrollPrevious(target > 2);
    setCanScrollNext(target < maximum - 2);
  }

  function updateActiveCard() {
    const rail = railRef.current;
    if (!rail) return;
    const cards = Array.from(rail.children) as HTMLElement[];
    const nearest = cards.reduce(
      (best, card, index) => {
        const distance = Math.abs(
          card.offsetLeft - rail.offsetLeft - rail.scrollLeft
        );
        return distance < best.distance ? { index, distance } : best;
      },
      { index: 0, distance: Number.POSITIVE_INFINITY }
    );
    setActiveIndex(nearest.index);
    updateScrollState();
  }

  return (
    <section
      id="highlights"
      className="border-y border-line bg-surface-strong py-16 sm:py-20"
    >
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <div
          data-marketing-reveal="split"
          className="flex items-end justify-between gap-6"
        >
          <div>
            <p className="text-sm font-semibold text-marketing-accent">
              What Relay does
            </p>
            <h2 className="mt-3 text-4xl font-[620] tracking-[-0.045em] sm:text-6xl">
              See what Relay does.
            </h2>
          </div>
          <p className="hidden max-w-sm text-right text-sm leading-6 text-muted md:block">
            Plan the game, invite players, run the courts, and save the result.
          </p>
        </div>

        <ul
          ref={railRef}
          role="list"
          aria-label="Relay product highlights"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              event.preventDefault();
              const direction = event.key === "ArrowLeft" ? -1 : 1;
              if (
                (direction < 0 && canScrollPrevious) ||
                (direction > 0 && canScrollNext)
              )
                moveTo(activeIndex + direction);
            }
          }}
          onScroll={updateActiveCard}
          className="marketing-highlight-rail mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-3 outline-none [scrollbar-width:none] focus-visible:ring-3 focus-visible:ring-[#5962d9]/25 [&::-webkit-scrollbar]:hidden sm:mt-14 sm:gap-5"
        >
          {highlights.map((highlight, index) => (
            <li
              key={highlight.stage}
              aria-label={`${index + 1} of ${highlights.length}: ${highlight.stage}`}
              className={`relative h-[470px] w-[88vw] max-w-[390px] shrink-0 snap-start overflow-hidden rounded-2xl border p-6 sm:h-[500px] sm:w-[390px] sm:p-7 lg:w-[350px] ${highlight.dark ? "border-[#202b43] bg-[#18233b] text-white" : "border-line bg-surface text-ink"}`}
            >
              <p
                className={`text-xs font-semibold ${highlight.dark ? "text-white/60" : "text-muted"}`}
              >
                0{index + 1} · {highlight.stage}
              </p>
              <h3 className="mt-3 max-w-[320px] text-2xl font-[620] leading-[1.08] tracking-[-0.035em]">
                {highlight.title}
              </h3>
              <p
                className={`mt-3 max-w-[320px] text-sm leading-6 ${highlight.dark ? "text-white/68" : "text-muted"}`}
              >
                {highlight.detail}
              </p>
              <div
                className={`absolute inset-x-5 bottom-5 h-[235px] overflow-hidden rounded-xl border sm:inset-x-6 sm:bottom-6 sm:h-[260px] ${highlight.dark ? "border-white/15 bg-[#111827]" : "border-line bg-canvas"}`}
              >
                <MarketingHighlightVisual name={highlight.visual} />
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between gap-5">
          <p className="font-mono text-xs text-muted" aria-live="polite">
            {String(activeIndex + 1).padStart(2, "0")} /{" "}
            {String(highlights.length).padStart(2, "0")}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Previous highlight"
              disabled={!canScrollPrevious}
              onClick={() => moveTo(activeIndex - 1)}
              className="grid h-10 w-10 place-items-center rounded-full bg-surface-strong text-ink transition-colors hover:bg-line disabled:opacity-35"
            >
              <CaretLeft aria-hidden size={18} weight="bold" />
            </button>
            <button
              type="button"
              aria-label="Next highlight"
              disabled={!canScrollNext}
              onClick={() => moveTo(activeIndex + 1)}
              className="grid h-10 w-10 place-items-center rounded-full bg-surface-strong text-ink transition-colors hover:bg-line disabled:opacity-35"
            >
              <CaretRight aria-hidden size={18} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
