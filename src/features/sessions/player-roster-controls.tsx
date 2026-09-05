"use client";

import {
  Check,
  LockKey,
  LockKeyOpen,
  UserMinus,
  UserPlus,
  X,
} from "@phosphor-icons/react";
import type { KeyboardEvent } from "react";
import { useActionState, useEffect, useId, useRef, useState } from "react";

import { Avatar } from "@/components/shared/avatar-stack";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { IconTooltip } from "@/components/ui/icon-tooltip";
import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { playingExperienceOptions } from "@/features/players/playing-experience";
import type { SearchResponse, SearchResult } from "@/features/search/domain";

import {
  addPlayerAction,
  approvePlayerAction,
  removePlayerAction,
  type SessionActionState,
  toggleRosterLockAction,
} from "./actions";

export function AddPlayerForm({ sessionId }: { sessionId: string }) {
  const [state, action, isPending] = useActionState<
    SessionActionState,
    FormData
  >(addPlayerAction, {});
  const [playerEntry, setPlayerEntry] = useState("");
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<SearchResult | null>(
    null
  );
  const [searchStatus, setSearchStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const formRef = useRef<HTMLFormElement>(null);
  const comboboxRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const isRelayInvite = playerEntry.trimStart().startsWith("@");
  const relayQuery = isRelayInvite
    ? playerEntry.trimStart().slice(1).trim()
    : "";

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  useEffect(() => {
    if (isPending || relayQuery.length < 2 || selectedPlayer) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSearchStatus("loading");
      void fetch(
        `/api/search?q=${encodeURIComponent(relayQuery)}&type=players&cursor=0`,
        {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        }
      )
        .then(async (response) => {
          if (!response.ok) throw new Error("PLAYER_SEARCH_FAILED");
          const data = (await response.json()) as SearchResponse;
          const players = data.items
            .filter((item) => item.type === "players")
            .slice(0, 6);
          setSuggestions(players);
          setActiveIndex(players.length ? 0 : -1);
          setSearchStatus("ready");
        })
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === "AbortError")) {
            setSuggestions([]);
            setActiveIndex(-1);
            setSearchStatus("error");
          }
        });
    }, 280);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [isPending, relayQuery, selectedPlayer]);

  function resetPlayerEntry() {
    setPlayerEntry("");
    setSuggestions([]);
    setSelectedPlayer(null);
    setSearchStatus("idle");
    setSuggestionsOpen(false);
    setActiveIndex(-1);
  }

  function selectPlayer(player: SearchResult) {
    const username = decodeURIComponent(
      player.href.replace(/^\/profile\//, "")
    );
    setPlayerEntry(`@${username}`);
    setSelectedPlayer(player);
    setSuggestionsOpen(false);
    setActiveIndex(-1);
  }

  function handleComboboxKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setSuggestionsOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!suggestionsOpen || suggestions.length === 0) {
      if (event.key === "ArrowDown" && suggestions.length) {
        event.preventDefault();
        setSuggestionsOpen(true);
        setActiveIndex(0);
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) =>
        index <= 0 ? suggestions.length - 1 : index - 1
      );
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectPlayer(suggestions[activeIndex]);
    }
  }

  const suggestionMessage =
    relayQuery.length < 2
      ? "Type at least 2 characters to find a Relay player."
      : searchStatus === "error"
        ? "Player search is unavailable. Edit the username to try again."
        : searchStatus === "ready" && suggestions.length === 0
          ? `No Relay players found for “${relayQuery}”.`
          : "Finding Relay players…";

  return (
    <form
      noValidate
      ref={formRef}
      action={action}
      onSubmit={() => {
        setSuggestionsOpen(false);
        setActiveIndex(-1);
      }}
      onReset={resetPlayerEntry}
      aria-busy={isPending}
      className="mt-4"
    >
      <input type="hidden" name="sessionId" value={sessionId} />
      <div
        className={`grid gap-2 sm:items-end ${isRelayInvite ? "sm:grid-cols-[minmax(0,1fr)_auto]" : "sm:grid-cols-[minmax(0,1fr)_260px_auto]"}`}
      >
        <div
          ref={comboboxRef}
          className="relative min-w-0"
          onBlurCapture={(event) => {
            if (
              !comboboxRef.current?.contains(event.relatedTarget as Node | null)
            ) {
              setSuggestionsOpen(false);
              setActiveIndex(-1);
            }
          }}
        >
          <label htmlFor="player-entry" className="sr-only">
            Guest name or Relay username
          </label>
          <input
            id="player-entry"
            name="playerEntry"
            required
            minLength={2}
            maxLength={60}
            autoComplete="off"
            spellCheck={!isRelayInvite}
            disabled={isPending}
            value={playerEntry}
            onChange={(event) => {
              const nextEntry = event.target.value;
              const nextIsRelayInvite = nextEntry.trimStart().startsWith("@");
              setPlayerEntry(nextEntry);
              setSelectedPlayer(null);
              setSuggestions([]);
              setSearchStatus("idle");
              setSuggestionsOpen(nextIsRelayInvite);
              setActiveIndex(-1);
            }}
            onFocus={() => {
              if (isRelayInvite) setSuggestionsOpen(true);
            }}
            onKeyDown={handleComboboxKeyDown}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={
              isRelayInvite && suggestionsOpen && suggestions.length > 0
            }
            aria-controls={
              isRelayInvite && suggestions.length > 0 ? listboxId : undefined
            }
            aria-busy={searchStatus === "loading"}
            aria-activedescendant={
              suggestionsOpen && activeIndex >= 0
                ? `${listboxId}-option-${activeIndex}`
                : undefined
            }
            aria-describedby="player-entry-hint"
            placeholder="Guest name or @username"
            className="h-11 w-full min-w-0 rounded-lg border border-line bg-surface px-3 text-base placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-surface-strong disabled:text-muted sm:text-sm"
          />
          {isRelayInvite && suggestionsOpen && !isPending ? (
            <div
              id={suggestions.length ? listboxId : undefined}
              role={suggestions.length ? "listbox" : "status"}
              aria-label={
                suggestions.length ? "Relay player suggestions" : undefined
              }
              className="absolute inset-x-0 top-[48px] z-40 max-h-72 overflow-y-auto rounded-lg border border-line bg-surface p-1 shadow-[0_6px_8px_oklch(0.1_0.01_275/.12)]"
            >
              {suggestions.length ? (
                suggestions.map((player, index) => (
                  <div
                    key={player.id}
                    id={`${listboxId}-option-${index}`}
                    role="option"
                    aria-selected={activeIndex === index}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectPlayer(player)}
                    className={`pressable flex min-h-14 cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left ${activeIndex === index ? "bg-surface-strong" : "hover:bg-surface-strong/70"}`}
                  >
                    <Avatar
                      name={player.title}
                      imageUrl={player.imageUrl ?? undefined}
                      index={index}
                      size="sm"
                    />
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-sm font-semibold text-ink">
                        {player.title}
                      </strong>
                      <span className="mt-0.5 block truncate text-xs text-muted">
                        {player.subtitle}
                      </span>
                    </span>
                  </div>
                ))
              ) : (
                <p className="px-3 py-3 text-sm text-muted">
                  {suggestionMessage}
                </p>
              )}
            </div>
          ) : null}
        </div>
        {!isRelayInvite ? (
          <SelectField
            id="guest-player-experience"
            name="skillLevel"
            label="Guest playing experience"
            hideLabel
            defaultValue=""
            disabled={isPending}
            className="!mt-0"
            options={[
              { value: "", label: "Guest experience (optional)" },
              ...playingExperienceOptions.map(({ value, label }) => ({
                value,
                label,
              })),
            ]}
          />
        ) : null}
        <SubmitButton
          pendingLabel={isRelayInvite ? "Inviting…" : "Adding…"}
          variant="secondary"
          disabled={isPending || (isRelayInvite && !selectedPlayer)}
          className="h-11 min-h-11 w-full sm:w-auto"
        >
          <UserPlus aria-hidden size={17} />
          {isRelayInvite ? "Invite" : "Add"}
        </SubmitButton>
      </div>
      <p id="player-entry-hint" className="mt-2 text-sm leading-5 text-muted">
        {selectedPlayer
          ? `${selectedPlayer.title} (${selectedPlayer.subtitle.split(" · ")[0]}) selected.`
          : "Use @username to find a Relay player. Plain names are added as guests."}
      </p>
      {state.error ? (
        <p role="alert" className="mt-2 text-sm font-medium text-danger">
          {state.error}
        </p>
      ) : state.success ? (
        <p role="status" className="mt-2 text-sm font-medium text-success">
          {state.playerOutcome === "invited"
            ? "Invitation sent."
            : "Guest added."}
        </p>
      ) : null}
    </form>
  );
}

