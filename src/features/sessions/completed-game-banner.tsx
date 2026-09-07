import { ArrowClockwise, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink } from "@/components/ui/button";
import { peso } from "./format";
import type { SessionOverview } from "./overview";

export function paymentAction(payment: SessionOverview["payment"]) {
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

export function CompletedGameBanner({
  sessionId,
  hrefBase,
  canReplay = false,
  canBrowse = false,
  payment = { view: "hidden" },
  className = "",
}: {
  sessionId: string;
  hrefBase: string;
  canReplay?: boolean;
  canBrowse?: boolean;
  payment?: SessionOverview["payment"];
  className?: string;
}) {
  const paymentLabel = paymentAction(payment);
  return (
    <section
      aria-label="Game ended"
      className={`rounded-xl border border-line bg-surface p-4 sm:p-5 ${className}`}
    >
      <div className="flex items-start gap-3">
        <CheckCircle
          aria-hidden
          size={21}
          weight="fill"
          className="mt-0.5 shrink-0 text-muted"
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-[680]">Game ended</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Joining is closed. View the recap for this game.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <ButtonLink href={`${hrefBase}/play`}>View recap</ButtonLink>
            {canReplay ? (
              <ButtonLink
                href={`/games/new?from=${sessionId}`}
                variant="secondary"
              >
                <ArrowClockwise aria-hidden size={16} /> Play again
              </ButtonLink>
            ) : null}
            {paymentLabel ? (
              <ButtonLink href={`${hrefBase}/payments`} variant="secondary">
                {paymentLabel}
              </ButtonLink>
            ) : null}
            {canBrowse ? (
              <ButtonLink href="/games/open" variant="secondary">
                Browse open games
              </ButtonLink>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
