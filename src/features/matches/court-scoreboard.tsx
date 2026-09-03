"use client";

import {
  ArrowsOutSimple,
  CaretLeft,
  CaretRight,
  Minus,
  Plus,
  X,
} from "@phosphor-icons/react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { Dialog } from "@/components/ui/dialog";

export type CourtScoreboardTeam = {
  label: string;
  players: string[];
};

export type CourtScoreboardNavigation = {
  position: number;
  total: number;
  previousLabel: string;
  nextLabel: string;
  onPrevious: () => void;
  onNext: () => void;
};

type CourtScoreboardProps = {
  courtLabel: string;
  teams: [CourtScoreboardTeam, CourtScoreboardTeam];
  scores: [number, number];
  canScore: boolean;
  scorePending?: boolean;
  error?: string;
  expanded?: boolean;
  navigation?: CourtScoreboardNavigation;
  headerAction?: ReactNode;
  finishControl?: ReactNode;
  closeLabel?: string;
  onScore: (side: 0 | 1, amount: -1 | 1) => void;
  onExpand?: () => void;
  onClose?: () => void;
};

type CourtScoreboardCourtProps = Omit<
  CourtScoreboardProps,
  "expanded" | "onExpand" | "onClose"
> & {
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  keepExpandedContentMounted?: boolean;
};

function TeamName({ team }: { team: CourtScoreboardTeam }) {
  return (
    <p className="flex min-h-12 flex-col items-center justify-center text-center text-sm font-semibold leading-5 text-white/82 sm:text-base">
      {team.players.map((player, index) => (
        <span
          key={`${player}-${index}`}
          className="block max-w-full truncate"
          title={player}
        >
          {index ? (
            <span aria-hidden className="mr-1 text-[var(--scoreboard-line)]">
              +
            </span>
          ) : null}
          {player}
        </span>
      ))}
    </p>
  );
}

