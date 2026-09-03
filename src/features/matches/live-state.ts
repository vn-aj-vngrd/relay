import { startMatchLabel } from "./presentation";

const roundModes = new Set([
  "random",
  "balanced",
  "king_of_court",
  "round_robin",
]);

type QueueEntry = {
  queue: { state: string; position: number };
  player: { id: string };
};

type SessionPair = {
  id: string;
  position: number;
  members: string[];
};

type ActiveMatch = {
  startedAt: Date | null;
};

export function deriveLiveState<TQueue extends QueueEntry>(input: {
  rotationMode: string;
  queue: TQueue[];
  pairs: SessionPair[];
  activeMatches: ActiveMatch[];
  courtCount: number;
  completedMatchCount: number;
}) {
  const waiting = input.queue.filter(({ queue }) => queue.state === "waiting");
  const waitingById = new Map(waiting.map((item) => [item.player.id, item]));
  const waitingPairs = input.pairs
    .map((pair) => ({
      ...pair,
      players: pair.members.flatMap((id) =>
        waitingById.get(id) ? [waitingById.get(id)!] : []
      ),
    }))
    .filter((pair) => pair.players.length === 2)
    .toSorted(
      (left, right) =>
        Math.min(...left.players.map((item) => item.queue.position)) -
        Math.min(...right.players.map((item) => item.queue.position))
    );
  const roundMode = roundModes.has(input.rotationMode);
  const roundRobinMatchCount =
    (input.pairs.length * (input.pairs.length - 1)) / 2;
  const roundRobinComplete =
    input.rotationMode === "round_robin" &&
    input.completedMatchCount >= roundRobinMatchCount;
  const canStartRotation =
    !roundRobinComplete &&
    waiting.length >= 4 &&
    (roundMode
      ? input.activeMatches.length === 0
      : input.activeMatches.length < input.courtCount);
  const nextCourtCount = Math.min(
    Math.max(0, input.courtCount - input.activeMatches.length),
    Math.floor(waiting.length / 4)
  );
  const roundStartedAt = input.activeMatches
    .flatMap((match) => (match.startedAt ? [match.startedAt] : []))
    .toSorted((left, right) => left.getTime() - right.getTime())[0];
  const rotationLabel = roundMode
    ? input.completedMatchCount
      ? "Start next round"
      : "Start first round"
    : nextCourtCount > 1
      ? `Start ${nextCourtCount} courts`
      : input.activeMatches.length
        ? "Start another match"
        : startMatchLabel(input.completedMatchCount);

  return {
    waiting,
    waitingPairs,
    roundMode,
    roundRobinComplete,
    canStartRotation,
    nextCourtCount,
    roundStartedAt,
    rotationLabel,
  };
}
