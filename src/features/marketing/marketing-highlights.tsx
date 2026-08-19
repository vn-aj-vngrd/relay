"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useRef, useState } from "react";

import { MarketingHighlightVisual } from "./marketing-highlight-visuals";

type MarketingHighlight = {
  stage: string;
  title: string;
  detail: string;
  visual: "find" | "plan" | "invite" | "organize" | "play" | "repay" | "sync" | "remember";
  dark?: boolean;
};

const highlights: readonly MarketingHighlight[] = [
  {
    stage: "Find",
    title: "Start with a court that works.",
    detail:
      "Explore the map, compare practical details, and carry a venue straight into Create. Court Finder is currently a Cebu pilot.",
    visual: "find",
  },
  {
    stage: "Plan",
    title: "Plan it before the chat gets noisy.",
    detail:
      "Set the schedule, player limit, courts, booking details, and readiness without opening every option at once.",
    visual: "plan",
  },
  {
    stage: "Invite",
    title: "One link answers every question.",
    detail: "Guest RSVP, host approval, capacity, and an automatic waitlist—no account required.",
    visual: "invite",
  },
  {
    stage: "Organize",
    title: "Keep the crew, not the admin.",
    detail: "Roster controls, recurring groups, calendar, global search, and Play Again.",
    visual: "organize",
  },
  {
    stage: "Play",
    title: "Run every court from one phone.",
    detail: "Arrival check-in, five play formats, shared timer, paddle stack, multi-court scores, and standings.",
    visual: "play",
    dark: true,
  },
  {
    stage: "Repay",
    title: "Split what the host already covered.",
    detail: "GCash, Maya, bank or cash, proof review, exclusions, and adjusted shares.",
    visual: "repay",
  },
  {
    stage: "Stay in sync",
    title: "The conversation stays with the game.",
    detail: "Realtime chat, photos, reactions, system updates, and useful notifications.",
    visual: "sync",
  },
  {
    stage: "Remember",
    title: "Turn the night into a story.",
    detail: "Seven portrait recaps, chosen backgrounds, standings, photos, and shared memories.",
    visual: "remember",
  },
];

export function MarketingHighlights() {
  const railRef = useRef<HTMLUListElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  function moveTo(index: number) {
    const nextIndex = Math.max(0, Math.min(highlights.length - 1, index));
    const rail = railRef.current;
    const card = rail?.children.item(nextIndex) as HTMLElement | null;
    if (!rail || !card) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rail.scrollTo({ left: card.offsetLeft - rail.offsetLeft, behavior: reducedMotion ? "auto" : "smooth" });
    setActiveIndex(nextIndex);
  }

  function updateActiveCard() {
    const rail = railRef.current;
    if (!rail) return;
    const cards = Array.from(rail.children) as HTMLElement[];
    const nearest = cards.reduce(
      (best, card, index) => {
        const distance = Math.abs(card.offsetLeft - rail.offsetLeft - rail.scrollLeft);
        return distance < best.distance ? { index, distance } : best;
      },
      { index: 0, distance: Number.POSITIVE_INFINITY },
    );
    setActiveIndex(nearest.index);
  }

  return (
    <section id="highlights" className="border-y border-[#deded9] bg-[#f0f1f3] py-16 sm:py-20">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <div data-marketing-reveal="split" className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold text-[#526415]">Relay at a glance</p>
            <h2 className="mt-3 text-4xl font-[620] tracking-[-0.045em] sm:text-6xl">Get the highlights.</h2>
          </div>
          <p className="hidden max-w-sm text-right text-sm leading-6 text-[#66666c] md:block">
            One continuous path from making the plan to sharing the night afterward.
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
              moveTo(activeIndex + (event.key === "ArrowLeft" ? -1 : 1));
            }
          }}
          onScroll={updateActiveCard}
          className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-3 pr-[12vw] outline-none [scrollbar-width:none] focus-visible:ring-3 focus-visible:ring-[#5962d9]/25 [&::-webkit-scrollbar]:hidden sm:mt-14 sm:gap-5 sm:pr-24"
        >
          {highlights.map((highlight, index) => (
            <li
              key={highlight.stage}
              aria-label={`${index + 1} of ${highlights.length}: ${highlight.stage}`}
              className={`relative h-[470px] w-[88vw] max-w-[390px] shrink-0 snap-start overflow-hidden rounded-2xl border p-6 sm:h-[500px] sm:w-[390px] sm:p-7 lg:w-[350px] ${highlight.dark ? "border-[#202b43] bg-[#18233b] text-white" : "border-[#deded9] bg-white text-[#171719]"}`}
            >
              <p className={`text-xs font-semibold ${highlight.dark ? "text-white/60" : "text-[#6b6b70]"}`}>
                0{index + 1} · {highlight.stage}
              </p>
              <h3 className="mt-3 max-w-[320px] text-2xl font-[620] leading-[1.08] tracking-[-0.035em]">
                {highlight.title}
              </h3>
              <p
                className={`mt-3 max-w-[320px] text-sm leading-6 ${highlight.dark ? "text-white/68" : "text-[#66666c]"}`}
              >
                {highlight.detail}
              </p>
              <div
                className={`absolute inset-x-5 bottom-5 h-[235px] overflow-hidden rounded-xl border sm:inset-x-6 sm:bottom-6 sm:h-[260px] ${highlight.dark ? "border-white/15 bg-[#111827]" : "border-[#deded9] bg-[#f7f7f5]"}`}
              >
                <MarketingHighlightVisual name={highlight.visual} />
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between gap-5">
          <p className="font-mono text-xs text-[#66666c]" aria-live="polite">
            {String(activeIndex + 1).padStart(2, "0")} / {String(highlights.length).padStart(2, "0")}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Previous highlight"
              disabled={activeIndex === 0}
              onClick={() => moveTo(activeIndex - 1)}
              className="grid h-10 w-10 place-items-center rounded-full bg-[#dedfe3] text-[#313238] transition-colors hover:bg-[#d1d2d6] disabled:opacity-35"
            >
              <CaretLeft aria-hidden size={18} weight="bold" />
            </button>
            <button
              type="button"
              aria-label="Next highlight"
              disabled={activeIndex === highlights.length - 1}
              onClick={() => moveTo(activeIndex + 1)}
              className="grid h-10 w-10 place-items-center rounded-full bg-[#dedfe3] text-[#313238] transition-colors hover:bg-[#d1d2d6] disabled:opacity-35"
            >
              <CaretRight aria-hidden size={18} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
