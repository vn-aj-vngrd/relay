import {
  type FixedPair,
  type PlayMode,
  planRotation,
  type QueueRule,
  type RotationCourt,
  type RotationHistory,
  type RotationPlan,
  type WaitingPlayer,
} from "./rotation";

export type NextRotationInput = {
  mode: PlayMode;
  queueRule: QueueRule;
  courts: RotationCourt[];
  activeCourtIds: string[];
  waiting: WaitingPlayer[];
  history: RotationHistory[];
  fixedPairs: FixedPair[];
};

export type NextRotationPreview = {
  plans: RotationPlan[];
  upcomingTeams?: Pick<RotationPlan, "teamA" | "teamB">;
  preparing: string[];
  message: string;
  preparationLabel: string;
};

function eligibleWaiting(input: NextRotationInput) {
  const waiting = input.waiting.toSorted((a, b) => a.position - b.position);
  if (!input.fixedPairs.length) return waiting;
  const byId = new Map(waiting.map((player) => [player.id, player]));
  const pairs = input.fixedPairs
    .filter((pair) => pair.every((id) => byId.has(id)))
    .toSorted(
      (a, b) =>
        Math.min(...a.map((id) => byId.get(id)!.position)) -
        Math.min(...b.map((id) => byId.get(id)!.position))
    );
  return pairs.flatMap((pair) => pair.map((id) => byId.get(id)!));
}

// Preview and start share this planner; neither reserves players nor creates a match.
export function planNextRotation(input: NextRotationInput): RotationPlan[] {
  if (input.mode !== "queue" && input.activeCourtIds.length) return [];
  const occupied = new Set(input.activeCourtIds);
  const courts = input.courts.filter((court) => !occupied.has(court.id));
  const waiting = eligibleWaiting(input);
  if (!courts.length || waiting.length < 4) return [];
  if (input.mode === "king_of_court" && waiting.length !== courts.length * 4)
    return [];
  return planRotation({ ...input, courts, waiting });
}

export function rotationPlanKey(plans: RotationPlan[]) {
  return JSON.stringify(
    plans.map(({ courtId, teamA, teamB }) => ({ courtId, teamA, teamB }))
  );
}

export const changedLineupMessage =
  "The lineup changed. Review Up next before starting again.";

export function assertRotationPreview(
  plans: RotationPlan[],
  expected: FormDataEntryValue | null
) {
  if (expected !== rotationPlanKey(plans))
    throw new Error(changedLineupMessage);
}

export function previewNextRotation(
  input: NextRotationInput
): NextRotationPreview {
  const empty = { plans: [], preparing: [], preparationLabel: "Get ready" };
  if (!input.courts.length)
    return { ...empty, message: "No courts are open for the next match." };

  // Court Climb can be temporarily unplannable after court/availability changes.
  let plans: RotationPlan[];
  try {
    plans = planNextRotation(input);
  } catch {
    return {
      ...empty,
      message: "Court Climb needs its full roster and court setup to continue.",
    };
  }
  if (plans.length)
    return {
      ...empty,
      plans,
      message:
        input.mode === "queue" ? "Ready when you are." : "Next round is ready.",
    };

  const waiting = eligibleWaiting(input);
  if (input.activeCourtIds.length) {
    if (input.mode !== "queue")
      return {
        ...empty,
        preparationLabel: "Waiting this round",
        preparing: waiting.map((player) => player.id),
        message:
          "Finish every court to confirm the next round’s teams and courts.",
      };
    const resultDependent =
      input.queueRule === "winner_stays" ||
      (input.queueRule === "adaptive" && waiting.length < 4);
    const upcoming =
      !resultDependent && waiting.length >= 4
        ? planRotation({
            ...input,
            courts: input.courts.slice(0, 1),
            waiting,
          })[0]
        : undefined;
    return {
      ...empty,
      upcomingTeams: upcoming
        ? { teamA: upcoming.teamA, teamB: upcoming.teamB }
        : undefined,
      preparing: waiting.slice(0, resultDependent ? 2 : 4).map((p) => p.id),
      message: waiting.length
        ? resultDependent
          ? "Next available court · the result and rotation rule determine who joins you."
          : upcoming
            ? "Get ready. This lineup updates if the queue changes."
            : "Next available court · teams are confirmed when a court opens."
        : "The next lineup will appear after a match finishes.",
    };
  }
  if (input.mode === "king_of_court")
    return {
      ...empty,
      message: "Court Climb needs its full roster and court setup to continue.",
    };
  if (input.mode === "round_robin" && waiting.length >= 4)
    return {
      ...empty,
      message: "No unplayed matchup is available for the ready pairs.",
    };
  const missing = Math.max(1, 4 - waiting.length);
  return {
    ...empty,
    message: input.fixedPairs.length
      ? "Waiting for two complete pairs. Both partners must be available."
      : `Waiting for ${missing} more ${missing === 1 ? "player" : "players"}.`,
  };
}
