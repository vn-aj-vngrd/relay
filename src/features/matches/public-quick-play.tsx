"use client";

import {
  ArrowCounterClockwise,
  ArrowDown,
  ArrowLineDown,
  ArrowLineUp,
  ArrowUp,
  FlagCheckered,
  ListPlus,
  LockSimple,
  LockSimpleOpen,
  PencilSimple,
  PlusCircle,
  Prohibit,
  Shuffle,
  Trash,
  UserPlus,
} from "@phosphor-icons/react";
import {
  type FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { ConfirmActionButton } from "@/components/shared/confirm-action-button";
import { EmptyState, LoadingState } from "@/components/shared/content-state";
import { WizardProgress } from "@/components/shared/wizard-progress";
import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SelectField } from "@/components/ui/select-field";
import { Tooltip } from "@/components/ui/tooltip";
import {
  RecapHighlights,
  RecapOverview,
} from "@/features/memories/recap-summary";
import {
  type PlayingExperience,
  playingExperienceLabel,
  playingExperienceOptions,
  playingExperienceWeight,
} from "@/features/players/playing-experience";

import {
  CourtScoreboardCourt,
  type CourtScoreboardNavigation,
} from "./court-scoreboard";
import { MatchResultScores } from "./match-result-scores";
import { playModeOptions } from "./play-mode-options";
import { PlaySectionTabs } from "./play-section-tabs";
import {
  loadQuickPlayDraft,
  parseQuickPlayNames,
  quickPlayDraftKey,
  quickPlayReplayDraft,
} from "./quick-play-draft";
import { QuickPlayAvailability, QuickPlayPlayers } from "./quick-play-players";
import {
  cancelQuickPlayMatch,
  correctQuickPlayMatchScore,
  endQuickPlay,
  finishQuickPlayMatch,
  maxQuickPlayCourts,
  maxQuickPlayPlayers,
  type QuickPlayMatch,
  type QuickPlayPlayer,
  type QuickPlaySession,
  quickPlayNextRotation,
  quickPlayPreviousKey,
  quickPlayRecap,
  quickPlayStorageKey,
  reorderQuickPlayQueue,
  restoreQuickPlaySession,
  scoreQuickPlayMatch,
  serializeQuickPlaySession,
  setQuickPlayCourtAvailability,
  startNextQuickPlayMatches,
  startQuickPlay,
  swapQuickPlayMatchSides,
} from "./quick-play-session";
import {
  readQuickPlayStorage,
  writeQuickPlayStorage,
} from "./quick-play-storage";
import {
  type PlayMode,
  type QueueRule,
  rotationDescription,
  rotationName,
} from "./rotation";
import { RoundTimer } from "./round-timer";
import { SessionStandings } from "./session-standings";
import { UpNext } from "./up-next";

type DraftPlayer = {
  id: string;
  name: string;
  experience: PlayingExperience;
};

const initialPlayers: DraftPlayer[] = Array.from({ length: 4 }, (_, index) => ({
  id: `quick-player-${index + 1}`,
  name: "",
  experience: "casual",
}));

type QuickCourtProps = {
  match: QuickPlayMatch;
  players: Map<string, string>;
  expanded: boolean;
  navigation?: CourtScoreboardNavigation;
  onExpandedChange: (expanded: boolean) => void;
  onScore: (side: 0 | 1, amount: -1 | 1) => void;
  onSwap: () => void;
  onFinish: () => void;
};

function QuickCourt({
  match,
  players,
  expanded,
  navigation,
  onExpandedChange,
  onScore,
  onSwap,
  onFinish,
}: QuickCourtProps) {
  const teams = ([match.teamA, match.teamB] as const).map((team) => {
    const names = team.map((id) => players.get(id) ?? "Player");
    return { label: names.join(" + "), players: names };
  }) as [
    { label: string; players: string[] },
    { label: string; players: string[] },
  ];

  return (
    <CourtScoreboardCourt
      courtLabel={match.courtLabel}
      teams={teams}
      scores={match.scores}
      canScore
      expanded={expanded}
      navigation={navigation}
      onExpandedChange={onExpandedChange}
      onScore={onScore}
      onSwap={onSwap}
      finishControl={
        <div className="flex flex-wrap justify-end gap-2">
          <ConfirmActionButton
            variant="primary"
            disabled={match.scores[0] === match.scores[1]}
            confirmTitle={`Finish ${match.courtLabel} at ${match.scores[0]}–${match.scores[1]}?`}
            confirmIcon={<FlagCheckered size={20} />}
            confirmText={`${teams[0].label} ${match.scores[0]}, ${teams[1].label} ${match.scores[1]}. Confirming advances the rotation.`}
            confirmLabel="Finish match"
            onConfirm={onFinish}
          >
            Finish match
          </ConfirmActionButton>
        </div>
      }
    />
  );
}

