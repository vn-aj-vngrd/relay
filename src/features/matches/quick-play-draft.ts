import { z } from "zod";

import {
  playingExperienceValues,
  playingExperienceWeight,
} from "@/features/players/playing-experience";

import {
  maxQuickPlayPlayers,
  type QuickPlaySession,
} from "./quick-play-session";
import { readQuickPlayStorage } from "./quick-play-storage";

export const quickPlayDraftKey = "relay-quick-play-draft";

export function quickPlayReplayDraft(session: QuickPlaySession) {
  return {
    step: 1,
    players: session.players.map((player) => ({
      ...player,
      experience:
        playingExperienceValues.find(
          (value) => playingExperienceWeight(value) === player.experience
        ) ?? "casual",
    })),
    pairOrder: session.fixedPairs.length
      ? session.fixedPairs.flat()
      : session.players.map((player) => player.id),
    courtCountInput: String(session.courtCount),
    mode: session.mode,
    queueRule: session.queueRule,
    roundDuration:
      session.roundDurationMinutes == null
        ? ""
        : String(session.roundDurationMinutes),
    partnerPolicy: session.fixedPairs.length ? "fixed" : "mix",
  };
}

export function parseQuickPlayNames(value: string, existingNames: string[]) {
  const names = value
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter(Boolean);
  if (!names.length) throw new Error("Enter at least one name, one per line.");
  if (names.some((name) => name.length > 50))
    throw new Error("Keep each name to 50 characters or fewer.");
  const allNames = [...existingNames, ...names].map((name) =>
    name.trim().toLocaleLowerCase()
  );
  if (new Set(allNames).size !== allNames.length)
    throw new Error(
      "Use a unique name for each player, including players already entered."
    );
  if (allNames.length > maxQuickPlayPlayers)
    throw new Error(
      `Quick Play supports up to ${maxQuickPlayPlayers} players.`
    );
  return names;
}

const draftSchema = z
  .object({
    step: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    players: z
      .array(
        z.object({
          id: z.string().min(1),
          name: z.string().max(50),
          experience: z.enum(playingExperienceValues),
        })
      )
      .min(4)
      .max(maxQuickPlayPlayers),
    pairOrder: z.array(z.string()).min(4).max(maxQuickPlayPlayers),
    courtCountInput: z.string().max(10),
    mode: z.enum([
      "queue",
      "random",
      "balanced",
      "king_of_court",
      "round_robin",
    ]),
    queueRule: z.enum(["adaptive", "four_off", "winner_stays"]),
    roundDuration: z.enum(["", "10", "12", "15", "20"]),
    partnerPolicy: z.enum(["mix", "fixed"]),
  })
  .refine((draft) => {
    const ids = new Set(draft.players.map((player) => player.id));
    return (
      ids.size === draft.players.length &&
      draft.pairOrder.length === ids.size &&
      new Set(draft.pairOrder).size === ids.size &&
      draft.pairOrder.every((id) => ids.has(id))
    );
  });

export function loadQuickPlayDraft() {
  const { value, warning } = readQuickPlayStorage(quickPlayDraftKey);
  if (!value) return { draft: null, warning, restoreWarning: "" };
  try {
    const result = draftSchema.safeParse(JSON.parse(value));
    if (result.success) {
      const draft = result.data;
      const names = draft.players.map((player) =>
        player.name.trim().toLocaleLowerCase()
      );
      if (names.some((name) => !name) || new Set(names).size !== names.length)
        draft.step = 1;
      return { draft, warning, restoreWarning: "" };
    }
  } catch {
    // Malformed browser data must not prevent a fresh setup.
  }
  return {
    draft: null,
    warning: "",
    restoreWarning:
      "The saved Quick Play setup could not be restored. Enter your players again.",
  };
}
