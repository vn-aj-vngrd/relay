"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db/client";
import { courts, sessionPlayers, sessionQueue, sessions } from "@/db/schema";
import { getCurrentUser, requireUser } from "@/features/auth/session";
import { ensureProfile } from "@/features/players/profile";
import { createSessionSchema, findRosterIdentity } from "./domain";
import { sessionSlug } from "./slug";

export type SessionActionState = { error?: string; success?: boolean; fieldErrors?: Record<string, string[]> };

function manilaDate(date: FormDataEntryValue | null, time: FormDataEntryValue | null) {
  if (typeof date !== "string" || typeof time !== "string") return new Date(Number.NaN);
  return new Date(`${date}T${time}:00+08:00`);
}

export async function createSessionAction(_: SessionActionState, formData: FormData): Promise<SessionActionState> {
  const user = await requireUser();
  await ensureProfile(user);
  const rawCost = formData.get("cost");
  const parsed = createSessionSchema.safeParse({
    title: formData.get("title"),
    venueName: formData.get("venue"),
    startsAt: manilaDate(formData.get("date"), formData.get("start")),
    endsAt: manilaDate(formData.get("date"), formData.get("end")),
    capacity: formData.get("capacity"),
    courtCount: formData.get("courts"),
    notes: formData.get("notes") || undefined,
    estimatedCostCents: typeof rawCost === "string" && rawCost ? Math.round(Number(rawCost) * 100) : undefined,
  });
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return {
      error: "A few details need attention. Check the fields marked below.",
      fieldErrors: {
        title: errors.title ?? [],
        venue: errors.venueName ?? [],
        date: errors.startsAt ?? [],
        start: errors.startsAt ?? [],
        end: errors.endsAt ?? [],
        capacity: errors.capacity ?? [],
        courts: errors.courtCount ?? [],
        notes: errors.notes ?? [],
        cost: errors.estimatedCostCents ?? [],
      },
    };
  }

  const intent = formData.get("intent") === "draft" ? "draft" : "published";
  const courtNumbers = String(formData.get("courtNumbers") ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  const created = await db.transaction(async (tx) => {
    const [session] = await tx.insert(sessions).values({
      slug: sessionSlug(parsed.data.title), hostId: user.id, title: parsed.data.title,
      venueName: parsed.data.venueName, startsAt: parsed.data.startsAt, endsAt: parsed.data.endsAt,
      capacity: parsed.data.capacity, courtCount: parsed.data.courtCount, courtNumbers,
      notes: parsed.data.notes, estimatedCostCents: parsed.data.estimatedCostCents,
      status: intent, publishedAt: intent === "published" ? new Date() : null,
      bookedAt: formData.get("booked") === "on" ? new Date() : null,
    }).returning();
    await tx.insert(sessionPlayers).values({ sessionId: session.id, userId: user.id, role: "host", rsvp: "going", playState: "waiting", respondedAt: new Date() });
    await tx.insert(courts).values(Array.from({ length: session.courtCount }, (__, index) => ({ sessionId: session.id, label: courtNumbers[index] ? `Court ${courtNumbers[index]}` : `Court ${index + 1}`, position: index + 1 })));
    return session;
  });
  revalidatePath("/");
  redirect(`/games/${created.id}`);
}

const rsvpInput = z.object({ sessionId: z.uuid(), choice: z.enum(["going", "maybe", "declined"]), guestName: z.string().trim().min(2).max(60).optional() });

