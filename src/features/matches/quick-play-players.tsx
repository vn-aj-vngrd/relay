"use client";

import { ArrowClockwise, Broadcast, Pause, X } from "@phosphor-icons/react";
import { type FormEvent, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { IconTooltip } from "@/components/ui/icon-tooltip";

import {
  addQuickPlayPlayer,
  maxQuickPlayPlayers,
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
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const canAdd = session.mode === "queue" && !session.fixedPairs.length;
  function addPlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      onChange(
        addQuickPlayPlayer(session, {
          id: crypto.randomUUID(),
          name,
          experience: 2,
        })
      );
      setNotice(`${name.trim()} joined the end of the queue.`);
      setName("");
      setError("");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not add this player. Try again."
      );
      setNotice("");
    }
  }
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
            Take a break or rejoin the queue.
          </p>
          {canAdd ? (
            <form
              noValidate
              onSubmit={addPlayer}
              className="mb-5 border-b border-line pb-5"
            >
              <label
                htmlFor="quick-late-player"
                className="text-sm font-semibold"
              >
                Add a player
              </label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  id="quick-late-player"
                  className="field mt-0 min-w-0 flex-1"
                  value={name}
                  maxLength={50}
                  autoComplete="off"
                  placeholder="Player name"
                  onChange={(event) => {
                    setName(event.target.value);
                    setError("");
                    setNotice("");
                  }}
                  aria-invalid={Boolean(error)}
                  aria-describedby="quick-late-player-help"
                  disabled={session.players.length >= maxQuickPlayPlayers}
                />
                <Button
                  type="submit"
                  disabled={
                    !name.trim() ||
                    session.players.length >= maxQuickPlayPlayers
                  }
                >
                  Add player
                </Button>
              </div>
              <p
                id="quick-late-player-help"
                className={`mt-2 text-xs ${error ? "text-danger" : "text-muted"}`}
                role={error ? "alert" : undefined}
              >
                {error ||
                  (session.players.length >= maxQuickPlayPlayers
                    ? "All 24 player spots are filled."
                    : "New arrivals join the end. Current matches stay unchanged.")}
              </p>
              <p role="status" className="mt-2 text-xs text-muted">
                {notice}
              </p>
            </form>
          ) : (
            <p className="mb-4 text-xs text-muted">
              This format keeps its starting roster. Use mixed-partner Paddle
              Stack to add players during play.
            </p>
          )}
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