function QuickScoreCorrectionControl({
  match,
  players,
  onCorrect,
}: {
  match: QuickPlayMatch;
  players: Map<string, string>;
  onCorrect: (scores: [number, number]) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [error, setError] = useState("");
  const teamNames = ([match.teamA, match.teamB] as const).map((team) =>
    team.map((id) => players.get(id) ?? "Player").join(" + ")
  ) as [string, string];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const scores: [number, number] = [
      Number(formData.get("teamAScore")),
      Number(formData.get("teamBScore")),
    ];
    try {
      onCorrect(scores);
      setError("");
      dialogRef.current?.close();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "The score is not valid."
      );
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="quiet"
        className="shrink-0"
        aria-label={`Correct ${match.courtLabel} score`}
        onClick={() => dialogRef.current?.showModal()}
      >
        <PencilSimple aria-hidden size={15} /> Correct
      </Button>
      <Dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <form noValidate className="p-5 sm:p-6" onSubmit={submit}>
          <h2 id={titleId} className="text-lg font-[680]">
            Correct {match.courtLabel} score
          </h2>
          <p id={descriptionId} className="mt-2 text-sm leading-6 text-muted">
            This updates the result, standings, and recap. Later court
            assignments stay as played.
          </p>
          <div className="mt-6 grid grid-cols-[1fr_5.5rem] items-center gap-x-4 gap-y-4">
            {teamNames.map((name, index) => (
              <div key={name} className="contents">
                <label
                  htmlFor={`${titleId}-${index}`}
                  className="min-w-0 text-sm font-semibold"
                >
                  <span className="line-clamp-2">{name}</span>
                </label>
                <input
                  id={`${titleId}-${index}`}
                  name={index ? "teamBScore" : "teamAScore"}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={99}
                  required
                  defaultValue={match.scores[index]}
                  className="field score text-center text-lg"
                />
              </div>
            ))}
          </div>
          {error ? (
            <p role="alert" className="mt-4 text-sm font-medium text-danger">
              {error}
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
            <Button type="submit">Save correction</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

function PairBuilder({
  players,
  order,
  onChange,
}: {
  players: DraftPlayer[];
  order: string[];
  onChange: (ids: string[]) => void;
}) {
  function choose(index: number, nextId: string) {
    const swapped = [...order];
    const other = swapped.indexOf(nextId);
    if (other >= 0) swapped[other] = swapped[index];
    swapped[index] = nextId;
    onChange(swapped);
  }

  return (
    <section
      aria-labelledby="quick-pairs-title"
      className="mt-6 border-t border-line pt-6"
    >
      <h3 id="quick-pairs-title" className="text-base font-[680]">
        Set the pairs
      </h3>
      <p className="mt-1 text-sm text-muted">
        Choose a player to swap positions. Everyone stays assigned once.
      </p>
      <div className="mt-4 space-y-3">
        {Array.from({ length: order.length / 2 }, (_, pairIndex) => (
          <div
            key={pairIndex}
            className="grid gap-2 rounded-lg bg-surface-strong p-3 sm:grid-cols-[72px_1fr_1fr] sm:items-center"
          >
            <p className="score text-xs font-semibold text-muted">
              Pair {pairIndex + 1}
            </p>
            {([0, 1] as const).map((member) => {
              const index = pairIndex * 2 + member;
              return (
                <SelectField
                  key={member}
                  id={`quick-pair-${pairIndex + 1}-player-${member + 1}`}
                  name={`quick-pair-${pairIndex + 1}-player-${member + 1}`}
                  label={`Pair ${pairIndex + 1}, player ${member + 1}`}
                  hideLabel
                  value={order[index]}
                  onValueChange={(value) => choose(index, value)}
                  options={players.map((player, playerIndex) => ({
                    value: player.id,
                    label: player.name.trim() || `Player ${playerIndex + 1}`,
                  }))}
                  className="!mt-0"
                />
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

function QuickPlaySetup({
  onStart,
  restoreWarning,
}: {
  onStart: (session: QuickPlaySession) => void;
  restoreWarning?: string;
}) {
  const [initialDraft] = useState(loadQuickPlayDraft);
  const setupRef = useRef<HTMLElement>(null);
  const previousStep = useRef(initialDraft.draft?.step ?? 1);
  const [storageWarning, setStorageWarning] = useState(initialDraft.warning);
  const playerInputRefs = useRef(new Map<string, HTMLInputElement>());
  const [step, setStep] = useState<1 | 2 | 3>(initialDraft.draft?.step ?? 1);
  const [players, setPlayers] = useState<DraftPlayer[]>(
    initialDraft.draft?.players ?? initialPlayers
  );
  const [pairOrder, setPairOrder] = useState(
    initialDraft.draft?.pairOrder ?? initialPlayers.map((player) => player.id)
  );
  const [courtCountInput, setCourtCountInput] = useState(
    initialDraft.draft?.courtCountInput ?? "1"
  );
  const [mode, setMode] = useState<PlayMode>(
    initialDraft.draft?.mode ?? "queue"
  );
  const [queueRule, setQueueRule] = useState<QueueRule>(
    initialDraft.draft?.queueRule ?? "adaptive"
  );
  const [roundDuration, setRoundDuration] = useState<string>(
    initialDraft.draft?.roundDuration ?? ""
  );
  const [partnerPolicy, setPartnerPolicy] = useState<"mix" | "fixed">(
    initialDraft.draft?.partnerPolicy ?? "mix"
  );
  const [playerErrors, setPlayerErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const courtCount = Number(courtCountInput);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pastedNames, setPastedNames] = useState("");
  const [pasteError, setPasteError] = useState("");
  const requiredPlayerCount = courtCount * 4;
  const missingPlayerCount = Math.max(0, requiredPlayerCount - players.length);
  const courtCountValid =
    Number.isInteger(courtCount) &&
    courtCount >= 1 &&
    courtCount <= maxQuickPlayCourts;
  const pairsAvailable = players.length >= 4 && players.length % 2 === 0;
  const fixedPartners =
    mode === "round_robin" || (mode === "queue" && partnerPolicy === "fixed");

  useEffect(() => {
    setStorageWarning(
      writeQuickPlayStorage(
        quickPlayDraftKey,
        JSON.stringify({
          step,
          players,
          pairOrder,
          courtCountInput,
          mode,
          queueRule,
          roundDuration,
          partnerPolicy,
        })
      )
    );
  }, [
    step,
    players,
    pairOrder,
    courtCountInput,
    mode,
    queueRule,
    roundDuration,
    partnerPolicy,
  ]);

  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    const heading = setupRef.current?.querySelector<HTMLElement>(
      `#${["quick-players-title", "quick-format-title", "quick-review-title"][step - 1]}`
    );
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView?.({ block: "start" });
  }, [step]);

  function updatePlayer(id: string, update: Partial<DraftPlayer>) {
    setPlayers((current) =>
      current.map((player) =>
        player.id === id ? { ...player, ...update } : player
      )
    );
    setPlayerErrors((current) => {
      if (!current[id]) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
    setError("");
  }

  function addPlayer() {
    if (players.length >= maxQuickPlayPlayers) return;
    const player = {
      id: crypto.randomUUID(),
      name: "",
      experience: "casual" as const,
    };

    setPlayers((current) => [...current, player]);
    setPairOrder((current) => [...current, player.id]);
    setError("");
    requestAnimationFrame(() => {
      playerInputRefs.current.get(player.id)?.focus();
    });
  }

  function addPastedNames() {
    try {
      const namedPlayers = players.filter((player) => player.name.trim());
      const names = parseQuickPlayNames(
        pastedNames,
        namedPlayers.map((player) => player.name)
      );
      const nextPlayers = [
        ...namedPlayers,
        ...names.map((name) => ({
          id: crypto.randomUUID(),
          name,
          experience: "casual" as const,
        })),
      ];
      while (nextPlayers.length < 4)
        nextPlayers.push({
          id: crypto.randomUUID(),
          name: "",
          experience: "casual",
        });
      const ids = new Set(nextPlayers.map((player) => player.id));
      setPairOrder([
        ...pairOrder.filter((id) => ids.has(id)),
        ...nextPlayers
          .filter((player) => !pairOrder.includes(player.id))
          .map((player) => player.id),
      ]);
      setPlayers(nextPlayers);
      setPlayerErrors({});
      setError("");
      setPasteError("");
      setPastedNames("");
      setPasteOpen(false);
      requestAnimationFrame(() => {
        playerInputRefs.current.get(nextPlayers[0].id)?.focus();
      });
    } catch (reason) {
      setPasteError(
        reason instanceof Error
          ? reason.message
          : "Check the names and try again."
      );
    }
  }

  function removePlayer(id: string) {
    if (players.length <= 4) return;
    const nextPlayers = players.filter((player) => player.id !== id);
    setPlayers(nextPlayers);
    setPairOrder((current) => current.filter((playerId) => playerId !== id));
    setPlayerErrors((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setError("");
  }

  function continueToOptions() {
    const counts = new Map<string, number>();
    for (const player of players) {
      const name = player.name.trim().toLocaleLowerCase();
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    const nextErrors = Object.fromEntries(
      players.flatMap((player) => {
        const name = player.name.trim().toLocaleLowerCase();
        if (!name) return [[player.id, "Enter a player name."]];
        if ((counts.get(name) ?? 0) > 1)
          return [[player.id, "Use a unique player name."]];
        return [];
      })
    );
    setPlayerErrors(nextErrors);
    const firstInvalidPlayer = players.find((player) => nextErrors[player.id]);
    if (firstInvalidPlayer) {
      setError("Enter a unique name for every player.");
      playerInputRefs.current.get(firstInvalidPlayer.id)?.focus();
      return;
    }
    setError("");
    setStep(2);
  }

  function continueToReview() {
    if (!courtCountValid) {
      setError(`Choose 1–${maxQuickPlayCourts} courts.`);
      return;
    }
    if (missingPlayerCount > 0) {
      setError(
        `Add ${missingPlayerCount} more ${missingPlayerCount === 1 ? "player" : "players"} before reviewing.`
      );
      return;
    }
    if (fixedPartners && !pairsAvailable) {
      setError("Fixed partners need an even roster of at least four players.");
      return;
    }
    setError("");
    setStep(3);
  }

  function start() {
    try {
      const fixedPairs = fixedPartners
        ? Array.from(
            { length: pairOrder.length / 2 },
            (_, index) =>
              [pairOrder[index * 2], pairOrder[index * 2 + 1]] as [
                string,
                string,
              ]
          )
        : [];
      const configuredPlayers: QuickPlayPlayer[] = players.map((player) => ({
        id: player.id,
        name: player.name,
        experience: playingExperienceWeight(player.experience),
      }));
      onStart(
        startQuickPlay({
          players: configuredPlayers,
          courtCount,
          mode,
          queueRule,
          fixedPairs,
          roundDurationMinutes:
            mode === "queue" || !roundDuration ? null : Number(roundDuration),
        })
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Check the setup and try again."
      );
    }
  }

  return (
    <section
      ref={setupRef}
      aria-labelledby="quick-play-setup"
      className="mx-auto w-full max-w-6xl"
    >
      <header className="sr-only lg:not-sr-only lg:mb-10 lg:border-b lg:border-line lg:pb-7">
        <h1 id="quick-play-setup" className="app-title">
          Quick Play
        </h1>
        <p className="mt-2 hidden text-sm text-muted lg:block">
          Add players, choose a game format, and start the first rotation.
        </p>
      </header>

      <div className="mx-auto w-full max-w-2xl lg:pb-8">
        <WizardProgress
          className="mb-6 sm:mb-8"
          ariaLabel="Quick Play setup progress"
          labels={["Players", "Game options", "Review"]}
          step={step}
        />
        {storageWarning ? (
          <Alert variant="info" className="mb-6">
            {storageWarning}
          </Alert>
        ) : null}
        {initialDraft.restoreWarning ? (
          <Alert variant="info" className="mb-6">
            {initialDraft.restoreWarning}
          </Alert>
        ) : null}
        {restoreWarning ? (
          <Alert variant="info" className="mb-6">
            {restoreWarning}
          </Alert>
        ) : null}
        <section aria-labelledby="quick-players-title" hidden={step !== 1}>
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
            <div className="min-w-0 flex-1">
              <h2
                id="quick-players-title"
                tabIndex={-1}
                className="text-lg font-bold"
              >
                Who’s playing
              </h2>
              <p className="mt-1 text-sm leading-5 text-muted">
                Add 4–24 players. Each active court needs four.
              </p>
            </div>
            <Button
              type="button"
              variant="quiet"
              aria-expanded={pasteOpen}
              aria-controls="quick-paste-names"
              className="-ml-3 sm:ml-0"
              onClick={() => setPasteOpen(!pasteOpen)}
            >
              <ListPlus aria-hidden size={17} /> Paste names
            </Button>
          </div>
          {pasteOpen ? (
            <div
              id="quick-paste-names"
              className="mt-4 border-t border-line pt-4"
            >
              <label
                htmlFor="quick-names-list"
                className="text-sm font-semibold"
              >
                Names, one per line
              </label>
              <p id="quick-names-help" className="mt-1 text-xs text-muted">
                Adds to the names you already entered. You can edit everyone
                below.
              </p>
              <textarea
                id="quick-names-list"
                className="field mt-2 min-h-32"
                rows={5}
                value={pastedNames}
                maxLength={2400}
                onChange={(event) => {
                  setPastedNames(event.target.value);
                  setPasteError("");
                }}
                aria-invalid={Boolean(pasteError)}
                aria-describedby={
                  pasteError
                    ? "quick-names-help quick-names-error"
                    : "quick-names-help"
                }
              />
              {pasteError ? (
                <p
                  id="quick-names-error"
                  role="alert"
                  className="mt-2 text-sm text-danger"
                >
                  {pasteError}
                </p>
              ) : null}
              <div className="mt-3 flex justify-end gap-2">
                <Button variant="quiet" onClick={() => setPasteOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addPastedNames}>Add names</Button>
              </div>
            </div>
          ) : null}
          <div className="mt-3 grid gap-4 border-t border-line pt-4 sm:gap-0 sm:pt-0">
            {players.map((player, index) => (
              <div
                key={player.id}
                className="grid min-w-0 grid-cols-[minmax(0,1fr)_44px] items-start gap-2 sm:py-3"
              >
                <div className="min-w-0">
                  <label
                    htmlFor={`quick-player-name-${index + 1}`}
                    className="block text-sm font-[650]"
                  >
                    Player {index + 1}
                  </label>
                  <input
                    id={`quick-player-name-${index + 1}`}
                    ref={(node) => {
                      if (node) playerInputRefs.current.set(player.id, node);
                      else playerInputRefs.current.delete(player.id);
                    }}
                    value={player.name}
                    onChange={(event) =>
                      updatePlayer(player.id, { name: event.target.value })
                    }
                    maxLength={50}
                    autoComplete="off"
                    enterKeyHint={index < players.length - 1 ? "next" : "done"}
                    onKeyDown={(event) => {
                      if (
                        event.key !== "Enter" ||
                        event.nativeEvent.isComposing
                      )
                        return;
                      event.preventDefault();
                      const nextPlayer = players[index + 1];
                      if (nextPlayer)
                        playerInputRefs.current.get(nextPlayer.id)?.focus();
                      else continueToOptions();
                    }}
                    placeholder="Enter name"
                    aria-invalid={Boolean(playerErrors[player.id])}
                    aria-describedby={
                      playerErrors[player.id]
                        ? `quick-player-name-${index + 1}-error`
                        : undefined
                    }
                    className={`field mt-1.5 ${playerErrors[player.id] ? "border-danger focus:border-danger focus:ring-danger/15" : ""}`}
                  />
                  {playerErrors[player.id] ? (
                    <p
                      id={`quick-player-name-${index + 1}-error`}
                      className="mt-1.5 text-sm font-medium text-danger"
                    >
                      {playerErrors[player.id]}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => removePlayer(player.id)}
                  disabled={players.length <= 4}
                  aria-label={`Remove player ${index + 1}`}
                  className="pressable mt-6.5 grid h-11 w-11 place-items-center rounded-lg text-muted hover:bg-surface-strong hover:text-danger disabled:opacity-30"
                >
                  <Trash aria-hidden size={17} />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 sm:mt-0">
            <Button
              type="button"
              variant="quiet"
              onClick={addPlayer}
              className="-ml-3 sm:ml-0"
              disabled={players.length >= maxQuickPlayPlayers}
            >
              <UserPlus aria-hidden size={17} /> Add player
            </Button>
          </div>
        </section>

        <section aria-labelledby="quick-format-title" hidden={step !== 2}>
          <div className="space-y-5">
            <div>
              <h2
                id="quick-format-title"
                tabIndex={-1}
                className="text-lg font-bold"
              >
                Choose how this game runs
              </h2>
              <p className="mt-1 text-sm leading-5 text-muted">
                Court assignments, queue, and scores stay together on this page.
              </p>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] items-center gap-4">
              <div className="min-w-0">
                <label
                  htmlFor="quick-court-count"
                  className="text-sm font-[650]"
                >
                  Active courts
                </label>
                <p
                  id="quick-court-count-help"
                  className={`mt-1 text-xs leading-5 ${!courtCountValid || missingPlayerCount > 0 ? "text-warning" : "text-muted"}`}
                >
                  {!courtCountValid
                    ? `Choose 1–${maxQuickPlayCourts} courts.`
                    : missingPlayerCount > 0
                      ? `Add ${missingPlayerCount} more ${missingPlayerCount === 1 ? "player" : "players"}.`
                      : `${requiredPlayerCount} players fill ${courtCount} ${courtCount === 1 ? "court" : "courts"}.`}
                </p>
              </div>
              <input
                id="quick-court-count"
                type="number"
                value={courtCountInput}
                min={1}
                max={maxQuickPlayCourts}
                step={1}
                inputMode="numeric"
                onChange={(event) => setCourtCountInput(event.target.value)}
                aria-describedby="quick-court-count-help"
                aria-invalid={!courtCountValid || missingPlayerCount > 0}
                className="field mt-0 h-11 text-center"
              />
            </div>
          </div>

          <fieldset className="mt-6">
            <legend className="sr-only">Play mode</legend>
            <div className="divide-y divide-line border-y border-line">
              {playModeOptions.map(
                ({ mode: value, title, description, icon: Icon }) => {
                  const disabled =
                    (value === "king_of_court" &&
                      players.length !== courtCount * 4) ||
                    (value === "round_robin" && !pairsAvailable);
                  const selected = mode === value;
                  return (
                    <label
                      key={value}
                      className={`flex min-h-20 gap-3 py-4 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary has-[:focus-visible]:outline-offset-4 ${disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer"}`}
                    >
                      <input
                        type="radio"
                        name="quick-play-mode"
                        value={value}
                        checked={selected}
                        disabled={disabled}
                        onChange={() => {
                          setMode(value);
                          setError("");
                        }}
                        className="sr-only"
                      />
                      <span
                        aria-hidden
                        className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg ${selected ? "bg-primary text-white" : "bg-surface-strong text-muted"}`}
                      >
                        <Icon
                          size={18}
                          weight={selected ? "bold" : "regular"}
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-3">
                          <strong className="font-[680]">
                            {title}
                            {value === "queue" ? (
                              <span className="mt-1 block text-xs font-medium text-muted">
                                Recommended for casual open play
                              </span>
                            ) : null}
                          </strong>
                          <span
                            aria-hidden
                            className={`h-4 w-4 rounded-full border-4 ${selected ? "border-primary bg-surface" : "border-line bg-surface"}`}
                          />
                        </span>
                        <span className="mt-1 block text-sm leading-5 text-muted">
                          {value === "queue"
                            ? "Rotate this roster through the courts, with mixed or fixed partners."
                            : description}
                        </span>
                        {value === "king_of_court" && disabled ? (
                          <span className="mt-1.5 block text-xs font-medium text-warning">
                            Needs exactly {courtCount * 4} players for{" "}
                            {courtCount} {courtCount === 1 ? "court" : "courts"}
                            .
                          </span>
                        ) : value === "round_robin" && disabled ? (
                          <span className="mt-1.5 block text-xs font-medium text-warning">
                            Needs an even roster of at least four players.
                          </span>
                        ) : null}
                      </span>
                    </label>
                  );
                }
              )}
            </div>
          </fieldset>

          {mode === "balanced" ? (
            <fieldset className="mt-6 border-t border-line pt-5">
              <legend className="text-sm font-semibold">
                Playing experience
              </legend>
              <p className="mt-1 text-sm text-muted">
                Choose each player’s experience to balance the teams.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {players.map((player) => (
                  <SelectField
                    key={player.id}
                    id={`quick-experience-${player.id}`}
                    name={`experience-${player.id}`}
                    label={`${player.name} — experience`}
                    value={player.experience}
                    onValueChange={(value) =>
                      updatePlayer(player.id, {
                        experience: value as PlayingExperience,
                      })
                    }
                    options={playingExperienceOptions}
                  />
                ))}
              </div>
            </fieldset>
          ) : null}

          {mode === "queue" ? (
            <div className="mt-5 space-y-5">
              <fieldset>
                <legend className="text-sm font-[650]">Partner style</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {[
                    {
                      value: "mix" as const,
                      title: "Mix partners",
                      detail: "Relay balances variety.",
                    },
                    {
                      value: "fixed" as const,
                      title: "Keep pairs together",
                      detail: "Teams rotate as one unit.",
                    },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex min-h-14 items-center gap-3 rounded-lg border px-3 ${option.value === "fixed" && !pairsAvailable ? "cursor-not-allowed opacity-55" : "cursor-pointer"} ${partnerPolicy === option.value ? "border-primary bg-primary-soft" : "border-line bg-surface"}`}
                    >
                      <input
                        type="radio"
                        name="quick-partner-policy"
                        value={option.value}
                        checked={partnerPolicy === option.value}
                        disabled={option.value === "fixed" && !pairsAvailable}
                        onChange={() => setPartnerPolicy(option.value)}
                        className="h-4 w-4 accent-[var(--primary)]"
                      />
                      <span>
                        <strong className="block text-sm">
                          {option.title}
                        </strong>
                        <span className="block text-xs text-muted">
                          {option.detail}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div>
                <SelectField
                  id="quick-queue-rule"
                  name="quick-queue-rule"
                  label="Queue rule"
                  value={queueRule}
                  onValueChange={(value) => setQueueRule(value as QueueRule)}
                  options={[
                    {
                      value: "adaptive",
                      label: "Adaptive — Relay responds to the queue",
                    },
                    {
                      value: "four_off",
                      label: fixedPartners
                        ? "Both pairs rotate — two fresh teams"
                        : "Four rotate — a fresh group every match",
                    },
                    {
                      value: "winner_stays",
                      label: fixedPartners
                        ? "Winning pair stays — up to two games"
                        : "Winners stay — split and take the next two",
                    },
                  ]}
                />
                <p className="mt-1.5 text-xs leading-5 text-muted">
                  {queueRule !== "adaptive"
                    ? rotationDescription(mode, { queueRule, partnerPolicy })
                    : fixedPartners
                      ? "Adaptive keeps the winning pair for a short queue and rotates both pairs when another two teams are waiting."
                      : "Adaptive uses winners-stay for a short queue and rotates all four when four or more players are waiting."}
                </p>
              </div>
            </div>
          ) : null}

          {mode === "queue" ? (
            <p className="mt-3 text-sm leading-6 text-muted">
              {queueRule === "winner_stays"
                ? fixedPartners
                  ? "Example: the winning pair stays together; the next pair replaces the losing pair. A pair plays at most two games in a row."
                  : "Example: the two winners stay, split up, and each team with one of the next two waiting players."
                : queueRule === "four_off"
                  ? "Example: with eight players on one court, all four finish and the four waiting players take the next match."
                  : "Example: with eight players on one court, all four rotate off. With six players, the winners stay and the two waiting players join."}
            </p>
          ) : null}

          {mode !== "queue" ? (
            <div className="mt-5">
              <SelectField
                id="quick-round-duration"
                name="roundDuration"
                label="Round timer"
                value={roundDuration}
                onValueChange={setRoundDuration}
                options={[
                  { value: "", label: "No timer — finish by score" },
                  { value: "10", label: "10 minutes" },
                  { value: "12", label: "12 minutes" },
                  { value: "15", label: "15 minutes" },
                  { value: "20", label: "20 minutes" },
                ]}
              />
              <p className="mt-1.5 text-xs leading-5 text-muted">
                Optional. Every court sees the same countdown; time running out
                never finishes a score automatically.
              </p>
            </div>
          ) : null}

          {fixedPartners && pairsAvailable ? (
            <PairBuilder
              players={players}
              order={pairOrder}
              onChange={setPairOrder}
            />
          ) : null}
        </section>

        <section hidden={step !== 3} aria-labelledby="quick-review-title">
          <h2
            id="quick-review-title"
            tabIndex={-1}
            className="text-lg font-bold"
          >
            Review Quick Play
          </h2>
          <p className="mt-1 text-sm leading-5 text-muted">
            Check the temporary setup before creating the first assignments.
          </p>
          <dl className="mt-5 divide-y divide-line border-y border-line">
            <div className="flex items-start justify-between gap-4 py-4">
              <dt className="text-sm text-muted">Players</dt>
              <dd className="max-w-[70%] break-words text-right text-sm font-semibold">
                {players.map((player) => player.name).join(", ")}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4 py-4">
              <dt className="text-sm text-muted">Courts</dt>
              <dd className="text-right text-sm font-semibold">{courtCount}</dd>
            </div>
            <div className="flex items-start justify-between gap-4 py-4">
              <dt className="text-sm text-muted">Flow</dt>
              <dd className="text-right text-sm font-semibold">
                {rotationName(mode)}
              </dd>
            </div>
            {mode === "queue" ? (
              <div className="grid gap-2 py-4 sm:grid-cols-[100px_1fr]">
                <dt className="text-sm text-muted">Rotation</dt>
                <dd className="text-sm font-medium sm:text-right">
                  {rotationDescription(mode, { queueRule, partnerPolicy })}
                </dd>
              </div>
            ) : (
              <div className="flex justify-between gap-4 py-4">
                <dt className="text-sm text-muted">Timer</dt>
                <dd className="text-sm font-semibold">
                  {roundDuration ? `${roundDuration} minutes` : "No timer"}
                </dd>
              </div>
            )}
            {fixedPartners ? (
              <div className="grid gap-2 py-4">
                <dt className="text-sm text-muted">Fixed pairs</dt>
                <dd className="grid gap-2 break-words text-sm font-semibold">
                  {Array.from({ length: pairOrder.length / 2 }, (_, index) => (
                    <p key={pairOrder[index * 2]}>
                      {pairOrder
                        .slice(index * 2, index * 2 + 2)
                        .map(
                          (id) =>
                            players.find((player) => player.id === id)?.name
                        )
                        .join(" + ")}
                    </p>
                  ))}
                </dd>
              </div>
            ) : null}
            {mode === "balanced" ? (
              <div className="grid gap-2 py-4">
                <dt className="text-sm text-muted">Playing experience</dt>
                <dd className="grid gap-2 text-sm">
                  {players.map((player) => (
                    <p key={player.id} className="flex justify-between gap-3">
                      <span className="min-w-0 break-words">{player.name}</span>
                      <span className="shrink-0 font-semibold">
                        {playingExperienceLabel(player.experience)}
                      </span>
                    </p>
                  ))}
                </dd>
              </div>
            ) : null}
            <div className="flex items-start justify-between gap-4 py-4">
              <dt className="text-sm text-muted">Storage</dt>
              <dd className="text-right text-sm font-semibold">
                This device only
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Edit players
            </Button>
            <Button variant="secondary" onClick={() => setStep(2)}>
              Edit game options
            </Button>
          </div>
          <Alert variant="info" className="mt-5">
            Quick Play is temporary and cannot be shared or moved into account
            history. Plan a Relay game when the crew needs a saved link.
          </Alert>
        </section>

        {error ? <Alert className="mt-6">{error}</Alert> : null}
        <div
          data-quick-play-sticky-actions={step === 1 ? "true" : undefined}
          className={`mt-4 gap-3 sm:mt-6 sm:flex sm:flex-row sm:items-center ${step === 1 ? "sticky bottom-0 z-10 flex flex-nowrap items-center justify-end border-t border-line bg-surface py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:static" : "flex flex-col-reverse border-t border-line pt-5 sm:justify-between"}`}
        >
          {step === 1 ? (
            <p className="mr-auto hidden text-xs text-muted sm:block">
              Quick Play stays on this device.
            </p>
          ) : null}
          <div>
            {step > 1 ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setError("");
                  setStep(step === 3 ? 2 : 1);
                }}
                className="w-full sm:w-auto"
              >
                Back
              </Button>
            ) : (
              <ButtonLink href="/games/new" variant="quiet">
                <PlusCircle aria-hidden size={16} /> Create game
              </ButtonLink>
            )}
          </div>
          {step === 1 ? (
            <Button
              type="button"
              onClick={continueToOptions}
              aria-label="Choose game options"
              className="shrink-0"
            >
              <span className="sm:hidden">Game options</span>
              <span className="hidden sm:inline">Choose game options</span>
            </Button>
          ) : step === 2 ? (
            <Button
              type="button"
              onClick={continueToReview}
              className="w-full sm:w-auto"
            >
              Review setup
            </Button>
          ) : (
            <Button type="button" onClick={start} className="w-full sm:w-auto">
              Start Play
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

function QuickPlayLive({
  session,
  onChange,
  onEdit,
  archived = false,
}: {
  session: QuickPlaySession;
  onChange: (session: QuickPlaySession) => void;
  onEdit: (reusePlayers?: boolean) => void;
  archived?: boolean;
}) {
  const ended = session.endedAt != null;
  const liveHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    liveHeading.current?.focus({ preventScroll: true });
    liveHeading.current?.scrollIntoView?.({ block: "start" });
  }, []);
  const [error, setError] = useState("");
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const names = new Map(
    session.players.map((player) => [player.id, player.name])
  );
  const recap = quickPlayRecap(session);
  const standings = recap.standings;
  const nextRotation = quickPlayNextRotation(session);
  const canStartNext = nextRotation.plans.length > 0;
  const waiting = session.waitingPlayerIds.map((id) => ({
    id,
    name: names.get(id) ?? "Player",
  }));
  const roundMode = session.mode !== "queue";
  const roundRobinComplete =
    session.mode === "round_robin" &&
    !session.activeMatches.length &&
    session.completedMatches.length >=
      (session.fixedPairs.length * (session.fixedPairs.length - 1)) / 2;
  const roundStartedAt = session.activeMatches.length
    ? Math.min(...session.activeMatches.map((match) => match.startedAt))
    : null;

  function finish(matchId: string) {
    try {
      onChange(finishQuickPlayMatch(session, matchId));
      setError("");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Enter a winner before finishing."
      );
    }
  }

  function correct(matchId: string, scores: [number, number]) {
    onChange(correctQuickPlayMatchScore(session, matchId, scores));
  }

  const sessionAction = (
    <div className="mt-5">
      <ConfirmActionButton
        variant="secondary"
        className={ended ? "w-full sm:w-auto" : "w-full"}
        confirmTitle={
          ended ? "Start a new Quick Play session?" : "End this session?"
        }
        confirmIcon={
          ended ? (
            <ArrowCounterClockwise size={20} />
          ) : (
            <FlagCheckered size={20} />
          )
        }
        confirmTone={ended ? "warning" : "primary"}
        confirmText={
          ended
            ? "Start with a blank roster. This recap becomes Previous recap, replacing any older recap stored on this device. There is no account backup."
            : "Your results and standings will stay in this browser as a recap. No more matches can be started."
        }
        confirmLabel={ended ? "Start new session" : "End session"}
        cancelLabel={ended ? "Keep recap" : "Keep playing"}
        onConfirm={() => {
          if (ended) onEdit();
          else {
            onChange(endQuickPlay(session));
          }
        }}
        aria-describedby={
          session.activeMatches.length ? "quick-end-help" : undefined
        }
        disabled={session.activeMatches.length > 0}
      >
        {ended ? <ArrowCounterClockwise aria-hidden size={16} /> : null}
        {ended ? "Start new session" : "End session"}
      </ConfirmActionButton>
      {!ended ? (
        <p id="quick-end-help" className="mt-2 text-center text-xs text-muted">
          {session.activeMatches.length
            ? "Finish or cancel active matches before ending."
            : "Ends play and keeps the recap on this device."}
        </p>
      ) : null}
    </div>
  );
  const prioritizeNext =
    nextRotation.plans.length > 0 ||
    nextRotation.preparing.length > 0 ||
    Boolean(nextRotation.upcomingTeams);
  const nextMatchContent = !roundRobinComplete ? (
    <UpNext
      preview={nextRotation}
      names={names}
      action={
        canStartNext ? (
          <Button
            type="button"
            onClick={() => onChange(startNextQuickPlayMatches(session))}
          >
            <Shuffle aria-hidden size={17} />
            {roundMode
              ? "Start next round"
              : nextRotation.plans.length > 1
                ? `Start ${nextRotation.plans.length} courts`
                : "Start next match"}
          </Button>
        ) : undefined
      }
    />
  ) : null;
  const results = (
    <div>
      {session.completedMatches.length ? (
        <section aria-labelledby="quick-completed-title" className="min-w-0">
          <h2 id="quick-completed-title" className="text-xl font-bold">
            Completed matches
          </h2>
          <p className="mt-1 hidden text-sm text-muted lg:block">
            Final scores from this Quick Play session
          </p>
          <ol className="mt-4 divide-y divide-line border-y border-line">
            {session.completedMatches.toReversed().map((match) => {
              const teamNames = ([match.teamA, match.teamB] as const).map(
                (team) =>
                  team.map((id) => names.get(id) ?? "Player").join(" + ")
              ) as [string, string];
              return (
                <li
                  key={match.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-4"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted">
                      {match.courtLabel}
                    </p>
                    <MatchResultScores
                      teams={teamNames}
                      scores={match.scores}
                    />
                  </div>
                  {!archived ? (
                    <QuickScoreCorrectionControl
                      match={match}
                      players={names}
                      onCorrect={(scores) => correct(match.id, scores)}
                    />
                  ) : null}
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}
      {!session.completedMatches.length ? (
        <EmptyState
          icon="results"
          title={ended ? "No completed matches" : "No completed matches yet"}
          description={
            ended
              ? "No matches were completed in this session."
              : "Finished scores will appear here after the first match."
          }
        />
      ) : null}
    </div>
  );
  const standingsContent = <SessionStandings standings={standings} />;

  return (
    <section
      aria-labelledby="quick-play-live"
      className="mx-auto w-full max-w-6xl"
    >
      <h1
        ref={liveHeading}
        tabIndex={-1}
        id="quick-play-live"
        className="sr-only"
      >
        {ended ? "Quick Play recap" : "Play"}
      </h1>
      {error ? (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      ) : null}
      {ended ? (
        <div className="space-y-8 sm:space-y-10">
          <RecapOverview
            recap={recap}
            statusLabel="Final recap"
            title="Quick Play"
            context={`${rotationName(session.mode)} · ${session.players.length} players · ${session.courtCount} ${session.courtCount === 1 ? "court" : "courts"}`}
            description={
              recap.matchCount
                ? "The final scores, pairings, and court time from your game."
                : "No matches were completed in this session."
            }
          />
          {results}
          <RecapHighlights recap={recap} />
          {standingsContent}
          {!archived ? (
            <section aria-label="Next Quick Play session">
              <h2 className="text-lg font-bold">Play again</h2>
              <p className="mt-2 text-sm text-muted">
                Keep your crew and settings, or start with a new group. Your
                most recent recap stays on this device as Previous recap.
              </p>
              <ConfirmActionButton
                className="mt-4 w-full sm:w-auto"
                confirmTitle="Play again with these players?"
                confirmText="Review the same crew and game options before starting. This recap becomes Previous recap, replacing any older recap on this device."
                confirmLabel="Review players"
                cancelLabel="Keep recap"
                onConfirm={() => onEdit(true)}
              >
                Play again with these players
              </ConfirmActionButton>
              {sessionAction}
              <p className="mt-3 text-xs text-muted">
                Quick Play is stored on this device, not in your account.
              </p>
            </section>
          ) : null}
        </div>
      ) : (
        <PlaySectionTabs
          headerActions={
            <QuickPlayPlayers session={session} onChange={onChange} />
          }
          courts={
            <section aria-labelledby="quick-active-courts">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 id="quick-active-courts" className="text-lg font-bold">
                    Active courts
                  </h2>
                  <p className="mt-1 hidden text-sm text-muted lg:block">
                    {session.activeMatches.length
                      ? `${session.activeMatches.length} ${session.activeMatches.length === 1 ? "match" : "matches"} in progress`
                      : roundRobinComplete
                        ? "Every pair has played every other pair"
                        : "Ready for the next rotation"}
                  </p>
                </div>
              </div>
              {prioritizeNext ? nextMatchContent : null}
              {session.roundDurationMinutes && roundStartedAt ? (
                <div className="mt-4">
                  <RoundTimer
                    startedAt={new Date(roundStartedAt).toISOString()}
                    durationMinutes={session.roundDurationMinutes}
                  />
                </div>
              ) : null}
              {session.activeMatches.length ? (
                <div
                  className={`mt-4 grid gap-5 ${session.activeMatches.length > 1 ? "lg:grid-cols-2" : ""}`}
                >
                  {session.activeMatches.map((match, index) => {
                    const previous =
                      session.activeMatches[
                        (index - 1 + session.activeMatches.length) %
                          session.activeMatches.length
                      ];
                    const next =
                      session.activeMatches[
                        (index + 1) % session.activeMatches.length
                      ];
                    return (
                      <QuickCourt
                        key={match.id}
                        match={match}
                        players={names}
                        expanded={selectedMatchId === match.id}
                        onExpandedChange={(expanded) =>
                          setSelectedMatchId(expanded ? match.id : null)
                        }
                        navigation={
                          session.activeMatches.length > 1
                            ? {
                                position: index + 1,
                                total: session.activeMatches.length,
                                previousLabel: previous.courtLabel,
                                nextLabel: next.courtLabel,
                                onPrevious: () =>
                                  setSelectedMatchId(previous.id),
                                onNext: () => setSelectedMatchId(next.id),
                              }
                            : undefined
                        }
                        onScore={(side, amount) =>
                          onChange(
                            scoreQuickPlayMatch(session, match.id, side, amount)
                          )
                        }
                        onSwap={() =>
                          onChange(swapQuickPlayMatchSides(session, match.id))
                        }
                        onFinish={() => finish(match.id)}
                      />
                    );
                  })}
                </div>
              ) : roundRobinComplete ? (
                <div className="mt-4 border-y border-line py-6">
                  <h3 className="font-bold">Round robin complete</h3>
                  <p className="mt-2 text-sm text-muted">
                    Every pair has played each other once. Review the standings,
                    then end the session in Manage.
                  </p>
                </div>
              ) : null}
              {!prioritizeNext ? nextMatchContent : null}
            </section>
          }
          queue={
            <div className="w-full space-y-6">
              <section aria-labelledby="quick-waiting-title">
                <h2 id="quick-waiting-title" className="text-lg font-bold">
                  {roundMode ? "Waiting & resting" : "Paddle stack"}
                </h2>
                <p className="mt-1 hidden text-sm text-muted lg:block">
                  {waiting.length} {waiting.length === 1 ? "player" : "players"}{" "}
                  ready
                </p>
                {waiting.length ? (
                  <ol className="mt-3 divide-y divide-line border-y border-line">
                    {waiting.map((player, index) => (
                      <li
                        key={player.id}
                        className="flex min-h-14 items-center gap-3 py-2"
                      >
                        <span className="score w-5 text-center text-sm font-bold text-muted">
                          {index + 1}
                        </span>
                        <span className="min-w-0 flex-1 break-words text-sm font-semibold">
                          {player.name}
                        </span>
                        <span className="flex shrink-0 items-center gap-1">
                          {[
                            ["top", "Move to top", ArrowLineUp],
                            ["up", "Move up", ArrowUp],
                            ["down", "Move down", ArrowDown],
                            ["end", "Move to end", ArrowLineDown],
                          ].map(([move, label, Icon]) => (
                            <Button
                              key={move as string}
                              type="button"
                              variant="quiet"
                              className={`h-11 min-h-11 w-11 px-0 lg:h-9 lg:min-h-9 lg:w-9 ${move === "top" || move === "end" ? "max-lg:!hidden" : ""}`}
                              disabled={
                                ((move === "top" || move === "up") &&
                                  index === 0) ||
                                ((move === "down" || move === "end") &&
                                  index === waiting.length - 1)
                              }
                              aria-label={`${label as string}: ${player.name}`}
                              onClick={() =>
                                onChange(
                                  reorderQuickPlayQueue(
                                    session,
                                    player.id,
                                    move as "top" | "up" | "down" | "end"
                                  )
                                )
                              }
                            >
                              <Icon aria-hidden size={16} />
                              <Tooltip content={label as string} />
                            </Button>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <EmptyState
                    icon="players"
                    title="No players are waiting"
                    description="Use Players to check who’s on court or taking a break."
                    className="mt-3 border-y border-line"
                  />
                )}
              </section>

              <section aria-label="Active rotation rules">
                <p className="text-sm font-semibold">Rotation rules</p>
                <p className="mt-1 text-sm leading-5 text-muted">
                  {rotationDescription(session.mode, {
                    queueRule: session.queueRule,
                    partnerPolicy: session.fixedPairs.length ? "fixed" : "mix",
                  })}
                </p>
              </section>
            </div>
          }
          results={session.completedMatches.length ? results : undefined}
          standings={standings.length ? standingsContent : undefined}
          manage={
            <div className="w-full space-y-8 sm:space-y-9">
              <section aria-labelledby="quick-availability-title">
                <h2 id="quick-availability-title" className="text-lg font-bold">
                  Player availability
                </h2>
                <QuickPlayAvailability session={session} onChange={onChange} />
              </section>
              <section aria-labelledby="quick-court-availability-title">
                <h2
                  id="quick-court-availability-title"
                  className="text-lg font-bold"
                >
                  Court availability
                </h2>
                <p className="mt-1 text-sm leading-5 text-muted">
                  Closing an occupied court lets its current match finish and
                  blocks the next assignment.
                </p>
                <div className="mt-3 divide-y divide-line border-y border-line">
                  {Array.from({ length: session.courtCount }, (_, index) => {
                    const courtId = `court-${index + 1}`;
                    const label = `Court ${index + 1}`;
                    const available =
                      !session.unavailableCourtIds.includes(courtId);
                    const active = session.activeMatches.some(
                      (match) => match.courtId === courtId
                    );
                    return (
                      <div
                        key={courtId}
                        className="flex min-h-14 items-center gap-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{label}</p>
                          <p className="text-xs text-muted">
                            {available
                              ? "Available for new matches"
                              : active
                                ? "Closing after this match"
                                : "Unavailable for new matches"}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={session.mode === "king_of_court"}
                          aria-label={`${available ? "Close" : "Reopen"} ${label}`}
                          onClick={() => {
                            try {
                              onChange(
                                setQuickPlayCourtAvailability(
                                  session,
                                  courtId,
                                  !available
                                )
                              );
                              setError("");
                            } catch (reason) {
                              setError(
                                reason instanceof Error
                                  ? reason.message
                                  : "That court couldn’t be updated."
                              );
                            }
                          }}
                        >
                          {available ? (
                            <LockSimple aria-hidden size={16} />
                          ) : (
                            <LockSimpleOpen aria-hidden size={16} />
                          )}
                          {available
                            ? active
                              ? "Close after match"
                              : "Close"
                            : "Reopen"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
                {session.mode === "king_of_court" ? (
                  <p className="mt-2 text-xs text-muted">
                    Court Climb keeps a fixed ladder. Use a new setup to change
                    courts.
                  </p>
                ) : null}
              </section>
              {session.activeMatches.length ? (
                <section aria-labelledby="quick-match-controls-title">
                  <h2
                    id="quick-match-controls-title"
                    className="text-lg font-bold"
                  >
                    Match controls
                  </h2>
                  <div className="mt-3 divide-y divide-line border-y border-line">
                    {session.activeMatches.map((match) => (
                      <div
                        key={match.id}
                        className="flex min-h-14 flex-wrap items-center justify-between gap-2 py-2"
                      >
                        <span className="mr-auto text-sm font-semibold">
                          {match.courtLabel}
                        </span>
                        <ConfirmActionButton
                          variant="quiet"
                          className="text-danger"
                          aria-label={
                            roundMode
                              ? "Cancel active round"
                              : `Cancel ${match.courtLabel}`
                          }
                          confirmIcon={<Prohibit size={20} />}
                          confirmTone="warning"
                          confirmTitle={
                            roundMode
                              ? "Cancel the active round?"
                              : `Cancel ${match.courtLabel}?`
                          }
                          confirmText={
                            roundMode
                              ? "No scores will be recorded. Everyone in the active round returns to the waiting list."
                              : "No score will be recorded. The players return to the front of the waiting list."
                          }
                          confirmLabel={
                            roundMode ? "Cancel round" : "Cancel match"
                          }
                          onConfirm={() =>
                            onChange(cancelQuickPlayMatch(session, match.id))
                          }
                        >
                          {roundMode ? "Cancel rotation" : "Cancel match"}
                        </ConfirmActionButton>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
              <section aria-label="End session">{sessionAction}</section>
            </div>
          }
        />
      )}
    </section>
  );
}

const subscribeToBrowser = () => () => undefined;

function loadStoredQuickPlay() {
  const { value: stored, warning } = readQuickPlayStorage(quickPlayStorageKey);
  const previous = readQuickPlayStorage(quickPlayPreviousKey);
  const previousSession = restoreQuickPlaySession(previous.value);
  const session = restoreQuickPlaySession(stored);
  return {
    session,
    previousSession: previousSession?.endedAt != null ? previousSession : null,
    warning: warning || previous.warning,
    restoreWarning:
      stored && !session
        ? "The saved Quick Play session could not be restored, so Relay started a fresh setup."
        : "",
  };
}

function PersistentQuickPlay() {
  const [headerActionTarget, setHeaderActionTarget] =
    useState<HTMLElement | null>(null);
  useEffect(() => {
    setHeaderActionTarget(document.getElementById("quick-play-header-action"));
  }, []);
  const [initial] = useState(loadStoredQuickPlay);
  const [session, setSession] = useState<QuickPlaySession | null>(
    initial.session
  );
  const [restoreWarning, setRestoreWarning] = useState(initial.restoreWarning);
  const [storageWarning, setStorageWarning] = useState(initial.warning);
  const [previousSession, setPreviousSession] = useState(
    initial.previousSession
  );
  const [viewingPrevious, setViewingPrevious] = useState(false);

  useEffect(() => {
    if (session) {
      setStorageWarning(
        writeQuickPlayStorage(
          quickPlayStorageKey,
          serializeQuickPlaySession(session)
        )
      );
    }
  }, [session]);

  function showSession(nextSession: QuickPlaySession | null) {
    setRestoreWarning("");
    setSession(nextSession);
    const warning = writeQuickPlayStorage(quickPlayDraftKey, null);
    const sessionWarning = writeQuickPlayStorage(
      quickPlayStorageKey,
      nextSession ? serializeQuickPlaySession(nextSession) : null
    );
    setStorageWarning(warning || sessionWarning);
  }

  function prepareNextSession(reusePlayers = false) {
    if (!session || session.endedAt == null) return;
    // Preserve the recap before removing the current session. Failed storage
    // must leave the current recap available rather than silently discarding it.
    const archiveWarning = writeQuickPlayStorage(
      quickPlayPreviousKey,
      serializeQuickPlaySession(session)
    );
    if (archiveWarning) {
      setStorageWarning(archiveWarning);
      return;
    }
    setPreviousSession(session);
    const draftWarning = writeQuickPlayStorage(
      quickPlayDraftKey,
      reusePlayers ? JSON.stringify(quickPlayReplayDraft(session)) : null
    );
    if (draftWarning) {
      setStorageWarning(draftWarning);
      return;
    }
    const clearWarning = writeQuickPlayStorage(quickPlayStorageKey, null);
    if (clearWarning) {
      setStorageWarning(clearWarning);
      return;
    }
    setRestoreWarning("");
    setStorageWarning("");
    setSession(null);
  }

  return (
    <>
      {storageWarning ? (
        <Alert variant="info" className="mb-4">
          {storageWarning}
        </Alert>
      ) : null}
      {previousSession && headerActionTarget
        ? createPortal(
            <Button
              variant="quiet"
              onClick={() => setViewingPrevious(!viewingPrevious)}
            >
              {viewingPrevious
                ? session
                  ? "Current game"
                  : "Back to setup"
                : "Previous recap"}
            </Button>,
            headerActionTarget
          )
        : null}
      {previousSession ? (
        <div
          className={`mx-auto w-full max-w-6xl flex-wrap items-center justify-between gap-2 border-b border-line mb-5 pb-3 ${headerActionTarget ? "hidden lg:flex" : "flex"}`}
        >
          <p
            className={`text-xs text-muted ${viewingPrevious ? "" : "hidden sm:block"}`}
          >
            {viewingPrevious
              ? "Previous recap · read-only · this device only"
              : "Your last recap is kept on this device."}
          </p>
          <Button
            variant="quiet"
            onClick={() => setViewingPrevious(!viewingPrevious)}
            aria-label={viewingPrevious ? undefined : "Previous recap"}
          >
            {viewingPrevious
              ? session
                ? "Back to current game"
                : "Back to setup"
              : "Previous recap"}
          </Button>
        </div>
      ) : null}
      {viewingPrevious && previousSession ? (
        <QuickPlayLive
          key="previous"
          session={previousSession}
          onChange={() => undefined}
          onEdit={() => undefined}
          archived
        />
      ) : session ? (
        <QuickPlayLive
          key={session.endedAt == null ? "live" : "recap"}
          session={session}
          onChange={setSession}
          onEdit={prepareNextSession}
        />
      ) : (
        <QuickPlaySetup onStart={showSession} restoreWarning={restoreWarning} />
      )}
    </>
  );
}

export function PublicQuickPlay() {
  const browserReady = useSyncExternalStore(
    subscribeToBrowser,
    () => true,
    () => false
  );
  if (browserReady) return <PersistentQuickPlay />;
  return (
    <section
      aria-labelledby="quick-play-restoring"
      className="mx-auto w-full max-w-6xl"
    >
      <header className="sr-only lg:not-sr-only lg:mb-10 lg:border-b lg:border-line lg:pb-7">
        <h1 id="quick-play-restoring" className="app-title">
          Quick Play
        </h1>
      </header>
      <LoadingState
        label="Opening Quick Play on this device…"
        description="Checking for your saved players, game, or recap."
        className="mx-auto w-full max-w-2xl"
      />
    </section>
  );
}
