import { z } from "zod";

export const openGameDateFilters = ["any", "today", "7d", "30d"] as const;
export type OpenGameDateFilter = (typeof openGameDateFilters)[number];

export const openGamesFilterSchema = z.object({
  date: z.enum(openGameDateFilters).default("any"),
  location: z.string().trim().max(80, "Keep the location search under 80 characters.").default(""),
  available: z
    .union([z.literal("1"), z.literal("0"), z.literal("")])
    .default("")
    .transform((value) => value === "1"),
});

const cursorSchema = z.object({ at: z.iso.datetime({ offset: true }), id: z.uuid() });
export type OpenGameCursor = { at: Date; id: string };

export function encodeOpenGameCursor(cursor: OpenGameCursor) {
  return Buffer.from(JSON.stringify({ at: cursor.at.toISOString(), id: cursor.id }), "utf8").toString("base64url");
}

export function parseOpenGameCursor(value: string | null | undefined): OpenGameCursor | null {
  if (!value) return null;
  try {
    const parsed = cursorSchema.safeParse(JSON.parse(Buffer.from(value, "base64url").toString("utf8")));
    return parsed.success ? { at: new Date(parsed.data.at), id: parsed.data.id } : null;
  } catch {
    return null;
  }
}

export type OpenGameItem = {
  id: string;
  slug: string;
  title: string;
  startsAt: string;
  endsAt: string;
  date: string;
  time: string;
  venue: string;
  venueAddress: string | null;
  hostName: string;
  playerCount: number;
  capacity: number;
  estimatedCostCents: number;
  requiresApproval: boolean;
  status: "published" | "live";
  accentColor: string;
  viewerRsvp: "invited" | "pending" | "going" | "maybe" | "waitlisted" | "declined" | null;
};

export type OpenGamesPage = { items: OpenGameItem[]; nextCursor: string | null };
export type OpenGamesFilters = z.output<typeof openGamesFilterSchema>;
