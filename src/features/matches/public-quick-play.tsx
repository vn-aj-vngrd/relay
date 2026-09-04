"use client";

import {
  ArrowCounterClockwise,
  ArrowsLeftRight,
  PencilSimple,
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

import { ConfirmActionButton } from "@/components/shared/confirm-action-button";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SelectField } from "@/components/ui/select-field";
import {
  type PlayingExperience,
  playingExperienceOptions,
  playingExperienceWeight,
} from "@/features/players/playing-experience";

import {
  CourtScoreboardCourt,
  type CourtScoreboardNavigation,
} from "./court-scoreboard";
import { playModeOptions } from "./play-mode-options";
import {
  cancelQuickPlayMatch,
  canStartNextQuickPlayMatches,
  correctQuickPlayMatchScore,
  finishQuickPlayMatch,
  maxQuickPlayCourts,
  maxQuickPlayPlayers,
  type QuickPlayMatch,
  type QuickPlayPlayer,
  type QuickPlaySession,
  quickPlayStandings,
  quickPlayStorageKey,
  restoreQuickPlaySession,
  scoreQuickPlayMatch,
  serializeQuickPlaySession,
  startNextQuickPlayMatches,
  startQuickPlay,
  swapQuickPlayMatchSides,
} from "./quick-play-session";
import {
  type PlayMode,
  type QueueRule,
  rotationDescription,
  rotationName,
} from "./rotation";
import { RoundTimer } from "./round-timer";

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
  onCancel: () => void;
  onFinish: () => void;
  cancelWholeRound: boolean;
};

