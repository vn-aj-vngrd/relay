"use client";

import { ArrowCounterClockwise, ArrowsLeftRight, Minus, Plus, Users, UsersFour } from "@phosphor-icons/react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

type QuickPlayMode = "singles" | "doubles";
type GameSnapshot = { players: string[]; scores: [number, number] };

const defaultNames = ["Player 1", "Player 2", "Player 3", "Player 4"];

function winningSide(scores: [number, number]) {
  if (Math.max(...scores) < 11 || Math.abs(scores[0] - scores[1]) < 2) return null;
  return scores[0] > scores[1] ? 0 : 1;
}

function sidePlayers(players: string[], mode: QuickPlayMode, side: number) {
  if (mode === "singles") return [players[side]];
  return side === 0 ? [players[0], players[1]] : [players[2], players[3]];
}

export function PublicQuickPlay() {
  const [mode, setMode] = useState<QuickPlayMode>("doubles");
  const [names, setNames] = useState(defaultNames);
  const [players, setPlayers] = useState<string[] | null>(null);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [history, setHistory] = useState<GameSnapshot[]>([]);
  const [error, setError] = useState("");
  const requiredPlayers = mode === "singles" ? 2 : 4;
  const winner = winningSide(scores);
  const teams = useMemo(
    () => (players ? [sidePlayers(players, mode, 0), sidePlayers(players, mode, 1)] : []),
    [mode, players],
  );

  function startGame() {
    const nextPlayers = names.slice(0, requiredPlayers).map((name) => name.trim());
    if (nextPlayers.some((name) => !name)) {
      setError("Add a name for every player.");
      return;
    }
    if (new Set(nextPlayers.map((name) => name.toLocaleLowerCase())).size !== nextPlayers.length) {
      setError("Use a different name for each player.");
      return;
    }
    setPlayers(nextPlayers);
    setScores([0, 0]);
    setHistory([]);
    setError("");
  }

  function updateScore(side: number, amount: -1 | 1) {
    if (!players) return;
    setHistory((current) => [...current.slice(-49), { players, scores }]);
    setScores((current) => {
      const next: [number, number] = [...current];
      next[side] = Math.max(0, next[side] + amount);
      return next;
    });
  }

  function undo() {
    const previous = history.at(-1);
    if (!previous) return;
    setPlayers(previous.players);
    setScores(previous.scores);
    setHistory((current) => current.slice(0, -1));
  }

  function swapSides() {
    if (!players) return;
    setHistory((current) => [...current.slice(-49), { players, scores }]);
    if (mode === "singles") setPlayers([players[1], players[0]]);
    else setPlayers([players[2], players[3], players[0], players[1]]);
    setScores([scores[1], scores[0]]);
  }

  if (!players) {
    return (
      <section aria-labelledby="quick-play-setup" className="mx-auto w-full max-w-2xl">
        <div>
          <h1 id="quick-play-setup" className="app-title">
            Start a game now
          </h1>
          <p className="mt-3 max-w-xl leading-7 text-muted">
            Add the players, pick singles or doubles, and keep score from this phone. No account is needed and nothing
            is uploaded.
          </p>
        </div>

        <fieldset className="mt-8">
          <legend className="text-sm font-[650]">Play mode</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[
              { value: "singles" as const, label: "Singles", detail: "2 players", icon: Users },
              { value: "doubles" as const, label: "Doubles", detail: "4 players", icon: UsersFour },
            ].map(({ value, label, detail, icon: Icon }) => {
              const selected = mode === value;
              return (
                <label
                  key={value}
                  className={`pressable flex min-h-20 cursor-pointer items-center gap-3 rounded-xl border px-4 ${selected ? "border-primary bg-primary-soft" : "border-line bg-surface hover:bg-surface-strong"}`}
                >
                  <input
                    type="radio"
                    name="quick-play-mode"
                    value={value}
                    checked={selected}
                    onChange={() => {
                      setMode(value);
                      setError("");
                    }}
                    className="sr-only"
                  />
                  <Icon aria-hidden size={20} className={selected ? "text-primary" : "text-muted"} />
                  <span>
                    <strong className="block text-sm">{label}</strong>
                    <span className="mt-1 block text-xs text-muted">{detail}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: requiredPlayers }, (_, index) => (
            <label key={index} className="block text-sm font-[650]">
              Player {index + 1}
              <input
                value={names[index]}
                onChange={(event) => {
                  const next = [...names];
                  next[index] = event.target.value;
                  setNames(next);
                  setError("");
                }}
                maxLength={50}
                autoComplete="off"
                className="field"
              />
            </label>
          ))}
        </div>

        {error ? (
          <p role="alert" className="mt-4 text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}
        <Button type="button" size="large" onClick={startGame} className="mt-7 w-full sm:w-auto">
          Start {mode}
        </Button>
      </section>
    );
  }

  return (
    <section aria-labelledby="quick-play-scoreboard" className="mx-auto w-full max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 id="quick-play-scoreboard" className="app-title">
            Quick Play
          </h1>
          <p className="mt-2 text-sm text-muted">First to 11, win by 2 · scores stay on this device</p>
        </div>
        <div className="flex flex-wrap gap-1">
          <Button type="button" variant="quiet" onClick={undo} disabled={!history.length}>
            <ArrowCounterClockwise aria-hidden size={16} /> Undo
          </Button>
          <Button type="button" variant="quiet" onClick={swapSides}>
            <ArrowsLeftRight aria-hidden size={16} /> Swap sides
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setPlayers(null);
              setHistory([]);
              setScores([0, 0]);
            }}
          >
            Edit players
          </Button>
        </div>
      </div>

      <div className="relative mt-7 overflow-hidden rounded-2xl bg-court text-white">
        <div aria-hidden className="absolute inset-y-0 left-1/2 w-px bg-court-line/45" />
        <div className="relative grid grid-cols-2">
          {teams.map((team, side) => (
            <section
              key={side}
              aria-label={`Side ${side + 1}`}
              className="min-w-0 px-3 py-5 text-center sm:px-8 sm:py-8"
            >
              <p className="min-h-12 text-sm font-semibold leading-6 text-white/85 sm:min-h-14 sm:text-base">
                {team.map((name) => (
                  <span key={name} className="block truncate" title={name}>
                    {name}
                  </span>
                ))}
              </p>
              <p
                aria-live="polite"
                aria-label={`Side ${side + 1} score ${scores[side]}`}
                className="score my-5 text-7xl font-bold leading-none sm:my-8 sm:text-9xl"
              >
                {scores[side]}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => updateScore(side, -1)}
                  disabled={scores[side] === 0}
                  aria-label={`Subtract one point from side ${side + 1}`}
                  className="pressable grid min-h-16 place-items-center rounded-xl border border-white/18 bg-white/7 text-white hover:bg-white/12 disabled:opacity-35"
                >
                  <Minus aria-hidden size={26} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={() => updateScore(side, 1)}
                  aria-label={`Add one point to side ${side + 1}`}
                  className="pressable grid min-h-16 place-items-center rounded-xl bg-primary text-white hover:bg-primary-hover"
                >
                  <Plus aria-hidden size={28} weight="bold" />
                </button>
              </div>
            </section>
          ))}
        </div>
      </div>

      {winner != null ? (
        <div
          role="status"
          className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-primary-soft px-4 py-4"
        >
          <p className="font-[680] text-ink">
            {teams[winner].join(" & ")} win {scores[winner]}–{scores[winner === 0 ? 1 : 0]}.
          </p>
          <Button
            type="button"
            onClick={() => {
              setHistory([]);
              setScores([0, 0]);
            }}
          >
            New game
          </Button>
        </div>
      ) : null}
    </section>
  );
}
