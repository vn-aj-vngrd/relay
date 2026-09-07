import { Play } from "@phosphor-icons/react/dist/ssr";

import { ButtonLink } from "@/components/ui/button";

import { CompletedGameBanner, paymentAction } from "./completed-game-banner";
import type { SessionOverview } from "./overview";
import { playSetupNextAction, type SessionReadiness } from "./readiness";

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
  const cancelled = status === "cancelled";
  const playerPaymentAction = paymentAction(payment);
  const shellClass = embedded
    ? "bg-surface py-5"
    : "rounded-xl border border-line bg-surface p-4 sm:p-5";

  if (cancelled)
    return (
      <section className={`${shellClass} ${className}`}>
        <p className="text-sm font-semibold text-danger">Game cancelled</p>
        <h2 className="mt-1 text-lg font-bold">The plan is closed</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Joining and Play are closed. Payment records remain available for
          coordination.
        </p>
        {playerPaymentAction ? (
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

  if (completed)
    return (
      <CompletedGameBanner
        sessionId={sessionId}
        hrefBase={`/games/${sessionId}`}
        canReplay={canReplay}
        payment={payment}
        className={className}
      />
    );

  return (
    <section className={`${shellClass} ${className}`}>
      <p className="text-sm font-semibold text-primary">
        {isHost ? "Host access" : "Your response"}
      </p>
      <h2 className="mt-1 text-lg font-bold">
        {isHost
          ? status === "live"
            ? "Play is live"
            : "You manage this game"
          : responseLabel(rsvp)}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        {isHost
          ? status === "live"
            ? "Manage courts, scores, and the queue in Play. Booking and payment details can still be updated."
            : readiness.missing.includes("booking")
              ? "Confirm that the court is ready before setting up Play. Payments can be arranged separately."
              : "Confirm players and choose your rotation when the group reaches the court."
          : responseDetail(rsvp)}
      </p>
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
          {status === "live" ? "Open Play" : playSetupNextAction(readiness)}
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
