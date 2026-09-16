import { type CreationInput, creationInputSchema } from "./creation-schema";

export type CreationFlow = NonNullable<CreationInput["flow"]>;
export type ReplaySource = {
  id: string;
  title: string;
  venue: string;
  capacity: number;
  courts: number;
  replayGroupId?: string | null;
  venueId?: string | null;
  venueAddress?: string | null;
  start?: string;
  end?: string;
  visibility?: CreationInput["visibility"];
  requiresApproval?: boolean;
  accentColor?: CreationInput["accentColor"];
};

export function applyReplaySource(
  input: CreationInput,
  previousSource: ReplaySource | undefined,
  nextSource: ReplaySource | undefined
): CreationInput {
  const next = { ...input, sourceSessionId: nextSource?.id };
  for (const key of ["title", "venue", "start", "end"] as const) {
    if (input[key] === undefined || input[key] === previousSource?.[key]) {
      next[key] = nextSource?.[key];
      if (key === "venue") {
        next.venueId = nextSource?.venueId ?? undefined;
        next.venueAddress = nextSource?.venueAddress ?? undefined;
      }
    }
  }
  if (
    input.accentColor === undefined ||
    input.accentColor === previousSource?.accentColor
  )
    next.accentColor = nextSource?.accentColor;
  if (
    input.groupId === undefined ||
    input.groupId === previousSource?.replayGroupId
  )
    next.groupId = nextSource?.replayGroupId ?? undefined;
  if (input.visibility === (previousSource?.visibility ?? "link"))
    next.visibility = nextSource?.visibility ?? "link";
  if (input.requiresApproval === (previousSource?.requiresApproval ?? false))
    next.requiresApproval = nextSource?.requiresApproval ?? false;
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
