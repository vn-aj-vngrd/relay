import Link from "next/link";
import { CaretRight, ChatCircleDots, CurrencyCircleDollar, PlayCircle, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { Skeleton } from "@/components/shared/skeleton";
import type { SessionOverview } from "./overview";
import { peso } from "./format";

function playCopy(overview: SessionOverview, status: string) {
  const { play } = overview;
  if (play.featuredMatch) {
    return {
      value: `${play.featuredMatch.teamAScore}–${play.featuredMatch.teamBScore} · ${play.featuredMatch.courtLabel}`,
      detail: `${play.activeMatchCount} active · ${play.waitingCount} waiting`,
    };
  }
  if (status === "completed") return {
    value: `${play.completedMatchCount} ${play.completedMatchCount === 1 ? "match" : "matches"} played`,
    detail: "Scores and standings are saved",
  };
  if (status === "live") return {
    value: "Ready for the next match",
    detail: `${play.waitingCount} in the paddle stack`,
  };
  return { value: "Not started", detail: "The host starts Play at the venue" };
}

function paymentCopy(payment: SessionOverview["payment"]) {
  if (payment.view === "hidden") return { value: "Players only", detail: "Join to view your share" };
  if (payment.view === "none") return payment.canManage ? { value: "Set up payment", detail: "No split created yet" } : { value: "Nothing due", detail: "No payment request yet" };
  if (payment.view === "host") {
    if (payment.proofCount) return { value: `${payment.proofCount} ${payment.proofCount === 1 ? "proof" : "proofs"} to review`, detail: `${payment.unpaidCount} still unpaid` };
    return { value: payment.unpaidCount ? `${payment.unpaidCount} unpaid` : "All settled", detail: payment.unpaidCount ? "No proofs waiting for review" : "Everyone in the split is paid" };
  }
  if (payment.reviewRequested) return { value: "New proof needed", detail: `${peso(payment.amountCents)} assigned to you` };
  if (payment.status === "sent") return { value: "Proof sent", detail: `${peso(payment.amountCents)} awaiting host review` };
  if (payment.status === "confirmed") return { value: "Payment confirmed", detail: `${peso(payment.amountCents)} paid` };
  return { value: `${peso(payment.amountCents)} due`, detail: "Upload one screenshot after paying" };
}

export function SessionAtAGlanceSkeleton() {
  return <section className="pt-7"><Skeleton className="h-5 w-28" /><div className="mt-4 grid grid-cols-2 border-t border-line">{Array.from({ length: 4 }, (_, index) => <div key={index} className={`flex min-h-28 items-start gap-3 py-4 ${index % 2 ? "border-l border-line pl-4" : "pr-4"} ${index < 2 ? "border-b border-line" : ""}`}><Skeleton className="h-5 w-5 shrink-0" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-16" /><Skeleton className="h-4 w-full max-w-32" /><Skeleton className="h-3 w-full max-w-36" /></div></div>)}</div></section>;
}

export function SessionAtAGlance({
  overview,
  hrefBase,
  status,
  goingCount,
  capacity,
  waitlistCount,
  pendingCount = 0,
}: {
  overview: SessionOverview;
  hrefBase: string;
  status: string;
  goingCount: number;
  capacity: number;
  waitlistCount: number;
  pendingCount?: number;
}) {
  const play = playCopy(overview, status);
  const payment = paymentCopy(overview.payment);
  const rosterDetail = [waitlistCount ? `${waitlistCount} waitlisted` : "No waitlist", pendingCount ? `${pendingCount} to approve` : null].filter(Boolean).join(" · ");
  const items = [
    { href: `${hrefBase}/players`, icon: UsersThree, label: "Players", value: `${goingCount} of ${capacity} going`, detail: rosterDetail },
    { href: `${hrefBase}/play`, icon: PlayCircle, label: "Play", value: play.value, detail: play.detail },
    { href: `${hrefBase}/payments`, icon: CurrencyCircleDollar, label: "Payments", value: payment.value, detail: payment.detail },
    { href: `${hrefBase}/chat`, icon: ChatCircleDots, label: "Chat", value: overview.messageCount ? `${overview.messageCount} ${overview.messageCount === 1 ? "message" : "messages"}` : "No messages yet", detail: overview.messageCount ? "Open the game conversation" : "Start the conversation" },
  ];

  return <section aria-labelledby="session-glance-title" className="pt-7">
    <h2 id="session-glance-title" className="text-lg font-bold">At a glance</h2>
    <div className="mt-4 grid grid-cols-2 border-t border-line">
      {items.map(({ href, icon: Icon, label, value, detail }, index) => <Link key={label} href={href} className={`group flex min-h-28 min-w-0 items-start gap-2.5 py-4 ${index % 2 ? "border-l border-line pl-3 sm:pl-4" : "pr-3 sm:pr-4"} ${index < 2 ? "border-b border-line" : ""}`}>
        <Icon aria-hidden size={18} className="mt-0.5 shrink-0 text-primary" />
        <span className="min-w-0 flex-1"><span className="block text-xs font-medium text-muted">{label}</span><strong className="mt-1 block text-sm font-semibold leading-5 text-ink">{value}</strong><span className="mt-1 block text-xs leading-5 text-muted">{detail}</span></span>
        <CaretRight aria-hidden size={13} className="mt-0.5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
      </Link>)}
    </div>
  </section>;
}
