"use client";

import { ArrowClockwise, Broadcast, Pause, X } from "@phosphor-icons/react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { IconTooltip } from "@/components/ui/icon-tooltip";

import {
  type QuickPlaySession,
  setQuickPlayPlayerAvailability,
} from "./quick-play-session";

export function QuickPlayPlayers({
  session,
  onChange,
}: {
  session: QuickPlaySession;
  onChange: (session: QuickPlaySession) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-live">
        <Broadcast aria-hidden size={17} /> Play in progress
      </span>
      <Button
        type="button"
        variant="secondary"
        className="ml-auto"
        aria-haspopup="dialog"
        onClick={() => {
          dialog.current?.showModal();
          heading.current?.focus();
        }}
      >
        Players ({session.players.length})
      </Button>
      <Dialog
        ref={dialog}
        variant="drawer"
        aria-labelledby="quick-players-title"
      >
        <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 sm:px-6">
          <h2
            ref={heading}
            tabIndex={-1}
            id="quick-players-title"
            className="text-lg font-bold outline-none"
          >
            Players ({session.players.length})
          </h2>
          <IconTooltip label="Close players">
            <Button
              type="button"
              variant="quiet"
              size="icon"
              aria-label="Close players"
              onClick={() => dialog.current?.close()}
            >
              <X aria-hidden size={20} />
            </Button>
          </IconTooltip>
        </div>
        <div className="px-4 pb-8 sm:px-6">
          <p className="my-4 text-sm text-muted">
            Take a break or rejoin the queue. Player names stay fixed for this
            session.
          </p>
          <QuickPlayAvailability session={session} onChange={onChange} />
        </div>
      </Dialog>
    </div>
  );
}

export function QuickPlayAvailability({
  session,
  onChange,
}: {
  session: QuickPlaySession;
  onChange: (session: QuickPlaySession) => void;
}) {
  const playing = new Set(
    session.activeMatches.flatMap((match) => [...match.teamA, ...match.teamB])
  );
  const resting = new Set(session.restingPlayerIds);
  return (
    <div>
      <p className="mt-1 mb-3 text-sm leading-5 text-muted">
        {session.players.length - resting.size} of {session.players.length}{" "}
        available · returning players join the end.
      </p>
      {session.mode === "king_of_court" ? (
        <p className="mb-4 text-sm text-muted">
          Court Climb waits for every player to rejoin before the next round.
        </p>
      ) : session.fixedPairs.length ? (
        <p className="mb-4 text-sm text-muted">
          Fixed pairs play only when both partners are ready.
        </p>
      ) : null}
      <div className="divide-y divide-line border-y border-line">
        {session.players.map((player) => {
          const onCourt = playing.has(player.id);
          const onBreak = resting.has(player.id);
          const status = onBreak
            ? onCourt
              ? "Taking a break after this match"
              : "Taking a break"
            : onCourt
              ? "On court"
              : "Waiting";
          const action = onBreak
            ? onCourt
              ? "Keep me in rotation"
              : "Rejoin queue"
            : onCourt
              ? "Take a break after this match"
              : "Take a break";
          return (
            <div
              key={player.id}
              className="flex min-h-16 items-center gap-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{player.name}</p>
                <p className="text-xs font-medium text-muted">{status}</p>
              </div>
              <IconTooltip label={`${action} for ${player.name}`} side="top">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  aria-label={`${action} for ${player.name}`}
                  onClick={() =>
                    onChange(
                      setQuickPlayPlayerAvailability(
                        session,
                        player.id,
                        onBreak ? "ready" : "sit_out"
                      )
                    )
                  }
                >
                  {onBreak ? (
                    <ArrowClockwise aria-hidden size={16} />
                  ) : (
                    <Pause aria-hidden size={16} weight="fill" />
                  )}
                </Button>
              </IconTooltip>
            </div>
          );
        })}
      </div>
    </div>
  );
}
