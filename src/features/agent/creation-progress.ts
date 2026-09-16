import { creationFlow } from "./creation-model";
import type { CreationInput } from "./creation-schema";

/** Collected details, not validation or authorization to create. */
export function creationProgress(input: CreationInput) {
  const steps: [string, boolean][] = [];
  const flow = creationFlow(input);
  if (flow === "replay" || flow === "crew")
    steps.push(["Previous game", Boolean(input.sourceSessionId)]);
  if (flow === "groupGame") steps.push(["Group", Boolean(input.groupId)]);
  if (input.kind === "quickPlay") {
    steps.push(["Player names", Boolean(input.players?.length)]);
    steps.push(["Courts", input.courts !== undefined]);
  } else {
    steps.push(["Name", Boolean(input.title?.trim())]);
    if (input.kind === "game") {
      steps.push(["Court", Boolean(input.venue?.trim())]);
      steps.push(["Date", Boolean(input.date)]);
      steps.push(["Start time", Boolean(input.start)]);
      steps.push(["End time", Boolean(input.end)]);
      steps.push(["Player capacity", input.capacity !== undefined]);
      steps.push(["Courts", input.courts !== undefined]);
    }
  }
  return {
    completed: steps.filter(([, collected]) => collected).length,
    total: steps.length,
    next: steps.find(([, collected]) => !collected)?.[0] ?? null,
  };
}
