import { z } from "zod";

export const createSessionSchema = z.object({
  title: z.string().trim().min(2).max(80),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  venueName: z.string().trim().min(2).max(120),
  capacity: z.coerce.number().int().min(2).max(40),
  courtCount: z.coerce.number().int().min(1).max(12),
  notes: z.string().trim().max(1200).optional(),
  estimatedCostCents: z.coerce.number().int().nonnegative().optional(),
}).superRefine((value, context) => {
  if (value.endsAt <= value.startsAt) context.addIssue({ code: "custom", path: ["endsAt"], message: "End time must be after start time" });
});

export type Rsvp = "invited" | "going" | "maybe" | "waitlisted" | "declined";
export type RosterPlayer = { id: string; rsvp: Rsvp; waitlistPosition?: number };
export type RosterIdentity = { id: string; userId: string | null; guestTokenHash: string | null };

export function findRosterIdentity<T extends RosterIdentity>(roster: T[], actor: { userId?: string | null; guestTokenHash?: string | null }): T | undefined {
  if (actor.userId) return roster.find((player) => player.userId === actor.userId);
  if (actor.guestTokenHash) return roster.find((player) => player.guestTokenHash === actor.guestTokenHash);
  return undefined;
}

export function applyRsvp(roster: RosterPlayer[], playerId: string, requested: Exclude<Rsvp, "invited" | "waitlisted">, capacity: number): RosterPlayer[] {
  if (capacity < 2) throw new Error("Session capacity must be at least 2");
  const existing = roster.find((player) => player.id === playerId);
  const withoutPlayer = roster.filter((player) => player.id !== playerId);
  const goingCount = withoutPlayer.filter((player) => player.rsvp === "going").length;
  const rsvp: Rsvp = requested === "going" && goingCount >= capacity ? "waitlisted" : requested;
  const maxWaitlist = withoutPlayer.reduce((max, player) => Math.max(max, player.waitlistPosition ?? 0), 0);
  return [...withoutPlayer, { id: playerId, rsvp, ...(rsvp === "waitlisted" ? { waitlistPosition: existing?.waitlistPosition ?? maxWaitlist + 1 } : {}) }];
}

export function promoteWaitlist(roster: RosterPlayer[], capacity: number): RosterPlayer[] {
  const open = Math.max(0, capacity - roster.filter((player) => player.rsvp === "going").length);
  if (open === 0) return roster;
  const promoted = new Set(roster.filter((player) => player.rsvp === "waitlisted").sort((a, b) => (a.waitlistPosition ?? Infinity) - (b.waitlistPosition ?? Infinity)).slice(0, open).map((player) => player.id));
  let position = 0;
  return roster.map((player) => {
    if (promoted.has(player.id)) return { id: player.id, rsvp: "going" as const };
    if (player.rsvp === "waitlisted") return { ...player, waitlistPosition: ++position };
    return player;
  });
}

export type CloneSource = { title: string; groupId?: string; venueId?: string; durationMinutes: number; capacity: number; courtCount: number; commonInviteeIds: string[]; notes?: string };
export function cloneSession(source: CloneSource) {
  return { title: source.title, groupId: source.groupId, venueId: source.venueId, durationMinutes: source.durationMinutes, capacity: source.capacity, courtCount: source.courtCount, suggestedInviteeIds: [...source.commonInviteeIds] };
}
