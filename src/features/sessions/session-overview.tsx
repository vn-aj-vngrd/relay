import { CaretRight, ChatCircleDots, CurrencyCircleDollar, PlayCircle } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { Skeleton } from "@/components/shared/skeleton";

import { peso } from "./format";
import type { SessionOverview } from "./overview";

function playCopy(overview: SessionOverview, status: string) {
  const { play } = overview;
  if (play.featuredMatch) {
    return {
      value: `${play.featuredMatch.teamAScore}–${play.featuredMatch.teamBScore} · ${play.featuredMatch.courtLabel}`,
      detail: `${play.activeMatchCount} active · ${play.waitingCount} waiting`,
    };
  }
  if (status === "completed")
    return {
      value: `${play.completedMatchCount} ${play.completedMatchCount === 1 ? "match" : "matches"} played`,
      detail: "Scores and standings are saved",
    };
  if (status === "live")
    return {
      value: "Ready for the next match",
      detail: `${play.waitingCount} in the paddle stack`,
    };
  return { value: "Not started", detail: "The host starts Play at the court" };
}

function paymentCopy(payment: SessionOverview["payment"]) {
  if (payment.view === "hidden") return { value: "Players only", detail: "Join to view your share" };
  if (payment.view === "none")
    return payment.canManage
      ? { value: "Set up payment", detail: "No split created yet" }
      : { value: "Nothing due", detail: "No payment request yet" };
  if (payment.view === "host") {
    if (payment.proofCount)
      return {
        value: `${payment.proofCount} ${payment.proofCount === 1 ? "proof" : "proofs"} to review`,
        detail: `${payment.unpaidCount} still unpaid`,
      };
    return {
      value: payment.unpaidCount ? `${payment.unpaidCount} unpaid` : "All settled",
      detail: payment.unpaidCount ? "No proofs waiting for review" : "Everyone in the split is paid",
    };
  }
  if (payment.reviewRequested)
    return { value: "New proof needed", detail: `${peso(payment.amountCents)} assigned to you` };
  if (payment.status === "sent")
    return { value: "Proof sent", detail: `${peso(payment.amountCents)} awaiting host review` };
  if (payment.status === "confirmed")
    return { value: "Payment confirmed", detail: `${peso(payment.amountCents)} paid` };
  return { value: `${peso(payment.amountCents)} due`, detail: "Upload one screenshot after paying" };
}

export function SessionAtAGlanceSkeleton() {
  return (
    <section className="pt-7">
      <Skeleton className="h-5 w-32" />
      <div className="mt-3 divide-y divide-line border-y border-line">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="flex min-h-16 items-center gap-3 py-3">
            <Skeleton className="h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-3 w-full max-w-48" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SessionAtAGlance({
  overview,
  hrefBase,
  status,
}: {
  overview: SessionOverview;
  hrefBase: string;
  status: string;
}) {
  const completed = status === "completed";
  const play = playCopy(overview, status);
  const payment = paymentCopy(overview.payment);
  const items = [
    {
      href: `${hrefBase}/play`,
      icon: PlayCircle,
      label: completed ? "Recap" : "Play",
      value: play.value,
      detail: play.detail,
    },
    {
      href: `${hrefBase}/payments`,
      icon: CurrencyCircleDollar,
      label: "Payments",
      value: payment.value,
      detail: payment.detail,
    },
    {
      href: `${hrefBase}/chat`,
      icon: ChatCircleDots,
      label: "Chat",
      value: overview.messageCount
        ? `${overview.messageCount} ${overview.messageCount === 1 ? "message" : "messages"}`
        : "No messages yet",
      detail: completed
        ? overview.messageCount
          ? "Game conversation saved"
          : "No game conversation"
        : overview.messageCount
          ? "Open the game conversation"
          : "Start the conversation",
    },
  ];

  return (
    <section aria-labelledby="session-activity-title" className="pt-7">
      <h2 id="session-activity-title" className="text-lg font-bold">
        Game activity
      </h2>
      <div className="mt-3 divide-y divide-line border-y border-line">
        {items.map(({ href, icon: Icon, label, value, detail }) => (
          <Link
            key={label}
            href={href}
            className="group flex min-h-16 min-w-0 items-start gap-3 py-3 hover:bg-surface-strong sm:px-2"
          >
            <Icon aria-hidden size={19} className="mt-0.5 shrink-0 text-primary" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium leading-5 text-muted">{label}</span>
              <span className="mt-0.5 block text-xs leading-5 text-muted">{detail}</span>
            </span>
            <strong className="w-28 shrink-0 text-left text-sm font-semibold leading-5 text-ink sm:w-36">
              {value}
            </strong>
            <CaretRight
              aria-hidden
              size={14}
              className="mt-0.5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
