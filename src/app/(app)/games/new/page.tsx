import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { CalendarPlus, ChevronLeft } from "lucide-react";
import { db } from "@/db/client";
import { sessions } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { CreateSessionForm, type CreateSessionDefaults } from "@/features/sessions/create-session-form";

export default async function NewGamePage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const user = await requireUser();
  const date = new Date(); date.setUTCDate(date.getUTCDate() + ((6 - date.getUTCDay() + 7) % 7 || 7));
  const defaultDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  const sourceId = (await searchParams).from;
  const source = sourceId ? await db.query.sessions.findFirst({ where: and(eq(sessions.id, sourceId), eq(sessions.hostId, user.id)) }) : null;
  const time = (value: Date) => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: source?.timezone ?? "Asia/Manila" }).format(value);
  const defaults: CreateSessionDefaults = source ? { date: defaultDate, title: source.title, venue: source.venueName, capacity: source.capacity, courts: source.courtCount, start: time(source.startsAt), end: time(source.endsAt), cost: source.estimatedCostCents ? source.estimatedCostCents / 100 : undefined } : { date: defaultDate };
  return <div className="mx-auto max-w-2xl"><Link href="/" className="mb-6 inline-flex min-h-11 items-center gap-1 text-sm font-[680] text-muted hover:text-ink"><ChevronLeft size={19} strokeWidth={2.5} />Back home</Link><header className="mb-8 flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-white"><CalendarPlus size={24} strokeWidth={2.6} /></span><div><p className="sport-label text-primary">{source ? "Run it back" : "New session"}</p><h1 className="app-title mt-1">{source ? "Play again" : "Create a game"}</h1><p className="mt-2 text-pretty text-muted">{source ? "The familiar setup is ready. Pick a new date and publish when it looks right." : "Just the plan your friends need. Add payments, rotations, and scores when they become useful."}</p></div></header><CreateSessionForm defaults={defaults} /></div>;
}
