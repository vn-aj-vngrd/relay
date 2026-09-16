import {
  type CreationInput,
  creationInputSchema,
  validateCreation,
} from "./creation-schema";

export type CreationFlow = NonNullable<CreationInput["flow"]>;
type ReplaySource = {
  id: string;
  title: string;
  venue: string;
  capacity: number;
  courts: number;
};

export function applyReplaySource(
  input: CreationInput,
  previousSource: ReplaySource | undefined,
  nextSource: ReplaySource | undefined
): CreationInput {
  const next = { ...input, sourceSessionId: nextSource?.id };
  for (const key of ["title", "venue"] as const) {
    if (input[key] === undefined || input[key] === previousSource?.[key]) {
      next[key] = nextSource?.[key];
      if (key === "venue") {
        next.venueId = undefined;
        next.venueAddress = undefined;
      }
    }
  }
  for (const key of ["capacity", "courts"] as const) {
    if (input[key] === undefined || input[key] === previousSource?.[key])
      next[key] = nextSource?.[key];
  }
  return next;
}

export const creationFlowLabels: Record<CreationFlow, string> = {
  game: "Create game",
  draft: "Save game draft",
  replay: "Replay game",
  groupGame: "Create group game",
  group: "Create group",
  crew: "Save game’s crew",
  quickPlay: "Start Quick Play",
};
export function creationFlow(input: CreationInput): CreationFlow {
  return (
    input.flow ??
    (input.kind === "quickPlay"
      ? "quickPlay"
      : input.kind === "group"
        ? input.sourceSessionId
          ? "crew"
          : "group"
        : input.sourceSessionId
          ? "replay"
          : input.groupId
            ? "groupGame"
            : input.intent === "draft"
              ? "draft"
              : "game")
  );
}
export function inputForCreation(flow: CreationFlow): CreationInput {
  return creationInputSchema.parse({
    flow,
    kind:
      flow === "group" || flow === "crew"
        ? "group"
        : flow === "quickPlay"
          ? "quickPlay"
          : "game",
    intent: flow === "draft" ? "draft" : "published",
  });
}
export type CreationStep = "source" | "details" | "players" | "settings";
export function creationSteps(input: CreationInput): CreationStep[] {
  const flow = creationFlow(input);
  if (input.kind === "quickPlay") return ["players", "settings"];
  const source: CreationStep[] = ["replay", "crew", "groupGame"].includes(flow)
    ? ["source"]
    : [];
  return [
    ...source,
    "details",
    ...(input.kind === "game" ? ["settings" as const] : []),
  ];
}
export const creationStepLabels: Record<CreationStep, string> = {
  source: "Choose source",
  details: "Details",
  players: "Players",
  settings: "Settings",
};
export function creationFieldErrors(
  input: CreationInput,
  step: CreationStep,
  now = new Date()
) {
  const errors: Record<string, string> = {};
  const required = (key: keyof CreationInput, label: string) => {
    if (input[key] === undefined || input[key] === "")
      errors[key] = `Enter ${label}.`;
  };
  if (step === "source") {
    required(
      creationFlow(input) === "groupGame" ? "groupId" : "sourceSessionId",
      "a source"
    );
  }
  if (step === "details") {
    required("title", input.kind === "group" ? "a group name" : "a game name");
    if (input.title && input.title.trim().length < 2)
      errors.title = "Use at least 2 characters.";
    if (input.kind === "group" && input.title && input.title.length > 60)
      errors.title = "Keep the group name under 60 characters.";
    if (input.kind === "game") {
      required("venue", "a court");
      required("date", "a date");
      required("start", "a start time");
      required("end", "an end time");
      if (
        input.date &&
        input.start &&
        new Date(`${input.date}T${input.start}:00+08:00`) <= now
      )
        errors.start = "Choose a future start time (Philippine time).";
      if (input.end && input.start && input.end <= input.start)
        errors.end = "End time must be after start time.";
    }
  }
  if (step === "players" && (!input.players || input.players.length < 4))
    errors.players = "Add 4–24 player names, one per line.";
  if (step === "settings") {
    required("courts", "the court count");
    if (input.kind === "game") required("capacity", "the player capacity");
    if (input.kind === "quickPlay") {
      const issues = validateCreation(input, now);
      if (issues.length) errors.courts = issues.join(" ");
    }
  }
  const parsed = creationInputSchema.safeParse(input);
  if (!parsed.success) {
    for (const issue of parsed.error.issues)
      errors[String(issue.path[0])] = issue.message;
  }
  return errors;
}
