export type ReadinessTask = "roster" | "booking";

export type SessionReadiness = {
  ready: boolean;
  percent: number;
  completed: number;
  total: number;
  missing: ReadinessTask[];
};

export function eligiblePlayPlayers<
  T extends {
    checkedInAt: Date | string | null;
    playState: string;
  },
>(players: T[]): T[] {
  const checkedIn = players.filter((player) => player.checkedInAt);
  const attendanceTaken =
    checkedIn.length > 0 ||
    players.some((player) => player.playState === "unavailable");
  return attendanceTaken ? checkedIn : players;
}

export function sessionReadiness(input: {
  goingCount: number;
  booked: boolean;
  bookingNotRequired: boolean;
}): SessionReadiness {
  const complete: Record<ReadinessTask, boolean> = {
    roster: input.goingCount >= 4,
    booking: input.booked || input.bookingNotRequired,
  };
  const missing = (Object.keys(complete) as ReadinessTask[]).filter(
    (task) => !complete[task]
  );
  const total = 2;
  const completed = total - missing.length;
  return {
    ready: missing.length === 0,
    percent: Math.round((completed / total) * 100),
    completed,
    total,
    missing,
  };
}

export function readinessTaskLabel(task: ReadinessTask): string {
  return task === "roster"
    ? "Confirm at least 4 eligible players"
    : "Confirm the court arrangement";
}

export function playSetupNextAction(readiness: {
  missing: readonly string[];
}): string {
  return readiness.missing.includes("booking")
    ? "Confirm court arrangement"
    : "Set up Play";
}
