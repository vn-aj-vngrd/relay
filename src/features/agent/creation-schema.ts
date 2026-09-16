import { z } from "zod";
import { createGroupSchema } from "@/features/groups/domain";
import { validateQuickPlayConfiguration } from "@/features/matches/quick-play-session";
import { createSessionSchema } from "@/features/sessions/domain";

export const creationInputSchema = z
  .object({
    kind: z.enum(["game", "group", "quickPlay"]),
    flow: z
      .enum([
        "game",
        "draft",
        "replay",
        "groupGame",
        "group",
        "crew",
        "quickPlay",
      ])
      .optional(),
    title: z.string().trim().max(80).optional(),
    accentColor: createSessionSchema().shape.accentColor.unwrap().optional(),
    description: z.string().trim().max(300).optional(),
    venue: z.string().trim().max(120).optional(),
    venueId: z.uuid().optional(),
    venueAddress: z.string().trim().max(240).optional(),
    date: z.iso.date().optional(),
    start: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .optional(),
    end: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .optional(),
    capacity: z.number().int().min(2).max(40).optional(),
    courts: z.number().int().min(1).max(20).optional(),
    visibility: z.enum(["link", "private", "public"]).default("link"),
    costKind: z.enum(["unspecified", "free", "collect"]).default("unspecified"),
    intent: z.enum(["draft", "published"]).default("published"),
    hostPlaying: z.boolean().default(true),
    requiresApproval: z.boolean().default(false),
    notes: z.string().trim().max(1200).optional(),
    groupId: z.uuid().optional(),
    sourceSessionId: z.uuid().optional(),
    players: z.array(z.string().trim().min(1).max(80)).max(24).optional(),
    mode: z
      .enum(["queue", "random", "balanced", "king_of_court"])
      .default("queue"),
  })
  .strict()
  .refine(
    (input) =>
      !input.flow ||
      input.kind ===
        (input.flow === "quickPlay"
          ? "quickPlay"
          : input.flow === "group" || input.flow === "crew"
            ? "group"
            : "game"),
    { message: "Choose a creation flow matching this action.", path: ["flow"] }
  );
export type CreationInput = z.infer<typeof creationInputSchema>;
export type CreationPreview = {
  collecting?: boolean;
  replacement?: { id: string; requestId: string };
  title: string;
  lines: string[];
  people: { id: string; name: string }[];
};
export type CreationProposal = {
  id: string;
  messageId: string;
  status: "collecting" | "pending" | "completed" | "cancelled" | "expired";
  input: CreationInput;
  preview: CreationPreview;
  destination: string | null;
  expiresAt: string;
};

export function validateCreation(input: CreationInput, now = new Date()) {
  if (input.flow === "groupGame" && (!input.groupId || input.kind !== "game"))
    return ["Choose a group for this game."];
  if (
    input.flow === "replay" &&
    (!input.sourceSessionId || input.kind !== "game")
  )
    return ["Choose a completed game to replay."];
  if (
    input.flow === "crew" &&
    (!input.sourceSessionId || input.kind !== "group")
  )
    return ["Choose a game whose crew you want to save."];

  if (input.kind === "group") {
    const parsed = createGroupSchema.safeParse({
      name: input.title,
      description: input.description,
      sourceSessionId: input.sourceSessionId,
    });
    return parsed.success
      ? []
      : parsed.error.issues.map((issue) => issue.message);
  }
  if (input.kind === "quickPlay") {
    if (!input.players || !input.courts)
      return ["Ask for 4–24 player names and 1–6 courts."];
    try {
      validateQuickPlayConfiguration({
        players: input.players.map((name, index) => ({
          id: String(index),
          name,
          experience: 0,
        })),
        courtCount: input.courts,
        mode: input.mode,
        queueRule: "adaptive",
        fixedPairs: [],
        roundDurationMinutes: null,
      });
      return [];
    } catch (error) {
      return [
        error instanceof Error ? error.message : "Check the Quick Play setup.",
      ];
    }
  }
  const parsed = createSessionSchema(now).safeParse({
    title: input.title,
    accentColor: input.accentColor,
    venueName: input.venue,
    venueId: input.venueId,
    venueAddress: input.venueAddress,
    startsAt: `${input.date}T${input.start}:00+08:00`,
    endsAt: `${input.date}T${input.end}:00+08:00`,
    capacity: input.capacity,
    courtCount: input.courts,
    visibility: input.visibility,
    notes: input.notes,
    costKind: input.costKind === "free" ? "free" : "unspecified",
    playerPriceCents: input.costKind === "free" ? 0 : undefined,
  });
  return parsed.success
    ? []
    : parsed.error.issues.map((issue) => issue.message);
}

export function creationForm(input: CreationInput, key: string) {
  const form = new FormData();
  const values = {
    ...input,
    creationKey: key,
    name: input.title,
    hostPlaying: input.hostPlaying ? "yes" : "no",
    requiresApproval: input.requiresApproval ? "on" : "",
  };
  for (const [name, value] of Object.entries(values)) {
    if (typeof value === "string" || typeof value === "number")
      form.set(name, String(value));
  }
  return form;
}
