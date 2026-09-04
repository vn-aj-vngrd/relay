export type QueueMove = "top" | "up" | "down" | "end";

export type PersonalPlayState =
  | { kind: "not_participating" }
  | { kind: "not_here" }
  | { kind: "resting" }
  | {
      kind: "playing";
      matchId: string;
      courtLabel: string;
      partnerNames: string[];
      opponentNames: string[];
    }
  | {
      kind: "waiting";
      position: number;
      groupsAhead: number;
      ready: boolean;
      fixedPair: boolean;
      acknowledged: boolean;
    };

type PersonalQueueEntry = {
  playerId: string;
  position: number;
  state: string;
  readyAt?: Date | null;
};

type PersonalMatch = {
  id: string;
  courtLabel: string;
  players: { id: string; name: string; team: string }[];
};

type PersonalPair = {
  id: string;
  members: string[];
};

export function derivePersonalPlayState(input: {
  playerId?: string;
  rsvp?: string;
  checkedInAt?: Date | null;
  playState?: string;
  queue: PersonalQueueEntry[];
  activeMatches: PersonalMatch[];
  pairs: PersonalPair[];
}): PersonalPlayState {
  if (!input.playerId || input.rsvp !== "going")
    return { kind: "not_participating" };

  const match = input.activeMatches.find((item) =>
    item.players.some((player) => player.id === input.playerId)
  );
  if (match) {
    const player = match.players.find((item) => item.id === input.playerId)!;
    return {
      kind: "playing",
      matchId: match.id,
      courtLabel: match.courtLabel,
      partnerNames: match.players
        .filter(
          (item) => item.team === player.team && item.id !== input.playerId
        )
        .map((item) => item.name),
      opponentNames: match.players
        .filter((item) => item.team !== player.team)
        .map((item) => item.name),
    };
  }

  if (input.playState === "resting") return { kind: "resting" };

  const waiting = input.queue
    .filter((item) => item.state === "waiting")
    .toSorted((left, right) => left.position - right.position);
  const ownQueue = waiting.find((item) => item.playerId === input.playerId);
  if (ownQueue) {
    const pair = input.pairs.find((item) =>
      item.members.includes(input.playerId!)
    );
    if (pair) {
      const waitingIds = new Set(waiting.map((item) => item.playerId));
      const waitingPairs = input.pairs.filter((item) =>
        item.members.every((id) => waitingIds.has(id))
      );
      const pairPosition = waitingPairs.findIndex(
        (item) => item.id === pair.id
      );
      return {
        kind: "waiting",
        position: pairPosition + 1,
        groupsAhead: Math.max(0, Math.floor(pairPosition / 2)),
        ready: pairPosition >= 0 && pairPosition < 2,
        fixedPair: true,
        acknowledged: Boolean(ownQueue.readyAt),
      };
    }
    const position = waiting.indexOf(ownQueue) + 1;
    return {
      kind: "waiting",
      position,
      groupsAhead: Math.floor((position - 1) / 4),
      ready: position <= 4,
      fixedPair: false,
      acknowledged: Boolean(ownQueue.readyAt),
    };
  }

  if (!input.checkedInAt || input.playState === "unavailable")
    return { kind: "not_here" };
  return { kind: "resting" };
}

export function moveQueueGroup(
  orderedIds: string[],
  groupIds: string[],
  move: QueueMove
) {
  const selected = new Set(groupIds);
  const group = orderedIds.filter((id) => selected.has(id));
  if (!group.length) return orderedIds;
  const remaining = orderedIds.filter((id) => !selected.has(id));
  const firstIndex = orderedIds.findIndex((id) => selected.has(id));
  const insertionIndex = Math.max(
    0,
    Math.min(
      remaining.length,
      move === "top"
        ? 0
        : move === "end"
          ? remaining.length
          : move === "up"
            ? firstIndex - group.length
            : firstIndex + group.length
    )
  );
  return [
    ...remaining.slice(0, insertionIndex),
    ...group,
    ...remaining.slice(insertionIndex),
  ];
}

export function restoreCancelledPlayers(
  waiting: { id: string; position: number }[],
  cancelled: { id: string; position: number }[]
) {
  const cancelledIds = new Set(cancelled.map((item) => item.id));
  const current = waiting.filter((item) => !cancelledIds.has(item.id));
  const restored = cancelled.toSorted(
    (left, right) => left.position - right.position
  );
  const startPriority = restored[0]?.position ?? Number.MAX_SAFE_INTEGER;
  const insertionIndex = current.findIndex(
    (item) => item.position > startPriority
  );
  const index = insertionIndex === -1 ? current.length : insertionIndex;
  return [...current.slice(0, index), ...restored, ...current.slice(index)].map(
    (item, position) => ({ ...item, position: position + 1 })
  );
}
