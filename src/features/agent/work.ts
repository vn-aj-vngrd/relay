import type { UIMessage } from "ai";
import { z } from "zod";

export const workLabels = {
  reviewing: "Reviewing your request",
  games: "Searching games",
  game: "Reading game details",
  groups: "Checking your groups",
  courts: "Searching the court directory",
  court: "Reading court details",
  guides: "Browsing Help Center guides",
  searchHelp: "Searching Help Center",
  guide: "Reading a Help Center guide",
  options: "Checking available creation options",
  creation: "Checking saved creation progress",
  prepare: "Preparing details for your review",
  writing: "Writing the response",
} as const;

export const workSchema = z.object({
  startedAt: z.number().finite(),
  finishedAt: z.number().finite().optional(),
  status: z.enum(["working", "completed", "stopped", "failed"]),
  entries: z
    .array(
      z.object({
        step: z.enum(
          Object.keys(workLabels) as [
            keyof typeof workLabels,
            ...(keyof typeof workLabels)[],
          ]
        ),
        status: z.enum(["running", "complete", "failed", "stopped"]),
      })
    )
    .max(32),
});
export type AgentWork = z.infer<typeof workSchema>;

const toolSteps: Record<string, keyof typeof workLabels> = {
  searchGames: "games",
  gameDetails: "game",
  myGroups: "groups",
  searchCourts: "courts",
  courtDetails: "court",
  helpIndex: "guides",
  searchHelp: "searchHelp",
  readHelp: "guide",
  creationOptions: "options",
  creationStatus: "creation",
  prepareCreation: "prepare",
};
export function toolWorkStep(name: string) {
  return Object.hasOwn(toolSteps, name) ? toolSteps[name] : undefined;
}
export function messageWork(message: UIMessage): AgentWork | null {
  const metadata = message.metadata;
  if (!metadata || typeof metadata !== "object" || !("work" in metadata))
    return null;
  const result = workSchema.safeParse(metadata.work);
  return result.success ? result.data : null;
}
export function finishWork(
  work: AgentWork,
  status: Exclude<AgentWork["status"], "working">
): AgentWork {
  const entryStatus = status === "completed" ? "complete" : status;
  return {
    ...work,
    status,
    finishedAt: work.finishedAt ?? Date.now(),
    entries: work.entries.map((entry) => ({
      ...entry,
      status: entry.status === "running" ? entryStatus : entry.status,
    })),
  };
}
export function formatWorkDuration(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return seconds < 60
    ? `${seconds}s`
    : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}
