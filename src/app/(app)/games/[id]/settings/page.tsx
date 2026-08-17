import { ArrowLeft, LockKey } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SessionNav } from "@/components/shared/session-nav";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/features/auth/session";
import { sessionAccentStyle } from "@/features/sessions/accent";
import { SessionSettingsForm, type SessionSettingsDefaults } from "@/features/sessions/session-settings-form";
import { getSessionForUser } from "@/features/sessions/queries";

function dateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return { date: `${value("year")}-${value("month")}-${value("day")}`, time: `${value("hour")}:${value("minute")}` };
}

export default async function GameSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const sessionId = (await params).id;
  const data = await getSessionForUser(sessionId, user.id);
  if (!data) notFound();
  const canEdit = data.session.hostId === user.id || data.membership?.role === "cohost";
  if (!canEdit) notFound();
  const locked = data.session.status !== "draft" && data.session.status !== "published";
  const start = dateParts(data.session.startsAt, data.session.timezone);
  const end = dateParts(data.session.endsAt, data.session.timezone);
  const defaults: SessionSettingsDefaults = {
    id: data.session.id,
    version: data.session.version,
    title: data.session.title,
    accentColor: data.session.accentColor,
    venue: data.session.venueName,
    venueAddress: data.session.venueAddress ?? "",
    date: start.date,
    start: start.time,
    end: end.time,
    capacity: data.session.capacity,
    courts: data.session.courtCount,
    courtNumbers: data.session.courtNumbers?.join(", ") ?? "",
    cost: data.session.estimatedCostCents == null ? "" : String(data.session.estimatedCostCents / 100),
    notes: data.session.notes ?? "",
    visibility: data.session.visibility,
    requiresApproval: data.session.requiresApproval,
    booked: Boolean(data.session.bookedAt),
    bookingReference: data.session.bookingReference ?? "",
    bookingTotal: data.session.bookingTotalCents == null ? "" : String(data.session.bookingTotalCents / 100),
    bookingNotes: data.session.bookingNotes ?? "",
  };

  return <div style={sessionAccentStyle(data.session.accentColor)}><div className="mb-5"><Link href={`/games/${sessionId}`} className="mb-3 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft aria-hidden size={16} />Overview</Link><p className="text-sm font-semibold text-primary">{data.session.title}</p><h1 className="mt-1 app-title">Game settings</h1><p className="mt-2 max-w-2xl text-muted">Keep the shared plan accurate for everyone with the invite.</p></div><SessionNav id={sessionId} active={null} /><div className="mx-auto max-w-3xl py-7">{locked ? <section className="border-y border-line py-10 text-center"><LockKey aria-hidden size={24} className="mx-auto text-muted" /><h2 className="mt-4 text-xl font-bold">Settings are locked</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">Game details stop changing once Live Mode begins or the session is complete. This protects court assignments, results, and the shared memory.</p><ButtonLink href={`/games/${sessionId}`} className="mt-6">Back to game</ButtonLink></section> : <SessionSettingsForm defaults={defaults} />}</div></div>;
}
