import { z } from "zod";

const sessionDetailsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Add a game name with at least 2 characters.")
    .max(80, "Keep the game name under 80 characters."),
  accentColor: z.enum(["violet", "blue", "teal", "green", "orange", "coral"]).default("violet"),
  startsAt: z.coerce.date({ error: "Choose a valid date and start time." }),
  endsAt: z.coerce.date({ error: "Choose a valid end time." }),
  venueName: z.string().trim().min(2, "Add the court name.").max(120, "Keep the court name under 120 characters."),
  venueAddress: z.string().trim().max(240, "Keep the court address under 240 characters.").optional(),
  capacity: z.coerce
    .number()
    .int("Player limit must be a whole number.")
    .min(2, "Invite at least 2 players.")
    .max(40, "Player limit can’t exceed 40."),
  courtCount: z.coerce
    .number()
    .int("Court quantity must be a whole number.")
    .min(1, "Choose at least 1 court.")
    .max(20, "Relay supports up to 20 courts per session."),
  notes: z.string().trim().max(1200, "Keep the note under 1,200 characters.").optional(),
  estimatedCostCents: z.coerce.number().int("Enter a valid amount.").nonnegative("Cost can’t be negative.").optional(),
});

function validateTimes(value: { startsAt: Date; endsAt: Date }, context: z.RefinementCtx) {
  if (value.endsAt <= value.startsAt)
    context.addIssue({ code: "custom", path: ["endsAt"], message: "End time must be after start time." });
}

export function createSessionSchema(now = new Date()) {
  return sessionDetailsSchema.superRefine((value, context) => {
    validateTimes(value, context);
    if (value.startsAt <= now)
      context.addIssue({ code: "custom", path: ["startsAt"], message: "Start time must be in the future." });
  });
}

export const updateSessionSchema = sessionDetailsSchema
  .extend({
    sessionId: z.uuid(),
    version: z.coerce.number().int().positive(),
    visibility: z.enum(["public", "link", "private"]),
    requiresApproval: z.coerce.boolean(),
    bookingReference: z.string().trim().max(120, "Keep the booking reference under 120 characters.").optional(),
    bookingTotalCents: z.coerce
      .number()
      .int("Enter a valid booking total.")
      .nonnegative("Booking total can’t be negative.")
      .optional(),
    bookingNotes: z.string().trim().max(600, "Keep booking notes under 600 characters.").optional(),
  })
  .superRefine(validateTimes);

export type RosterIdentity = { id: string; userId: string | null; guestTokenHash: string | null };

export function findRosterIdentity<T extends RosterIdentity>(
  roster: T[],
  actor: { userId?: string | null; guestTokenHash?: string | null },
): T | undefined {
  if (actor.userId) return roster.find((player) => player.userId === actor.userId);
  if (actor.guestTokenHash) return roster.find((player) => player.guestTokenHash === actor.guestTokenHash);
  return undefined;
}

export type CloneSource = {
  title: string;
  groupId?: string;
  venueId?: string;
  durationMinutes: number;
  capacity: number;
  courtCount: number;
  commonInviteeIds: string[];
  notes?: string;
};
export function cloneSession(source: CloneSource) {
  return {
    title: source.title,
    groupId: source.groupId,
    venueId: source.venueId,
    durationMinutes: source.durationMinutes,
    capacity: source.capacity,
    courtCount: source.courtCount,
    suggestedInviteeIds: [...source.commonInviteeIds],
  };
}

export function sessionInviteeIds(hostId: string, candidates: Array<string | null | undefined>) {
  return [...new Set(candidates.filter((id): id is string => Boolean(id)))].filter((id) => id !== hostId);
}
