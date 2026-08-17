import type { ReactNode } from "react";
import { ArrowSquareOut, CalendarBlank, CheckCircle, Clock, MapPin } from "@phosphor-icons/react/dist/ssr";
import { sessions } from "@/db/schema";
import { formatSessionDateLong, formatSessionTime, peso } from "./format";

type SessionSummary = typeof sessions.$inferSelect;

export function SessionHero({ session, hostLabel }: { session: SessionSummary; hostLabel: string }) {
  return <div className="public-session-hero relative overflow-hidden bg-court px-5 pb-8 pt-7 text-white sm:rounded-t-xl sm:px-8 sm:pb-10">
    <div className="absolute inset-x-0 bottom-0 h-1 bg-primary" />
    <div className="absolute inset-y-0 right-[18%] w-px bg-court-line/20" />
    <div className="absolute right-0 top-[68%] h-px w-[36%] bg-court-line/20" />
    <p className="sport-label text-court-line">{formatSessionDateLong(session.startsAt).toUpperCase()}</p>
    <h1 className="relative mt-4 max-w-xl text-4xl font-[720] tracking-[-0.025em] sm:text-5xl">{session.title}</h1>
    <p className="relative mt-3 text-white/70">{hostLabel}</p>
  </div>;
}

export function SessionPlanDetails({ session, bookingAction }: { session: SessionSummary; bookingAction?: ReactNode }) {
  const durationMinutes = Math.round((session.endsAt.getTime() - session.startsAt.getTime()) / 60000);
  return <section aria-label="Session plan" className="public-session-plan grid grid-cols-2 gap-x-4 gap-y-6 border-b border-line">
    <div className="col-span-2 flex gap-3 sm:col-span-1"><CalendarBlank aria-hidden className="mt-0.5 shrink-0 text-primary" size={20} /><div><p className="font-semibold">{formatSessionDateLong(session.startsAt)}</p><p className="mt-1 text-sm text-muted">{formatSessionTime(session.startsAt, session.endsAt)}</p></div></div>
    <div className="col-span-2 flex gap-3 sm:col-span-1"><MapPin aria-hidden className="mt-0.5 shrink-0 text-primary" size={21} /><div className="min-w-0"><p className="font-semibold">{session.venueName}</p>{session.venueAddress ? <p className="mt-1 text-sm text-muted">{session.venueAddress}</p> : null}<a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(session.venueAddress || session.venueName)}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-9 items-center gap-1 text-[13px] font-semibold text-primary">Get directions <ArrowSquareOut aria-hidden size={14} /></a></div></div>
    <div className="col-span-2 flex gap-3 min-[360px]:col-span-1"><Clock aria-hidden className="mt-0.5 shrink-0 text-primary" size={20} /><div><p className="font-semibold">{durationMinutes >= 60 && durationMinutes % 60 === 0 ? `${durationMinutes / 60} ${durationMinutes === 60 ? "hour" : "hours"}` : `${durationMinutes} minutes`}</p><p className="mt-1 text-sm text-muted">{session.courtNumbers?.length ? `Courts ${session.courtNumbers.join(" & ")}` : `${session.courtCount} ${session.courtCount === 1 ? "court" : "courts"}`}</p></div></div>
    <div className="col-span-2 flex gap-3 min-[360px]:col-span-1"><CheckCircle aria-hidden className={`mt-0.5 shrink-0 ${session.bookedAt ? "text-success" : "text-muted"}`} size={20} /><div className="min-w-0"><p className="font-semibold">{session.bookedAt ? "Court confirmed" : "Booking pending"}</p><p className="mt-1 text-sm text-muted">{session.estimatedCostCents ? `${peso(session.estimatedCostCents)} estimated per player` : "Cost not added yet"}</p>{bookingAction ? <div className="mt-2">{bookingAction}</div> : null}</div></div>
  </section>;
}
