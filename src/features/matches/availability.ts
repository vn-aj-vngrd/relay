export type PlayAvailabilityIntent = "ready" | "sit_out";

type QueueState =
  | "available"
  | "playing"
  | "waiting"
  | "resting"
  | "unavailable"
  | null;

export function planPlayAvailability(input: {
  intent: PlayAvailabilityIntent;
  queueState: QueueState;
  maxQueuePosition: number;
}) {
  if (input.intent === "ready") {
    if (input.queueState === "playing")
      return {
        playerState: "playing" as const,
        queueState: null,
        queuePosition: null,
        deferred: false,
      };
    return {
      playerState: "waiting" as const,
      queueState: "waiting" as const,
      queuePosition: input.maxQueuePosition + 1,
      deferred: false,
    };
  }
  if (input.queueState === "playing")
    return {
      playerState: "resting" as const,
      queueState: null,
      queuePosition: null,
      deferred: true,
    };
  return {
    playerState: "resting" as const,
    queueState: "resting" as const,
    queuePosition: null,
    deferred: false,
  };
}

export function splitFinishedPlayers(
  returnedPlayerIds: string[],
  restingPlayerIds: ReadonlySet<string>
) {
  return {
    waitingPlayerIds: returnedPlayerIds.filter(
      (id) => !restingPlayerIds.has(id)
    ),
    restingPlayerIds: returnedPlayerIds.filter((id) =>
      restingPlayerIds.has(id)
    ),
  };
}
