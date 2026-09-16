import { creationFieldErrors, creationFlow } from "./creation-form-model";
import type { CreationInput } from "./creation-schema";

export type CreationQuestion =
  | "source"
  | "name"
  | "court"
  | "schedule"
  | "players"
  | "roster"
  | "courts"
  | "format"
  | "access"
  | "payment"
  | "finish";
export const questionLabels: Record<CreationQuestion, string> = {
  source: "Source",
  name: "Name",
  court: "Court",
  schedule: "Schedule",
  players: "Players",
  roster: "Players",
  courts: "Courts",
  format: "Format",
  access: "Access",
  payment: "Payment",
  finish: "Publish",
};
export function creationQuestions(input: CreationInput): CreationQuestion[] {
  if (input.kind === "quickPlay") return ["players", "courts", "format"];
  const source: CreationQuestion[] = ["replay", "crew", "groupGame"].includes(
    creationFlow(input)
  )
    ? ["source"]
    : [];
  return input.kind === "group"
    ? [...source, "name"]
    : [
        ...source,
        "name",
        "court",
        "schedule",
        "roster",
        "access",
        "payment",
        "finish",
      ];
}
const fields: Record<CreationQuestion, (keyof CreationInput)[]> = {
  source: ["sourceSessionId", "groupId"],
  name: ["title", "description"],
  court: ["venue", "venueId", "venueAddress"],
  schedule: ["date", "start", "end"],
  players: ["players"],
  roster: ["capacity", "courts", "hostPlaying"],
  courts: ["courts"],
  format: ["mode"],
  access: ["visibility", "requiresApproval"],
  payment: ["costKind"],
  finish: ["intent", "notes", "accentColor"],
};
export function questionErrors(
  input: CreationInput,
  question: CreationQuestion
) {
  const errors: Record<string, string> = Object.assign(
    {} as Record<string, string>,
    ...(["source", "details", "players", "settings"] as const).map((step) =>
      creationFieldErrors(input, step)
    )
  );
  return Object.fromEntries(
    Object.entries(errors).filter(([key]) =>
      fields[question].includes(key as keyof CreationInput)
    )
  );
}
export function questionTitle(
  input: CreationInput,
  question: CreationQuestion
) {
  const titles: Record<CreationQuestion, string> = {
    source:
      creationFlow(input) === "groupGame"
        ? "Which group is this for?"
        : creationFlow(input) === "crew"
          ? "Which game’s crew would you like to save?"
          : "Which game would you like to replay?",
    name:
      input.kind === "group"
        ? "What should we call your group?"
        : "What should we call this game?",
    court: "Where would you like to play?",
    schedule: "When are you playing?",
    players: "Who’s playing?",
    roster: "How many players and courts?",
    courts: "How many courts are available?",
    format: "How would you like to rotate players?",
    access: "Who can join your game?",
    payment: "How will you handle payment?",
    finish: "Publish now or save a draft?",
  };
  return titles[question];
}
