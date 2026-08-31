"use client";

import { ArrowCounterClockwise, ArrowsLeftRight, Minus, Plus, Shuffle, Trash, UserPlus } from "@phosphor-icons/react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  type PlayingExperience,
  playingExperienceOptions,
  playingExperienceWeight,
} from "@/features/players/playing-experience";

import { playModeOptions } from "./play-mode-options";
import {
  canStartNextQuickPlayMatches,
  finishQuickPlayMatch,
  type QuickPlayMatch,
  type QuickPlayPlayer,
  type QuickPlaySession,
  quickPlayStandings,
  scoreQuickPlayMatch,
  startNextQuickPlayMatches,
  startQuickPlay,
  swapQuickPlayMatchSides,
} from "./quick-play-session";
import { type PlayMode, type QueueRule, rotationDescription, rotationName } from "./rotation";

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

function TeamName({ playerIds, players }: { playerIds: string[]; players: Map<string, string> }) {
  return (
    <p className="flex min-h-12 flex-col items-center justify-center text-center text-sm font-semibold leading-5 text-white/82 sm:text-base">
      {playerIds.map((id, index) => (
        <span key={id} className="block max-w-full truncate" title={players.get(id)}>
          {index ? (
            <span aria-hidden className="mr-1 text-[var(--scoreboard-line)]">
              +
            </span>
          ) : null}
          {players.get(id)}
        </span>
      ))}
    </p>
  );
}