export async function rsvpAction(_: SessionActionState, formData: FormData): Promise<SessionActionState> {
  const parsed = rsvpInput.safeParse({ sessionId: formData.get("sessionId"), choice: formData.get("choice"), guestName: formData.get("guestName") || undefined });
  if (!parsed.success) return { error: "Add your name before responding." };
  const session = await db.query.sessions.findFirst({ where: and(eq(sessions.id, parsed.data.sessionId), inArray(sessions.status, ["published", "live"])) });
  if (!session || session.rosterLocked) return { error: session?.rosterLocked ? "The host has locked this roster." : "This session is no longer accepting responses." };
  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const guestToken = cookieStore.get(`relay_guest_${session.id}`)?.value;
  const guestHash = guestToken ? await crypto.subtle.digest("SHA-256", new TextEncoder().encode(guestToken)).then((value) => Buffer.from(value).toString("hex")) : null;
  if (!user && !parsed.data.guestName && !guestToken) return { error: "Add your name before responding." };
  let newGuestToken: string | null = null;

  try {
    newGuestToken = await db.transaction(async (tx): Promise<string | null> => {
      await tx.execute(sql`select id from ${sessions} where id = ${session.id} for update`);
      const current = await tx.select().from(sessionPlayers).where(eq(sessionPlayers.sessionId, session.id));
      const identity = findRosterIdentity(current, { userId: user?.id, guestTokenHash: guestHash });
      const goingCount = current.filter((item) => item.rsvp === "going" && item.id !== identity?.id).length;
      const waitlistPosition = Math.max(0, ...current.map((item) => item.waitlistPosition ?? 0)) + 1;
      const nextRsvp = parsed.data.choice === "going" && goingCount >= session.capacity ? "waitlisted" : parsed.data.choice;
      const nextPosition = nextRsvp === "waitlisted" ? identity?.waitlistPosition ?? waitlistPosition : null;
      let createdToken: string | null = null;
      let actorPlayerId = identity?.id;
      if (identity) {
        await tx.update(sessionPlayers).set({ rsvp: nextRsvp, waitlistPosition: nextPosition, respondedAt: new Date(), playState: nextRsvp === "going" ? "waiting" : "unavailable" }).where(eq(sessionPlayers.id, identity.id));
      } else {
        createdToken = user ? null : crypto.randomUUID();
        const tokenHash = createdToken ? await crypto.subtle.digest("SHA-256", new TextEncoder().encode(createdToken)).then((value) => Buffer.from(value).toString("hex")) : null;
        const [createdPlayer] = await tx.insert(sessionPlayers).values({ sessionId: session.id, userId: user?.id, guestName: user ? null : parsed.data.guestName, guestTokenHash: tokenHash, rsvp: nextRsvp, waitlistPosition: nextPosition, respondedAt: new Date(), playState: nextRsvp === "going" ? "waiting" : "unavailable" }).returning({ id: sessionPlayers.id });
        actorPlayerId = createdPlayer.id;
      }
      if (session.status === "live" && actorPlayerId) {
        const queueEntry = await tx.query.sessionQueue.findFirst({ where: and(eq(sessionQueue.sessionId, session.id), eq(sessionQueue.sessionPlayerId, actorPlayerId)) });
        if (nextRsvp === "going" && !queueEntry) {
          const currentQueue = await tx.select().from(sessionQueue).where(eq(sessionQueue.sessionId, session.id));
          await tx.insert(sessionQueue).values({ sessionId: session.id, sessionPlayerId: actorPlayerId, position: Math.max(0, ...currentQueue.map((item) => item.position)) + 1, state: "waiting" });
        } else if (nextRsvp !== "going" && queueEntry) await tx.update(sessionQueue).set({ state: "unavailable" }).where(and(eq(sessionQueue.sessionId, session.id), eq(sessionQueue.sessionPlayerId, actorPlayerId)));
      }
      if (identity?.rsvp === "going" && nextRsvp !== "going") {
        const nextWaiting = current.filter((item) => item.rsvp === "waitlisted" && item.id !== identity.id).sort((a, b) => (a.waitlistPosition ?? Infinity) - (b.waitlistPosition ?? Infinity))[0];
        if (nextWaiting) await tx.update(sessionPlayers).set({ rsvp: "going", waitlistPosition: null, playState: "waiting" }).where(eq(sessionPlayers.id, nextWaiting.id));
      }
      return createdToken;
    });
  } catch (error) {
    console.error("RSVP mutation failed", error);
    return { error: "Your response couldn’t be saved. Check your connection and try again." };
  }
  if (newGuestToken) cookieStore.set(`relay_guest_${session.id}`, newGuestToken, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 90, path: `/s/${session.slug}` });
  revalidatePath(`/s/${session.slug}`);
  return { success: true };
}