export function PendingPlayerActions({
  sessionId,
  playerId,
}: {
  sessionId: string;
  playerId: string;
}) {
  const [approveState, approveAction] = useActionState<
    SessionActionState,
    FormData
  >(approvePlayerAction, {});
  const [removeState, removeAction] = useActionState<
    SessionActionState,
    FormData
  >(removePlayerAction, {});
  return (
    <div>
      <div className="flex gap-2">
        <form noValidate action={approveAction}>
          <input type="hidden" name="sessionId" value={sessionId} />
          <input type="hidden" name="sessionPlayerId" value={playerId} />
          <SubmitButton pendingLabel="Approving…" className="min-h-9 px-3">
            <Check aria-hidden size={16} />
            Approve
          </SubmitButton>
        </form>
        <form noValidate action={removeAction}>
          <input type="hidden" name="sessionId" value={sessionId} />
          <input type="hidden" name="sessionPlayerId" value={playerId} />
          <SubmitButton
            pendingLabel="Rejecting…"
            variant="quiet"
            className="min-h-9 px-3 text-danger"
          >
            <X aria-hidden size={16} />
            Reject
          </SubmitButton>
        </form>
      </div>
      {approveState.error || removeState.error ? (
        <p role="alert" className="mt-1 text-xs font-medium text-danger">
          {approveState.error ?? removeState.error}
        </p>
      ) : null}
    </div>
  );
}