function CourtScoreboard({
  courtLabel,
  teams,
  scores,
  canScore,
  scorePending = false,
  error = "",
  expanded = false,
  navigation,
  headerAction,
  finishControl,
  closeLabel = "Close full-screen scoreboard",
  onScore,
  onExpand,
  onClose,
}: CourtScoreboardProps) {
  return (
    <article
      className={`overflow-hidden border border-line bg-surface ${expanded ? "flex h-full flex-col rounded-none border-0" : "rounded-xl"}`}
    >
      <header
        className={`flex shrink-0 items-center justify-between gap-3 border-b border-line ${expanded ? "min-h-16 px-5 sm:px-8" : "min-h-14 px-4"}`}
      >
        <div className="min-w-0">
          <p className="sport-label truncate text-primary">
            {courtLabel.toUpperCase()}
          </p>
          <p className="mt-0.5 text-xs text-muted">Match in progress</p>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-live">
            <span className="h-1.5 w-1.5 rounded-full bg-live" /> Live
          </span>
          {headerAction}
          {onExpand ? (
            <button
              type="button"
              onClick={onExpand}
              aria-label="Open full-screen scoreboard"
              className="pressable inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-muted hover:bg-surface-strong hover:text-ink"
            >
              <ArrowsOutSimple aria-hidden size={19} />
              <span className="hidden min-[360px]:inline">Full screen</span>
            </button>
          ) : null}
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="pressable grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-surface-strong hover:text-ink"
            >
              <X aria-hidden size={19} />
            </button>
          ) : null}
        </div>
      </header>

      {expanded && navigation && navigation.total > 1 ? (
        <nav
          aria-label="Full-screen courts"
          className="flex min-h-12 shrink-0 items-center justify-between border-b border-line px-3 sm:px-6"
        >
          <button
            type="button"
            onClick={navigation.onPrevious}
            aria-label={`Previous court, ${navigation.previousLabel}`}
            className="pressable inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-muted hover:bg-surface-strong hover:text-ink"
          >
            <CaretLeft aria-hidden size={17} /> Previous
          </button>
          <span className="score text-xs font-semibold text-muted">
            Court {navigation.position} of {navigation.total}
          </span>
          <button
            type="button"
            onClick={navigation.onNext}
            aria-label={`Next court, ${navigation.nextLabel}`}
            className="pressable inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-muted hover:bg-surface-strong hover:text-ink"
          >
            Next <CaretRight aria-hidden size={17} />
          </button>
        </nav>
      ) : null}
      {expanded ? (
        <p className="shrink-0 border-b border-line px-4 py-2 text-center text-xs text-muted landscape:hidden sm:hidden">
          Rotate your phone for a wider scoreboard.
        </p>
      ) : null}

      <div
        className={`grid shrink-0 grid-cols-2 bg-[var(--scoreboard-field)] text-white ${expanded ? "min-h-0 flex-1" : ""}`}
      >
        {([0, 1] as const).map((side) => (
          <section
            key={side}
            aria-label={teams[side].label}
            className={`flex min-w-0 flex-col ${side === 1 ? "court-rule border-l" : ""}`}
          >
            <div
              className={`flex min-h-0 flex-1 flex-col justify-center text-center ${expanded ? "px-5 py-8 sm:px-10 landscape:py-1" : "px-4 pb-5 pt-6"}`}
            >
              <TeamName team={teams[side]} />
              <output
                aria-live="polite"
                aria-label={`${teams[side].label} score ${scores[side]}`}
                className={`score mt-3 block font-bold leading-none tracking-[-0.055em] ${expanded ? "text-[clamp(7rem,22vw,16rem)] landscape:text-[clamp(4rem,14vh,7rem)]" : "text-[5rem] sm:text-[6.5rem]"}`}
              >
                {scores[side]}
              </output>
            </div>
            {canScore ? (
              <div className="court-rule grid shrink-0 grid-cols-2 border-t">
                <button
                  type="button"
                  onClick={() => onScore(side, -1)}
                  disabled={scores[side] === 0}
                  aria-label={`Subtract a point from ${teams[side].label}`}
                  className={`pressable grid place-items-center court-rule border-r text-white/65 hover:bg-white/10 hover:text-white disabled:opacity-35 ${expanded ? "min-h-20" : "min-h-16"}`}
                >
                  <Minus aria-hidden size={expanded ? 24 : 20} />
                </button>
                <button
                  type="button"
                  onClick={() => onScore(side, 1)}
                  aria-label={`Add a point to ${teams[side].label}`}
                  className={`pressable grid place-items-center text-white hover:bg-white/10 disabled:opacity-35 ${expanded ? "min-h-20" : "min-h-16"}`}
                >
                  <Plus aria-hidden size={expanded ? 24 : 20} />
                </button>
              </div>
            ) : null}
          </section>
        ))}
      </div>

      {error ? (
        <p
          role="alert"
          className="shrink-0 border-t border-line px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      ) : scorePending ? (
        <p className="sr-only" aria-live="polite">
          Saving score…
        </p>
      ) : null}
      {finishControl ? (
        <footer
          className={`shrink-0 border-t border-line ${expanded ? "p-4 sm:px-8" : "p-3"}`}
        >
          {finishControl}
        </footer>
      ) : null}
    </article>
  );
}

export function CourtScoreboardCourt({
  expanded,
  onExpandedChange,
  navigation,
  keepExpandedContentMounted = false,
  ...scoreboard
}: CourtScoreboardCourtProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [standaloneExpanded, setStandaloneExpanded] = useState(false);
  const isExpanded = expanded ?? standaloneExpanded;
  const setExpanded = onExpandedChange ?? setStandaloneExpanded;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isExpanded && !dialog.open) dialog.showModal();
    else if (!isExpanded && dialog.open) dialog.close();
  }, [isExpanded]);

  return (
    <>
      <CourtScoreboard
        {...scoreboard}
        navigation={navigation}
        onExpand={() => setExpanded(true)}
      />
      <Dialog
        ref={dialogRef}
        onCancel={() => setExpanded(false)}
        onKeyDown={(event) => {
          if (!navigation) return;
          if (event.key === "ArrowLeft") navigation.onPrevious();
          else if (event.key === "ArrowRight") navigation.onNext();
        }}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) setExpanded(false);
        }}
        aria-label={`${scoreboard.courtLabel} full-screen scoreboard`}
        variant="fullscreen"
      >
        {isExpanded || keepExpandedContentMounted ? (
          <CourtScoreboard
            {...scoreboard}
            expanded
            navigation={navigation}
            onClose={() => setExpanded(false)}
          />
        ) : null}
      </Dialog>
    </>
  );
}