function QuickCourt({
  match,
  players,
  onScore,
  onSwap,
  onFinish,
}: {
  match: QuickPlayMatch;
  players: Map<string, string>;
  onScore: (side: 0 | 1, amount: -1 | 1) => void;
  onSwap: () => void;
  onFinish: () => void;
}) {
  const teamNames = ([match.teamA, match.teamB] as const).map((team) => team.map((id) => players.get(id)).join(" + "));
  return (
    <article className="overflow-hidden rounded-xl border border-line bg-surface">
      <header className="flex min-h-14 items-center justify-between gap-3 border-b border-line px-4">
        <div>
          <p className="sport-label text-primary">{match.courtLabel}</p>
          <p className="mt-0.5 text-xs text-muted">Match in progress</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-live">
            <span className="h-1.5 w-1.5 rounded-full bg-live" /> Live
          </span>
          <button
            type="button"
            onClick={onSwap}
            aria-label={`Swap sides on ${match.courtLabel}`}
            className="pressable grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-surface-strong hover:text-ink"
          >
            <ArrowsLeftRight aria-hidden size={18} />
          </button>
        </div>
      </header>
      <div className="grid grid-cols-2 bg-[var(--scoreboard-field)] text-white">
        {([0, 1] as const).map((side) => {
          const team = side === 0 ? match.teamA : match.teamB;
          return (
            <section
              key={side}
              aria-label={teamNames[side]}
              className={`flex min-w-0 flex-col ${side === 1 ? "court-rule border-l" : ""}`}
            >
              <div className="px-3 pb-5 pt-6 text-center sm:px-5">
                <TeamName playerIds={team} players={players} />
                <output
                  aria-live="polite"
                  aria-label={`${teamNames[side]} score ${match.scores[side]}`}
                  className="score mt-3 block text-[5rem] font-bold leading-none tracking-[-0.055em] sm:text-[6.5rem]"
                >
                  {match.scores[side]}
                </output>
              </div>
              <div className="court-rule grid grid-cols-2 border-t">
                <button
                  type="button"
                  onClick={() => onScore(side, -1)}
                  disabled={match.scores[side] === 0}
                  aria-label={`Subtract a point from ${teamNames[side]}`}
                  className="pressable grid min-h-16 place-items-center court-rule border-r text-white/65 hover:bg-white/10 hover:text-white disabled:opacity-35"
                >
                  <Minus aria-hidden size={21} />
                </button>
                <button
                  type="button"
                  onClick={() => onScore(side, 1)}
                  aria-label={`Add a point to ${teamNames[side]}`}
                  className="pressable grid min-h-16 place-items-center text-white hover:bg-white/10"
                >
                  <Plus aria-hidden size={22} />
                </button>
              </div>
            </section>
          );
        })}
      </div>
      <footer className="border-t border-line p-3">
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          disabled={match.scores[0] === match.scores[1]}
          onClick={onFinish}
        >
          Finish match
        </Button>
      </footer>
    </article>
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
    <section aria-labelledby="quick-pairs-title" className="mt-6 border-t border-line pt-6">
      <h3 id="quick-pairs-title" className="text-base font-[680]">
        Set the pairs
      </h3>
      <p className="mt-1 text-sm text-muted">Choose a player to swap positions. Everyone stays assigned once.</p>
      <div className="mt-4 space-y-3">
        {Array.from({ length: order.length / 2 }, (_, pairIndex) => (
          <div
            key={pairIndex}
            className="grid gap-2 rounded-lg bg-surface-strong p-3 sm:grid-cols-[72px_1fr_1fr] sm:items-center"
          >
            <p className="score text-xs font-semibold text-muted">Pair {pairIndex + 1}</p>
            {([0, 1] as const).map((member) => {
              const index = pairIndex * 2 + member;
              return (
                <label key={member} className="text-xs font-medium text-muted">
                  <span className="sr-only">
                    Pair {pairIndex + 1}, player {member + 1}
                  </span>
                  <select
                    value={order[index]}
                    onChange={(event) => choose(index, event.target.value)}
                    aria-label={`Pair ${pairIndex + 1}, player ${member + 1}`}
                    className="field mt-0 h-11 text-sm text-ink"
                  >
                    {players.map((player, playerIndex) => (
                      <option key={player.id} value={player.id}>
                        {player.name.trim() || `Player ${playerIndex + 1}`}
                      </option>
                    ))}
                  </select>
                </label>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

function QuickPlaySetup({ onStart }: { onStart: (session: QuickPlaySession) => void }) {
  const nextPlayerNumber = useRef(5);
  const [players, setPlayers] = useState(initialPlayers);
  const [pairOrder, setPairOrder] = useState(initialPlayers.map((player) => player.id));
  const [courtCount, setCourtCount] = useState(1);
  const [mode, setMode] = useState<PlayMode>("queue");
  const [queueRule, setQueueRule] = useState<QueueRule>("adaptive");
  const [partnerPolicy, setPartnerPolicy] = useState<"mix" | "fixed">("mix");
  const [error, setError] = useState("");
  const maxCourts = Math.max(1, Math.min(4, Math.floor(players.length / 4)));
  const pairsAvailable = players.length >= 4 && players.length % 2 === 0;
  const fixedPartners = mode === "round_robin" || (mode === "queue" && partnerPolicy === "fixed");

  function updatePlayer(id: string, update: Partial<DraftPlayer>) {
    setPlayers((current) => current.map((player) => (player.id === id ? { ...player, ...update } : player)));
    setError("");
  }

  function addPlayer() {
    if (players.length >= 24) return;
    const player = { id: `quick-player-${nextPlayerNumber.current}`, name: "", experience: "casual" as const };
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
    setCourtCount((current) => Math.min(current, Math.max(1, Math.floor(nextPlayers.length / 4))));
    setError("");
  }

  function start() {
    try {
      const fixedPairs = fixedPartners
        ? Array.from(
            { length: pairOrder.length / 2 },
            (_, index) => [pairOrder[index * 2], pairOrder[index * 2 + 1]] as [string, string],
          )
        : [];
      const configuredPlayers: QuickPlayPlayer[] = players.map((player) => ({
        id: player.id,
        name: player.name,
        experience: playingExperienceWeight(player.experience),
      }));
      onStart(startQuickPlay({ players: configuredPlayers, courtCount, mode, queueRule, fixedPairs }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Check the setup and try again.");
    }
  }

  return (
    <section aria-labelledby="quick-play-setup" className="mx-auto w-full max-w-3xl">
      <div>
        <p className="sport-label text-primary">No account needed</p>
        <h1 id="quick-play-setup" className="app-title mt-2">
          Set up Play
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted">
          Add everyone by name, choose the court flow, then run rotations and scores from this phone. Nothing is
          uploaded.
        </p>
      </div>

      <section aria-labelledby="quick-players-title" className="mt-9">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="quick-players-title" className="text-lg font-bold">
              Who’s playing
            </h2>
            <p className="mt-1 text-sm text-muted">At least four players. Add four players for each active court.</p>
          </div>
          <Button type="button" variant="secondary" onClick={addPlayer} disabled={players.length >= 24}>
            <UserPlus aria-hidden size={17} /> Add player
          </Button>
        </div>
        <div className="mt-4 divide-y divide-line border-y border-line">
          {players.map((player, index) => (
            <div key={player.id} className="grid gap-3 py-3 sm:grid-cols-[1fr_190px_44px] sm:items-end">
              <label className="text-sm font-[650]">
                Player {index + 1}
                <input
                  value={player.name}
                  onChange={(event) => updatePlayer(player.id, { name: event.target.value })}
                  maxLength={50}
                  autoComplete="off"
                  placeholder={`Enter player ${index + 1} name`}
                  className="field"
                />
              </label>
              {mode === "balanced" ? (
                <label className="text-sm font-[650]">
                  Playing experience
                  <select
                    value={player.experience}
                    onChange={(event) =>
                      updatePlayer(player.id, { experience: event.target.value as PlayingExperience })
                    }
                    className="field h-11"
                  >
                    {playingExperienceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <span className="hidden sm:block" />
              )}
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
        <div className="grid gap-5 sm:grid-cols-[1fr_180px] sm:items-end">
          <div>
            <h2 id="quick-format-title" className="text-lg font-bold">
              Choose how this game runs
            </h2>
            <p className="mt-1 text-sm text-muted">The same Play modes available in a planned Relay game.</p>
          </div>
          <label className="text-sm font-[650]">
            Active courts
            <select
              value={courtCount}
              onChange={(event) => setCourtCount(Number(event.target.value))}
              className="field h-11"
            >
              {Array.from({ length: maxCourts }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  {index + 1} {index ? "courts" : "court"}
                </option>
              ))}
            </select>
          </label>
        </div>

        <fieldset className="mt-5">
          <legend className="sr-only">Play mode</legend>
          <div className="divide-y divide-line border-y border-line">
            {playModeOptions.map(({ mode: value, title, description, icon: Icon }) => {
              const disabled =
                (value === "king_of_court" && players.length !== courtCount * 4) ||
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
                    <Icon size={18} weight={selected ? "bold" : "regular"} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-3">
                      <strong className="font-[680]">{title}</strong>
                      <span
                        aria-hidden
                        className={`h-4 w-4 rounded-full border-4 ${selected ? "border-primary bg-surface" : "border-line bg-surface"}`}
                      />
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-muted">{description}</span>
                    {value === "king_of_court" && disabled ? (
                      <span className="mt-1.5 block text-xs font-medium text-warning">
                        Needs exactly {courtCount * 4} players for {courtCount} {courtCount === 1 ? "court" : "courts"}.
                      </span>
                    ) : value === "round_robin" && disabled ? (
                      <span className="mt-1.5 block text-xs font-medium text-warning">
                        Needs an even roster of at least four players.
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {mode === "queue" ? (
          <div className="mt-6 space-y-5">
            <fieldset>
              <legend className="text-sm font-[650]">Partner style</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {[
                  { value: "mix" as const, title: "Mix partners", detail: "Relay balances variety." },
                  { value: "fixed" as const, title: "Keep pairs together", detail: "Teams rotate as one unit." },
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
                      <strong className="block text-sm">{option.title}</strong>
                      <span className="block text-xs text-muted">{option.detail}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block text-sm font-[650]">
              Queue rule
              <select
                value={queueRule}
                onChange={(event) => setQueueRule(event.target.value as QueueRule)}
                className="field h-11 max-w-xl"
              >
                <option value="adaptive">Adaptive — respond to the queue</option>
                <option value="four_off">Four rotate — a fresh group every match</option>
                <option value="winner_stays">Winners stay — then rotate off</option>
              </select>
            </label>
          </div>
        ) : null}

        {fixedPartners && pairsAvailable ? (
          <PairBuilder players={players} order={pairOrder} onChange={setPairOrder} />
        ) : null}
      </section>

      {error ? (
        <p role="alert" className="mt-5 text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
      <div className="mt-7 flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          {players.length} players · {courtCount} {courtCount === 1 ? "court" : "courts"} · saved only on this page
        </p>
        <Button type="button" size="large" onClick={start} className="w-full sm:w-auto">
          Start Play
        </Button>
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
  const names = new Map(session.players.map((player) => [player.id, player.name]));
  const standings = quickPlayStandings(session);
  const canStartNext = canStartNextQuickPlayMatches(session);
  const waiting = session.waitingPlayerIds.map((id) => ({ id, name: names.get(id) ?? "Player" }));
  const roundMode = session.mode !== "queue";
  const roundRobinComplete =
    session.mode === "round_robin" &&
    !session.activeMatches.length &&
    !canStartNext &&
    session.completedMatches.length > 0;

  function finish(matchId: string) {
    try {
      onChange(finishQuickPlayMatch(session, matchId));
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Enter a winner before finishing.");
    }
  }

  return (
    <section aria-labelledby="quick-play-live" className="mx-auto w-full max-w-[1180px]">
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
            {rotationName(session.mode)} · scores and rotations stay on this page
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            if (!session.completedMatches.length || window.confirm("End this Quick Play session and return to setup?"))
              onEdit();
          }}
        >
          <ArrowCounterClockwise aria-hidden size={16} /> New setup
        </Button>
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
              <Button type="button" onClick={() => onChange(startNextQuickPlayMatches(session))}>
                <Shuffle aria-hidden size={17} /> {roundMode ? "Start next round" : "Start next match"}
              </Button>
            ) : null}
          </div>
          {session.activeMatches.length ? (
            <div className="mt-4 grid gap-5 xl:grid-cols-2">
              {session.activeMatches.map((match) => (
                <QuickCourt
                  key={match.id}
                  match={match}
                  players={names}
                  onScore={(side, amount) => onChange(scoreQuickPlayMatch(session, match.id, side, amount))}
                  onSwap={() => onChange(swapQuickPlayMatchSides(session, match.id))}
                  onFinish={() => finish(match.id)}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 border-y border-line py-10">
              <h3 className="font-bold">{roundRobinComplete ? "Round robin complete" : "Courts are ready"}</h3>
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
        </section>

        <aside className="space-y-8">
          <section aria-labelledby="quick-waiting-title">
            <h2 id="quick-waiting-title" className="text-lg font-bold">
              {roundMode ? "Waiting & resting" : "Paddle stack"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {waiting.length} {waiting.length === 1 ? "player" : "players"} ready
            </p>
            {waiting.length ? (
              <ol className="mt-3 divide-y divide-line border-y border-line">
                {waiting.map((player, index) => (
                  <li key={player.id} className="flex min-h-14 items-center gap-3 py-2">
                    <span className="score w-5 text-center text-sm font-bold text-muted">{index + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{player.name}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 border-y border-line py-6 text-sm text-muted">Everyone is currently playing.</p>
            )}
          </section>

          <section className="rounded-lg bg-primary-soft p-4" aria-label="Active rotation rules">
            <p className="text-sm font-semibold">{rotationName(session.mode)}</p>
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
            {session.completedMatches.length} completed {session.completedMatches.length === 1 ? "match" : "matches"}.
            Closing or refreshing this page clears Quick Play.
          </p>
        </aside>
      </div>
    </section>
  );
}

export function PublicQuickPlay() {
  const [session, setSession] = useState<QuickPlaySession | null>(null);

  function showSession(nextSession: QuickPlaySession | null) {
    setSession(nextSession);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

  return session ? (
    <QuickPlayLive session={session} onChange={setSession} onEdit={() => showSession(null)} />
  ) : (
    <QuickPlaySetup onStart={showSession} />
  );
}
