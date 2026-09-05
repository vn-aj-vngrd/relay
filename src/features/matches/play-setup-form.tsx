"use client";

import { useActionState, useRef, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { usePreserveFormValuesOnError } from "@/components/ui/use-preserve-form-values";

import { type StartPlayActionState, startPlay } from "./actions";
import { playModeOptions } from "./play-mode-options";
import { type PlayMode, parsePlaySetup } from "./rotation";

type SetupPlayer = { id: string; name: string; skillLevel?: string | null };

function PairBuilder({ players }: { players: SetupPlayer[] }) {
  const choices = players.map((player) => ({
    value: player.id,
    label: player.name,
  }));
  const [assignments, setAssignments] = useState(() =>
    players.map((player) => player.id)
  );
  const pairCount = Math.floor(players.length / 2);
  const choose = (index: number, next: string) =>
    setAssignments((current) => {
      const swapped = [...current];
      const other = swapped.indexOf(next);
      if (other >= 0) swapped[other] = swapped[index];
      swapped[index] = next;
      return swapped;
    });
  return (
    <section
      aria-labelledby="pair-builder-title"
      className="mt-6 border-t border-line pt-6"
    >
      <h3 id="pair-builder-title" className="text-base font-[680]">
        Set the pairs
      </h3>
      <p className="mt-1 text-sm leading-5 text-muted">
        Choose a player to swap positions. Everyone stays assigned once.
      </p>
      <input type="hidden" name="pairCount" value={pairCount} />
      <div className="mt-4 space-y-5">
        {Array.from({ length: pairCount }, (_, index) => (
          <div key={index} className="rounded-lg bg-surface-strong p-3">
            <p className="score mb-2 text-xs font-semibold text-muted">
              Pair {index + 1}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField
                id={`pair-${index}-a`}
                name={`pair-${index}-a`}
                label={`Pair ${index + 1}, first player`}
                hideLabel
                value={assignments[index * 2]}
                onValueChange={(value) => choose(index * 2, value)}
                options={choices}
              />
              <SelectField
                id={`pair-${index}-b`}
                name={`pair-${index}-b`}
                label={`Pair ${index + 1}, second player`}
                hideLabel
                value={assignments[index * 2 + 1]}
                onValueChange={(value) => choose(index * 2 + 1, value)}
                options={choices}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PlaySetupForm({
  sessionId,
  playerCount,
  courtCount,
  players = [],
  activePlayerIds,
  readiness,
  wizardStep,
  onReview,
  onBack,
  onPlayers,
}: {
  sessionId: string;
  playerCount: number;
  courtCount: number;
  players?: SetupPlayer[];
  activePlayerIds?: string[];
  readiness?: { ready: boolean };
  wizardStep?: "options" | "review";
  onReview?: () => void;
  onBack?: () => void;
  onPlayers?: () => void;
}) {
  const [mode, setMode] = useState<PlayMode>("queue");
  const [partnerPolicy, setPartnerPolicy] = useState<"mix" | "fixed">("mix");
  const [state, action] = useActionState(startPlay, {} as StartPlayActionState);
  const preserveValues = usePreserveFormValuesOnError(state);
  const formRef = useRef<HTMLFormElement>(null);
  const [reviewError, setReviewError] = useState("");
  const [review, setReview] = useState<{
    signature: string;
    queue: string;
    timer: string;
    pairs: string[];
  } | null>(null);
  const reviewing = wizardStep === "review";
  const goingRosterCount = players.length || playerCount;
  const climbPlayers = courtCount * 4;
  const climbAvailable =
    courtCount >= 2 &&
    playerCount === climbPlayers &&
    goingRosterCount === playerCount;
  const pairsAvailable = players.length >= 4 && players.length % 2 === 0;
  const activeIds = new Set(
    activePlayerIds ?? players.map((player) => player.id)
  );
  const completePairCount = Math.floor(playerCount / 2);
  const roundRobinAvailable = pairsAvailable && completePairCount >= 2;
  const fixedPartners =
    mode === "round_robin" || (mode === "queue" && partnerPolicy === "fixed");
  const missingExperience = players.filter(
    (player) => activeIds.has(player.id) && !player.skillLevel
  ).length;

  const signature = JSON.stringify([
    playerCount,
    courtCount,
    players.map((player) => [player.id, player.name]),
    activePlayerIds,
  ]);
  const reviewStale = reviewing && review?.signature !== signature;

  function reviewSetup() {
    if (!formRef.current) return;
    const data = new FormData(formRef.current);
    try {
      const pairs = Array.from(
        { length: Number(data.get("pairCount") ?? 0) },
        (_, index) =>
          [
            String(data.get(`pair-${index}-a`) ?? ""),
            String(data.get(`pair-${index}-b`) ?? ""),
          ] as [string, string]
      );
      parsePlaySetup({
        mode: data.get("mode"),
        queueRule: data.get("queueRule") || undefined,
        partnerPolicy: data.get("partnerPolicy") || undefined,
        pairs,
      });
      if (playerCount < 4 || courtCount < 1)
        throw new Error(
          "Confirm at least four eligible players and one open court."
        );
      if (
        fixedPartners &&
        pairs.filter((pair) => pair.every((id) => activeIds.has(id))).length < 2
      )
        throw new Error(
          "At least two complete pairs must be here before starting."
        );
      const timer = String(data.get("roundDuration") ?? "");
      setReview({
        signature,
        queue:
          data.get("queueRule") === "winner_stays"
            ? "Winners stay — up to two games"
            : data.get("queueRule") === "four_off"
              ? "Four rotate — a fresh group every match"
              : "Adaptive — Relay responds to the queue",
        timer: timer ? `${timer} minutes` : "No timer — finish by score",
        pairs: pairs.map((pair) =>
          pair
            .map(
              (id) =>
                players.find((player) => player.id === id)?.name ?? "Player"
            )
            .join(" + ")
        ),
      });
      setReviewError("");
      onReview?.();
    } catch (error) {
      setReviewError(
        error instanceof Error && !("issues" in error)
          ? error.message
          : "Review the rotation and assign each player to one pair."
      );
    }
  }

  return (
    <form
      ref={formRef}
      noValidate
      action={action}
      onSubmitCapture={(event) => {
        if (wizardStep === "options") {
          event.preventDefault();
          reviewSetup();
          return;
        }
        if (reviewStale) {
          event.preventDefault();
          return;
        }
        preserveValues(event);
      }}
      className={wizardStep ? "text-left" : "mt-8 text-left"}
    >
      <input type="hidden" name="sessionId" value={sessionId} />
      <div hidden={reviewing}>
        {wizardStep ? (
          <div className="mb-5">
            <h2 tabIndex={-1} className="text-lg font-bold outline-none">
              Choose how this game runs
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Pick a rotation. Partner and timer options appear only when
              relevant.
            </p>
          </div>
        ) : null}
        <fieldset>
          <legend className="sr-only">Play setup</legend>
          <div className="divide-y divide-line border-y border-line">
            {playModeOptions.map(
              ({ mode: value, title, description, icon: Icon }) => {
                const disabled =
                  (value === "king_of_court" && !climbAvailable) ||
                  (value === "round_robin" && !roundRobinAvailable);
                const selected = mode === value;
                return (
                  <label
                    key={value}
                    className={`flex min-h-20 gap-3 py-4 ${disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer"}`}
                  >
                    <input
                      type="radio"
                      name="mode"
                      value={value}
                      checked={selected}
                      disabled={disabled}
                      onChange={() => setMode(value)}
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
                      <span className="mt-1 block text-sm leading-5 text-muted">
                        {description}
                      </span>
                      {value === "king_of_court" && !climbAvailable ? (
                        <span className="mt-1.5 block text-xs font-medium text-warning">
                          {courtCount < 2
                            ? "Needs at least 2 courts."
                            : goingRosterCount !== playerCount
                              ? "Every going player must be here before Court Climb starts."
                              : `Needs exactly ${climbPlayers} active players for ${courtCount} courts.`}
                        </span>
                      ) : value === "round_robin" && !roundRobinAvailable ? (
                        <span className="mt-1.5 block text-xs font-medium text-warning">
                          {!pairsAvailable
                            ? "Needs an even going roster of at least 4 players."
                            : "Needs at least two complete pairs here to start."}
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              }
            )}
          </div>
        </fieldset>

        {mode !== "queue" ? (
          <div className="mt-5">
            <SelectField
              id="round-duration"
              name="roundDuration"
              label="Round timer"
              defaultValue=""
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

        {mode === "balanced" && missingExperience ? (
          <p className="mt-3 text-xs leading-5 text-muted">
            {missingExperience}{" "}
            {missingExperience === 1 ? "player has" : "players have"} no
            experience set. Relay uses a neutral middle value so play can still
            start.
          </p>
        ) : null}

        {mode === "queue" ? (
          <div className="mt-5 space-y-5">
            <div>
              <p className="text-sm font-[650]">Partner style</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label
                  className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border px-3 ${partnerPolicy === "mix" ? "border-primary bg-primary-soft" : "border-line bg-surface"}`}
                >
                  <input
                    type="radio"
                    name="partnerPolicy"
                    value="mix"
                    checked={partnerPolicy === "mix"}
                    onChange={() => setPartnerPolicy("mix")}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  <span>
                    <strong className="block text-sm">Mix partners</strong>
                    <span className="block text-xs text-muted">
                      Relay balances variety.
                    </span>
                  </span>
                </label>
                <label
                  className={`flex min-h-14 items-center gap-3 rounded-lg border px-3 ${pairsAvailable ? "cursor-pointer" : "cursor-not-allowed opacity-55"} ${partnerPolicy === "fixed" ? "border-primary bg-primary-soft" : "border-line bg-surface"}`}
                >
                  <input
                    type="radio"
                    name="partnerPolicy"
                    value="fixed"
                    checked={partnerPolicy === "fixed"}
                    disabled={!pairsAvailable}
                    onChange={() => setPartnerPolicy("fixed")}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  <span>
                    <strong className="block text-sm">
                      Keep pairs together
                    </strong>
                    <span className="block text-xs text-muted">
                      Pair everyone going; late teams join when ready.
                    </span>
                  </span>
                </label>
              </div>
              {!pairsAvailable ? (
                <p className="mt-2 text-xs font-medium text-warning">
                  Fixed pairs need an even going roster of at least 4 players.
                </p>
              ) : null}
            </div>
            <div>
              <SelectField
                id="queue-rule"
                name="queueRule"
                label="Queue rule"
                defaultValue="adaptive"
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

        {fixedPartners && pairsAvailable ? (
          <PairBuilder
            key={players.map((player) => player.id).join(":")}
            players={players}
          />
        ) : null}
      </div>
      {reviewing ? (
        <section aria-labelledby="play-review-title">
          <h2
            id="play-review-title"
            tabIndex={-1}
            className="text-lg font-bold outline-none"
          >
            Review Play setup
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Starting Play creates the first matches and locks the game’s plan.
            Check the players, courts, and rotation first.
          </p>
          <dl className="mt-5 divide-y divide-line border-y border-line text-sm">
            {[
              [
                "Players",
                `${playerCount} eligible · ${goingRosterCount} going`,
              ],
              ["Open courts", String(courtCount)],
              [
                "Rotation",
                playModeOptions.find((option) => option.mode === mode)?.title ??
                  "Paddle Stack",
              ],
              ...(mode === "queue"
                ? [
                    [
                      "Partners",
                      fixedPartners ? "Keep pairs together" : "Mix partners",
                    ],
                    ["Queue rule", review?.queue ?? ""],
                  ]
                : [["Round timer", review?.timer ?? "No timer"]]),
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-3"
              >
                <dt className="text-muted">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          {review?.pairs.length ? (
            <div className="mt-5">
              <h3 className="text-sm font-semibold">Fixed pairs</h3>
              <ul className="mt-2 flex flex-col gap-2 text-sm">
                {review.pairs.map((pair, index) => (
                  <li key={pair}>
                    Pair {index + 1}: {pair}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {reviewStale ? (
            <Alert className="mt-4">
              Arrivals or courts changed. Go back to game options and review the
              updated setup.
            </Alert>
          ) : null}
        </section>
      ) : null}
      {reviewError && !reviewing ? (
        <Alert className="mt-4">{reviewError}</Alert>
      ) : null}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <p className="text-sm text-muted">
          {playerCount} here · {goingRosterCount} going · {courtCount}{" "}
          {courtCount === 1 ? "court" : "courts"}
        </p>
        {onBack ? (
          <Button type="button" variant="secondary" onClick={onBack}>
            Back
          </Button>
        ) : null}
        {wizardStep === "options" ? (
          <Button
            type="button"
            onClick={reviewSetup}
            disabled={readiness ? !readiness.ready : false}
          >
            Review setup
          </Button>
        ) : (
          <SubmitButton
            pendingLabel="Starting Play…"
            disabled={reviewStale || (readiness ? !readiness.ready : false)}
            className="w-full sm:w-auto"
          >
            Start Play
          </SubmitButton>
        )}
        {readiness && !readiness.ready ? (
          onPlayers ? (
            <Button type="button" variant="secondary" onClick={onPlayers}>
              Review players and courts
            </Button>
          ) : (
            <a
              href="#setup-readiness"
              className="inline-flex min-h-11 items-center text-sm font-medium text-primary"
            >
              Complete the missing setup above
            </a>
          )
        ) : null}
      </div>
      {state.error ? <Alert className="mt-4">{state.error}</Alert> : null}
    </form>
  );
}