function QuickCourt({
  match,
  players,
  expanded,
  navigation,
  onExpandedChange,
  onScore,
  onSwap,
  onCancel,
  onFinish,
  cancelWholeRound,
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
      headerAction={
        <button
          type="button"
          onClick={onSwap}
          aria-label={`Swap sides on ${match.courtLabel}`}
          className="pressable grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-surface-strong hover:text-ink"
        >
          <ArrowsLeftRight aria-hidden size={18} />
        </button>
      }
      finishControl={
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <ConfirmActionButton
            variant="quiet"
            aria-label={
              cancelWholeRound
                ? "Cancel active round"
                : `Cancel ${match.courtLabel}`
            }
            confirmTitle={
              cancelWholeRound
                ? "Cancel the active round?"
                : `Cancel ${match.courtLabel}?`
            }
            confirmText={
              cancelWholeRound
                ? "No scores will be recorded. Everyone in the active round returns to the waiting list."
                : "No score will be recorded. The players return to the front of the waiting list."
            }
            confirmLabel={cancelWholeRound ? "Cancel round" : "Cancel match"}
            onConfirm={onCancel}
          >
            <Prohibit aria-hidden size={16} />
            {cancelWholeRound ? "Cancel round" : "Cancel"}
          </ConfirmActionButton>
          <ConfirmActionButton
            variant="secondary"
            className="w-full"
            disabled={match.scores[0] === match.scores[1]}
            confirmTitle={`Finish ${match.courtLabel} at ${match.scores[0]}–${match.scores[1]}?`}
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
            This updates the result and standings. Later court assignments stay
            as played.
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
  const nextPlayerNumber = useRef(5);
  const [players, setPlayers] = useState(initialPlayers);
  const [pairOrder, setPairOrder] = useState(
    initialPlayers.map((player) => player.id)
  );
  const [courtCountInput, setCourtCountInput] = useState("1");
  const [mode, setMode] = useState<PlayMode>("queue");
  const [queueRule, setQueueRule] = useState<QueueRule>("adaptive");
  const [roundDuration, setRoundDuration] = useState("");
  const [partnerPolicy, setPartnerPolicy] = useState<"mix" | "fixed">("mix");
  const [error, setError] = useState("");
  const courtCount = Number(courtCountInput);
  const requiredPlayerCount = courtCount * 4;
  const missingPlayerCount = Math.max(0, requiredPlayerCount - players.length);
  const courtCountValid =
    Number.isInteger(courtCount) &&
    courtCount >= 1 &&
    courtCount <= maxQuickPlayCourts;
  const pairsAvailable = players.length >= 4 && players.length % 2 === 0;
  const fixedPartners =
    mode === "round_robin" || (mode === "queue" && partnerPolicy === "fixed");

  function updatePlayer(id: string, update: Partial<DraftPlayer>) {
    setPlayers((current) =>
      current.map((player) =>
        player.id === id ? { ...player, ...update } : player
      )
    );
    setError("");
  }

  function addPlayer() {
    if (players.length >= maxQuickPlayPlayers) return;
    const player = {
      id: `quick-player-${nextPlayerNumber.current}`,
      name: "",
      experience: "casual" as const,
    };
    nextPlayerNumber.current += 1;
    setPlayers((current) => [...current, player]);
    setPairOrder((current) => [...current, player.id]);
    setError("");
  }

  function removePlayer(id: string) {
    if (players.length <= 4) return;
    const nextPlayers = players.filter((player) => player.id !== id);
    setPlayers(nextPlayers);
    setPairOrder((current) => current.filter((playerId) => playerId !== id));
    setError("");
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
      aria-labelledby="quick-play-setup"
      className="mx-auto w-full max-w-[1180px]"
    >
      <header>
        <h1 id="quick-play-setup" className="app-title">
          Set up Play
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Add players, choose the court flow, and begin the first rotation.
          Everything stays on this device.
        </p>
      </header>

      <div className="mx-auto w-full max-w-2xl pb-8 pt-6">
        {restoreWarning ? (
          <Alert variant="info" className="mb-6">
            {restoreWarning}
          </Alert>
        ) : null}
        <section aria-labelledby="quick-players-title">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 id="quick-players-title" className="text-lg font-bold">
                Who’s playing
              </h2>
              <p className="mt-1 text-sm leading-5 text-muted">
                Add 4–24 players. Each active court needs four.
              </p>
            </div>
            <Button
              type="button"
              variant="quiet"
              onClick={addPlayer}
              disabled={players.length >= maxQuickPlayPlayers}
            >
              <UserPlus aria-hidden size={17} /> Add player
            </Button>
          </div>
          <div className="mt-3 grid divide-y divide-line border-y border-line sm:grid-cols-2 sm:gap-x-6 sm:divide-y-0">
            {players.map((player, index) => (
              <div
                key={player.id}
                className="grid min-w-0 grid-cols-[minmax(0,1fr)_44px] items-end gap-2 py-3"
              >
                <div className="min-w-0 space-y-3">
                  <label className="block text-sm font-[650]">
                    Player {index + 1}
                    <input
                      value={player.name}
                      onChange={(event) =>
                        updatePlayer(player.id, { name: event.target.value })
                      }
                      maxLength={50}
                      autoComplete="off"
                      placeholder="Enter name"
                      className="field"
                    />
                  </label>
                  {mode === "balanced" ? (
                    <SelectField
                      id={`quick-player-${index + 1}-experience`}
                      name={`quick-player-${index + 1}-experience`}
                      label="Playing experience"
                      value={player.experience}
                      onValueChange={(value) =>
                        updatePlayer(player.id, {
                          experience: value as PlayingExperience,
                        })
                      }
                      options={playingExperienceOptions}
                    />
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => removePlayer(player.id)}
                  disabled={players.length <= 4}
                  aria-label={`Remove player ${index + 1}`}
                  className="pressable grid h-11 w-11 place-items-center rounded-lg text-muted hover:bg-surface-strong hover:text-danger disabled:opacity-30"
                >
                  <Trash aria-hidden size={17} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="quick-format-title" className="mt-10">
          <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 flex-1">
              <h2 id="quick-format-title" className="text-lg font-bold">
                Choose how this game runs
              </h2>
              <p className="mt-1 text-sm leading-5 text-muted">
                Court assignments, queue, and scores stay together on this page.
              </p>
            </div>
            <div className="w-full sm:w-48">
              <label htmlFor="quick-court-count" className="text-sm font-[650]">
                Active courts
              </label>
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
                className="field h-11"
              />
              <p
                id="quick-court-count-help"
                className={`mt-1.5 text-xs leading-5 ${!courtCountValid || missingPlayerCount > 0 ? "text-warning" : "text-muted"}`}
              >
                {!courtCountValid
                  ? `Choose 1–${maxQuickPlayCourts} courts.`
                  : missingPlayerCount > 0
                    ? `Add ${missingPlayerCount} more ${missingPlayerCount === 1 ? "player" : "players"}.`
                    : `${requiredPlayerCount} players fill ${courtCount} ${courtCount === 1 ? "court" : "courts"}.`}
              </p>
            </div>
          </div>

          <fieldset className="mt-8">
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
                      className={`flex min-h-20 gap-3 py-4 ${disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer"}`}
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
                          <strong className="font-[680]">{title}</strong>
                          <span
                            aria-hidden
                            className={`h-4 w-4 rounded-full border-4 ${selected ? "border-primary bg-surface" : "border-line bg-surface"}`}
                          />
                        </span>
                        <span className="mt-1 block text-sm leading-5 text-muted">
                          {description}
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
                  {fixedPartners
                    ? "Adaptive keeps the winning pair for a short queue and rotates both pairs when another two teams are waiting."
                    : "Adaptive uses winners-stay for a short queue and rotates all four when four or more players are waiting."}
                </p>
              </div>
            </div>
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

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            {players.length} players · {courtCount}{" "}
            {courtCount === 1 ? "court" : "courts"} · local only
          </p>
          <Button type="button" onClick={start} className="w-full sm:w-auto">
            Start Play
          </Button>
        </div>
        {error ? (
          <p role="alert" className="mt-3 text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function QuickPlayLive({
  session,
  onChange,
  onEdit,
}: {
  session: QuickPlaySession;
  onChange: (session: QuickPlaySession) => void;
  onEdit: () => void;
}) {
  const [error, setError] = useState("");
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const names = new Map(
    session.players.map((player) => [player.id, player.name])
  );
  const standings = quickPlayStandings(session);
  const canStartNext = canStartNextQuickPlayMatches(session);
  const waiting = session.waitingPlayerIds.map((id) => ({
    id,
    name: names.get(id) ?? "Player",
  }));
  const roundMode = session.mode !== "queue";
  const roundRobinComplete =
    session.mode === "round_robin" &&
    !session.activeMatches.length &&
    !canStartNext &&
    session.completedMatches.length > 0;
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

  return (
    <section
      aria-labelledby="quick-play-live"
      className="mx-auto w-full max-w-[1180px]"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 id="quick-play-live" className="app-title">
              Play
            </h1>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-live">
              <span className="h-1.5 w-1.5 rounded-full bg-live" /> Live
            </span>
          </div>
          <p className="mt-2 text-sm text-muted">
            {rotationName(session.mode)} · scores and rotations stay on this
            page
          </p>
        </div>
        <ConfirmActionButton
          variant="secondary"
          confirmTitle="End this Quick Play session?"
          confirmText="Active scores and completed results will be removed from this browser."
          confirmLabel="End and start over"
          onConfirm={onEdit}
        >
          <ArrowCounterClockwise aria-hidden size={16} /> New setup
        </ConfirmActionButton>
      </div>

      <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_330px]">
        <section aria-labelledby="quick-active-courts">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="quick-active-courts" className="text-lg font-bold">
                Active courts
              </h2>
              <p className="mt-1 text-sm text-muted">
                {session.activeMatches.length
                  ? `${session.activeMatches.length} ${session.activeMatches.length === 1 ? "match" : "matches"} in progress`
                  : roundRobinComplete
                    ? "Every pair has played every other pair"
                    : "Ready for the next rotation"}
              </p>
            </div>
            {canStartNext ? (
              <Button
                type="button"
                onClick={() => onChange(startNextQuickPlayMatches(session))}
              >
                <Shuffle aria-hidden size={17} />{" "}
                {roundMode ? "Start next round" : "Start next match"}
              </Button>
            ) : null}
          </div>
          {session.roundDurationMinutes && roundStartedAt ? (
            <div className="mt-4">
              <RoundTimer
                startedAt={new Date(roundStartedAt).toISOString()}
                durationMinutes={session.roundDurationMinutes}
              />
            </div>
          ) : null}
          {session.activeMatches.length ? (
            <div className="mt-4 grid gap-5">
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
                            onPrevious: () => setSelectedMatchId(previous.id),
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
                    onCancel={() =>
                      onChange(cancelQuickPlayMatch(session, match.id))
                    }
                    onFinish={() => finish(match.id)}
                    cancelWholeRound={roundMode}
                  />
                );
              })}
            </div>
          ) : (
            <div className="mt-4 border-y border-line py-10">
              <h3 className="font-bold">
                {roundRobinComplete
                  ? "Round robin complete"
                  : "Courts are ready"}
              </h3>
              <p className="mt-2 text-sm text-muted">
                {roundRobinComplete
                  ? "Review the final standings or start a new setup."
                  : canStartNext
                    ? "Start the next rotation when everyone is ready."
                    : "Add more players in a new setup to continue."}
              </p>
            </div>
          )}
          {error ? (
            <p role="alert" className="mt-4 text-sm font-medium text-danger">
              {error}
            </p>
          ) : null}
          {session.completedMatches.length ? (
            <section aria-labelledby="quick-completed-title" className="mt-9">
              <h2 id="quick-completed-title" className="text-xl font-bold">
                Completed matches
              </h2>
              <p className="mt-1 text-sm text-muted">
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
                        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 text-sm">
                          <span className="min-w-0 break-words font-medium">
                            {teamNames[0]}
                          </span>
                          <strong className="score text-base">
                            {match.scores[0]}
                          </strong>
                          <span className="min-w-0 break-words font-medium">
                            {teamNames[1]}
                          </span>
                          <strong className="score text-base">
                            {match.scores[1]}
                          </strong>
                        </div>
                      </div>
                      <QuickScoreCorrectionControl
                        match={match}
                        players={names}
                        onCorrect={(scores) => correct(match.id, scores)}
                      />
                    </li>
                  );
                })}
              </ol>
            </section>
          ) : null}
        </section>

        <aside className="space-y-8">
          <section aria-labelledby="quick-waiting-title">
            <h2 id="quick-waiting-title" className="text-lg font-bold">
              {roundMode ? "Waiting & resting" : "Paddle stack"}
            </h2>
            <p className="mt-1 text-sm text-muted">
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
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {player.name}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 border-y border-line py-6 text-sm text-muted">
                Everyone is currently playing.
              </p>
            )}
          </section>

          <section
            className="rounded-lg bg-primary-soft p-4"
            aria-label="Active rotation rules"
          >
            <p className="text-sm font-semibold">
              {rotationName(session.mode)}
            </p>
            <p className="mt-1 text-sm leading-5 text-muted">
              {rotationDescription(session.mode, {
                queueRule: session.queueRule,
                partnerPolicy: session.fixedPairs.length ? "fixed" : "mix",
              })}
            </p>
          </section>

          {standings.length ? (
            <section aria-labelledby="quick-standings-title">
              <h2 id="quick-standings-title" className="text-lg font-bold">
                Standings
              </h2>
              <div className="mt-3 overflow-hidden border-y border-line">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-muted">
                    <tr>
                      <th className="py-2 font-medium">Player</th>
                      <th className="py-2 text-right font-medium">W</th>
                      <th className="py-2 text-right font-medium">L</th>
                      <th className="py-2 text-right font-medium">+/−</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {standings.map((row) => (
                      <tr key={row.playerId}>
                        <td className="py-3 font-medium">{row.name}</td>
                        <td className="score py-3 text-right">{row.wins}</td>
                        <td className="score py-3 text-right">{row.losses}</td>
                        <td className="score py-3 text-right">
                          {row.differential > 0 ? "+" : ""}
                          {row.differential}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
          <p className="text-xs leading-5 text-muted">
            {session.completedMatches.length} completed{" "}
            {session.completedMatches.length === 1 ? "match" : "matches"}. Quick
            Play is saved in this browser until you start a new setup.
          </p>
        </aside>
      </div>
    </section>
  );
}

const subscribeToBrowser = () => () => undefined;

function loadStoredQuickPlay() {
  const stored = localStorage.getItem(quickPlayStorageKey);
  const session = restoreQuickPlaySession(stored);
  return {
    session,
    restoreWarning:
      stored && !session
        ? "The saved Quick Play session could not be restored, so Relay started a fresh setup."
        : "",
  };
}

function PersistentQuickPlay() {
  const [initial] = useState(loadStoredQuickPlay);
  const [session, setSession] = useState<QuickPlaySession | null>(
    initial.session
  );
  const [restoreWarning, setRestoreWarning] = useState(initial.restoreWarning);

  useEffect(() => {
    if (session)
      localStorage.setItem(
        quickPlayStorageKey,
        serializeQuickPlaySession(session)
      );
    else localStorage.removeItem(quickPlayStorageKey);
  }, [session]);

  function showSession(nextSession: QuickPlaySession | null) {
    setRestoreWarning("");
    setSession(nextSession);
    if (!nextSession) localStorage.removeItem(quickPlayStorageKey);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

  return session ? (
    <QuickPlayLive
      session={session}
      onChange={setSession}
      onEdit={() => showSession(null)}
    />
  ) : (
    <QuickPlaySetup onStart={showSession} restoreWarning={restoreWarning} />
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
      aria-label="Restoring Quick Play"
      role="status"
      className="mx-auto w-full max-w-[1180px]"
    >
      <div className="h-9 w-44 animate-pulse rounded-md bg-surface-strong motion-reduce:animate-none" />
      <div className="mx-auto mt-10 h-80 w-full max-w-2xl animate-pulse rounded-xl bg-surface-strong motion-reduce:animate-none" />
      <span className="sr-only">Restoring Quick Play…</span>
    </section>
  );
}
