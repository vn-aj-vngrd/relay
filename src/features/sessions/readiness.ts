export type ReadinessTask = "roster" | "booking" | "payment";

export type SessionReadiness = {
  ready: boolean;
  percent: number;
  completed: number;
  total: number;
  missing: ReadinessTask[];
};

export function sessionReadiness(input: {
  goingCount: number;
  booked: boolean;
  expectsCollection: boolean;
  collectionCreated: boolean;
}): SessionReadiness {
  const complete: Record<ReadinessTask, boolean> = {
    roster: input.goingCount >= 4,
    booking: input.booked,
    payment: !input.expectsCollection || input.collectionCreated,
  };
  const missing = (Object.keys(complete) as ReadinessTask[]).filter((task) => !complete[task]);
  const total = 3;
  const completed = total - missing.length;
  return { ready: missing.length === 0, percent: Math.round((completed / total) * 100), completed, total, missing };
}

export function readinessTaskLabel(task: ReadinessTask): string {
  if (task === "roster") return "Get at least 4 players going";
  if (task === "booking") return "Confirm the court booking";
  return "Create the player repayment split";
}
