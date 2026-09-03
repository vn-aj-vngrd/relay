import { CheckCircle, Play } from "@phosphor-icons/react/dist/ssr";

import { ButtonLink } from "@/components/ui/button";

import { peso } from "./format";
import type { SessionReadiness } from "./readiness";
import { SessionReadinessPanel } from "./session-readiness";

function responseLabel(rsvp?: string) {
  if (rsvp === "waitlisted") return "You’re on the waitlist";
  if (rsvp === "maybe") return "You responded maybe";
  return "You’re going";
}

export function SessionOverviewStatus({
  sessionId,
  status,
  isHost,
  rsvp,
  estimatedCostCents,
  readiness,
}: {
  sessionId: string;
  status: string;
  isHost: boolean;
  rsvp?: string;
  estimatedCostCents: number | null;
  readiness: SessionReadiness;
}) {
  const completed = status === "completed";

  if (completed)
    return (
      <section className="rounded-xl border border-line bg-surface p-4 sm:p-5">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-success">
          <CheckCircle aria-hidden weight="fill" size={16} /> Game complete
        </p>
        <h2 className="mt-1 text-lg font-bold">Results are saved</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Scores, standings, payments, chat, and photos stay with this game.
        </p>
        {!isHost && estimatedCostCents ? (
          <ButtonLink href={`/games/${sessionId}/payments`} className="mt-5 w-full">
            View payment · {peso(estimatedCostCents)}
          </ButtonLink>
        ) : (
          <ButtonLink href={`/games/${sessionId}/play`} className="mt-5 w-full">
            View recap
          </ButtonLink>
        )}
      </section>
    );

  return (
    <section className="rounded-xl border border-line bg-surface p-4 sm:p-5">
      <p className="text-sm font-semibold text-primary">{isHost ? "Host access" : "Your response"}</p>
      <h2 className="mt-1 text-lg font-bold">{isHost ? "You manage this game" : responseLabel(rsvp)}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        {isHost
          ? "Editing, roster controls, payments, Play, and scoring appear only for hosts."
          : "You can view the plan and scores, chat with the group, and manage your own payment."}
      </p>
      {isHost ? <SessionReadinessPanel readiness={readiness} sessionId={sessionId} /> : null}
      {isHost ? (
        <ButtonLink
          href={status === "live" ? `/games/${sessionId}/play` : `/games/${sessionId}/play/setup`}
          className="mt-5 w-full"
        >
          <Play aria-hidden weight="fill" size={15} />
          {status === "live" ? "Open Play" : "Set up Play"}
        </ButtonLink>
      ) : estimatedCostCents ? (
        <ButtonLink href={`/games/${sessionId}/payments`} variant="secondary" className="mt-5 w-full">
          View payment · {peso(estimatedCostCents)}
        </ButtonLink>
      ) : null}
    </section>
  );
}
