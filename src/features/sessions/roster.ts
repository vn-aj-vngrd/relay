export type RosterRsvp = "invited" | "pending" | "going" | "maybe" | "waitlisted" | "declined";

export type RosterSnapshotPlayer = {
  id: string;
  rsvp: RosterRsvp;
  waitlistPosition: number | null;
};

type RosterIntent = {
  playerId?: string;
  requested: "going" | "maybe" | "declined";
  requiresApproval?: boolean;
};

type RosterOutcome = {
  rsvp: Exclude<RosterRsvp, "invited">;
  waitlistPosition: number | null;
  playState: "waiting" | "unavailable";
};

export type RosterTransition = {
  target: RosterOutcome;
  updates: Array<RosterOutcome & { id: string }>;
  promotedPlayerIds: string[];
};

function requestedRsvp(
  intent: RosterIntent,
  current: RosterSnapshotPlayer | undefined,
  goingCount: number,
  capacity: number,
): RosterRsvp {
  if (intent.requested !== "going") return intent.requested;
  if (intent.requiresApproval && current?.rsvp !== "going" && current?.rsvp !== "waitlisted") return "pending";
  return goingCount >= capacity ? "waitlisted" : "going";
}

export function planRosterTransition(input: {
  roster: RosterSnapshotPlayer[];
  capacity: number;
  intent: RosterIntent;
}): RosterTransition {
  if (input.capacity < 2) throw new Error("Session capacity must be at least 2");

  const current = input.intent.playerId
    ? input.roster.find((player) => player.id === input.intent.playerId)
    : undefined;
  const otherPlayers = input.roster.filter((player) => player.id !== input.intent.playerId);
  const goingCount = otherPlayers.filter((player) => player.rsvp === "going").length;
  const nextRsvp = requestedRsvp(input.intent, current, goingCount, input.capacity);
  const lastWaitlistPosition = Math.max(0, ...otherPlayers.map((player) => player.waitlistPosition ?? 0));
  const targetId = current?.id ?? "__new_player__";
  const planned = [
    ...otherPlayers.map((player) => ({ ...player })),
    {
      id: targetId,
      rsvp: nextRsvp,
      waitlistPosition: nextRsvp === "waitlisted" ? (current?.waitlistPosition ?? lastWaitlistPosition + 1) : null,
    },
  ];

  const openedPlace = current?.rsvp === "going" && nextRsvp !== "going";
  const promotedPlayerIds: string[] = [];
  if (openedPlace) {
    const next = planned
      .filter((player) => player.rsvp === "waitlisted")
      .toSorted((left, right) => (left.waitlistPosition ?? Infinity) - (right.waitlistPosition ?? Infinity))[0];
    if (next) {
      next.rsvp = "going";
      next.waitlistPosition = null;
      promotedPlayerIds.push(next.id);
    }
  }

  planned
    .filter((player) => player.rsvp === "waitlisted")
    .toSorted((left, right) => (left.waitlistPosition ?? Infinity) - (right.waitlistPosition ?? Infinity))
    .forEach((player, index) => {
      player.waitlistPosition = index + 1;
    });

  const target = planned.find((player) => player.id === targetId)!;
  const outcome = (player: (typeof planned)[number]): RosterOutcome => ({
    rsvp: player.rsvp as RosterOutcome["rsvp"],
    waitlistPosition: player.waitlistPosition,
    playState: player.rsvp === "going" ? "waiting" : "unavailable",
  });
  const before = new Map(input.roster.map((player) => [player.id, player]));
  const updates = planned.flatMap((player) => {
    const previous = before.get(player.id);
    if (!previous || (previous.rsvp === player.rsvp && previous.waitlistPosition === player.waitlistPosition))
      return [];
    return [{ id: player.id, ...outcome(player) }];
  });

  return { target: outcome(target), updates, promotedPlayerIds };
}
