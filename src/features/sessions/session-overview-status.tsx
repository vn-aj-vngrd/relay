import {
  ArrowClockwise,
  CheckCircle,
  Play,
} from "@phosphor-icons/react/dist/ssr";

import { ButtonLink } from "@/components/ui/button";

import { peso } from "./format";
import type { SessionOverview } from "./overview";
import type { SessionReadiness } from "./readiness";
import { SessionReadinessPanel } from "./session-readiness";

function responseLabel(rsvp?: string) {
  if (rsvp === "waitlisted") return "You’re on the waitlist";
  if (rsvp === "maybe") return "You responded maybe";
  return "You’re going";
}

function responseDetail(rsvp?: string) {
  if (rsvp === "waitlisted")
    return "Relay will keep your place in line if a spot opens.";
  if (rsvp === "maybe")
    return "Update your response when you know whether you can play.";
  return "You’re confirmed for this game.";
}

function paymentAction(payment: SessionOverview["payment"]) {
  if (
    payment.view !== "player" ||
    payment.status === "confirmed" ||
    payment.status === "excluded"
  )
    return null;
  if (payment.reviewRequested)
    return `Upload new proof · ${peso(payment.amountCents)}`;
  if (payment.status === "sent") return "View payment · Proof sent";
  return `View payment · ${peso(payment.amountCents)} due`;
}

export function SessionOverviewStatus({
  sessionId,
  status,
  isHost,
  canReplay = false,
  rsvp,
  payment,
  readiness,
  embedded = false,
  className = "",
}: {
  sessionId: string;
  status: string;
  isHost: boolean;
  canReplay?: boolean;
  rsvp?: string;
  payment: SessionOverview["payment"];
  readiness: SessionReadiness;
  embedded?: boolean;
  className?: string;
}) {
  const completed = status === "completed";
  const playerPaymentAction = paymentAction(payment);
  const shellClass = embedded
    ? "bg-surface py-5"
    : "rounded-xl border border-line bg-surface p-4 sm:p-5";

  if (completed)
    return (
      <section className={`${shellClass} ${className}`}>
        <p className="flex items-center gap-1.5 text-sm font-semibold text-success">
          <CheckCircle aria-hidden weight="fill" size={16} /> Game complete
        </p>
        <h2 className="mt-1 text-lg font-bold">Results are saved</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Scores, standings, payments, chat, and photos stay here.
        </p>
        <div className="mt-5 space-y-2">
          <ButtonLink href={`/games/${sessionId}/play`} className="w-full">
            View recap
          </ButtonLink>
          {playerPaymentAction ? (
            <ButtonLink
              href={`/games/${sessionId}/payments`}
              variant="secondary"
              className="w-full"
            >
              {playerPaymentAction}
            </ButtonLink>
          ) : null}
          {canReplay ? (
            <ButtonLink
              href={`/games/new?from=${sessionId}`}
              variant="secondary"
              className="w-full"
            >
              <ArrowClockwise aria-hidden size={16} /> Play again
            </ButtonLink>
          ) : null}
        </div>
      </section>
    );

  return (
    <section className={`${shellClass} ${className}`}>
      <p className="text-sm font-semibold text-primary">
        {isHost ? "Host access" : "Your response"}
      </p>
      <h2 className="mt-1 text-lg font-bold">
        {isHost ? "You manage this game" : responseLabel(rsvp)}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        {isHost
          ? "Finish the game setup, then open Play when the group reaches the court."
          : responseDetail(rsvp)}
      </p>
      {isHost ? (
        <SessionReadinessPanel readiness={readiness} sessionId={sessionId} />
      ) : null}
      {isHost ? (
        <ButtonLink
          href={
            status === "live"
              ? `/games/${sessionId}/play`
              : `/games/${sessionId}/play/setup`
          }
          className="mt-5 w-full"
        >
          <Play aria-hidden weight="fill" size={15} />
          {status === "live" ? "Open Play" : "Set up Play"}
        </ButtonLink>
      ) : playerPaymentAction ? (
        <ButtonLink
          href={`/games/${sessionId}/payments`}
          variant="secondary"
          className="mt-5 w-full"
        >
          {playerPaymentAction}
        </ButtonLink>
      ) : null}
    </section>
  );
}