export function RemovePlayerButton({
  sessionId,
  playerId,
  name,
}: {
  sessionId: string;
  playerId: string;
  name: string;
}) {
  const [state, action] = useActionState<SessionActionState, FormData>(
    removePlayerAction,
    {}
  );
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (state.success) dialogRef.current?.close();
  }, [state]);
  return (
    <>
      <IconTooltip label={`Remove ${name}`}>
        <button
          type="button"
          onClick={() => dialogRef.current?.showModal()}
          aria-label={`Remove ${name}`}
          className="pressable grid h-9 w-9 place-items-center rounded-md text-muted hover:bg-danger/8 hover:text-danger"
        >
          <UserMinus aria-hidden size={17} />
        </button>
      </IconTooltip>
      <Dialog
        ref={dialogRef}
        aria-labelledby={`remove-${playerId}-title`}
        aria-describedby={`remove-${playerId}-description`}
      >
        <form noValidate action={action} className="p-5 sm:p-6">
          <input type="hidden" name="sessionId" value={sessionId} />
          <input type="hidden" name="sessionPlayerId" value={playerId} />
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-danger/10 text-danger">
              <UserMinus aria-hidden size={18} />
            </span>
            <div>
              <h2
                id={`remove-${playerId}-title`}
                className="text-lg font-[680]"
              >
                Remove {name}?
              </h2>
              <p
                id={`remove-${playerId}-description`}
                className="mt-2 text-sm leading-6 text-muted"
              >
                They’ll lose their spot and payment assignment. If there is a
                waitlist, the next player may be promoted.
              </p>
            </div>
          </div>
          {state.error ? (
            <p role="alert" className="mt-4 text-sm font-medium text-danger">
              {state.error}
            </p>
          ) : null}
          <div className="mt-7 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => dialogRef.current?.close()}
            >
              Cancel
            </Button>
            <SubmitButton pendingLabel="Removing…" variant="danger">
              Remove player
            </SubmitButton>
          </div>
        </form>
      </Dialog>
    </>
  );
}

export function RosterLockButton({
  sessionId,
  locked,
}: {
  sessionId: string;
  locked: boolean;
}) {
  return (
    <form noValidate action={toggleRosterLockAction}>
      <input type="hidden" name="sessionId" value={sessionId} />
      <SubmitButton
        pendingLabel={locked ? "Unlocking…" : "Locking…"}
        variant="secondary"
      >
        {locked ? (
          <LockKeyOpen aria-hidden size={17} />
        ) : (
          <LockKey aria-hidden size={17} />
        )}
        {locked ? "Unlock roster" : "Lock roster"}
      </SubmitButton>
    </form>
  );
}
