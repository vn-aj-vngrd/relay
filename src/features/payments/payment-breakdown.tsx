import type { expenses, playerPayments } from "@/db/schema";
import { PaymentAdjustmentResponse } from "./payment-management-forms";

const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
export function paymentMoney(cents: number) {
  return currency.format(cents / 100);
}

export function PaymentBreakdown({
  expense,
}: {
  expense: Pick<
    typeof expenses.$inferSelect,
    "items" | "label" | "totalCents" | "contributionMode" | "fixedRateCents"
  >;
}) {
  const items = expense.items?.length
    ? expense.items
    : [{ label: expense.label, amountCents: expense.totalCents }];
  return (
    <div className="flex flex-col gap-2 py-3 text-sm">
      <p className="font-semibold">Expense breakdown</p>
      <ul className="flex flex-col gap-2">
        {items.map((item, index) => (
          <li
            key={`${index}-${item.label}`}
            className="flex justify-between gap-4"
          >
            <span className="min-w-0 break-words">{item.label}</span>
            <span className="score shrink-0">
              {paymentMoney(item.amountCents)}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-muted">
        {expense.contributionMode === "fixed"
          ? `${paymentMoney(expense.fixedRateCents ?? 0)} per player · Fixed contribution, independent of expense total.`
          : "Split expenses · Automatic shares can change with the roster until payment review begins."}
      </p>
    </div>
  );
}

export function CollectionBalance({
  expenseTotalCents,
  expectedCents,
}: {
  expenseTotalCents: number;
  expectedCents: number;
}) {
  const difference = expectedCents - expenseTotalCents;
  return (
    <p className="text-sm text-muted">
      Expected from assigned players: {paymentMoney(expectedCents)}.{" "}
      {difference < 0
        ? `Host shortfall: ${paymentMoney(-difference)}.`
        : difference > 0
          ? `Surplus above expenses: ${paymentMoney(difference)}.`
          : "Matches the expense total."}{" "}
      This is not a paid balance.
    </p>
  );
}

export function PaymentAdjustmentDetails({
  payment,
  canRespond = false,
}: {
  payment: Pick<
    typeof playerPayments.$inferSelect,
    "id" | "adjustmentReason" | "pendingAdjustment" | "adjustmentHistory"
  >;
  canRespond?: boolean;
}) {
  const proposal = payment.pendingAdjustment;
  return (
    <>
      {payment.adjustmentReason ? (
        <p className="mt-2 text-sm text-muted">
          Adjusted amount: {payment.adjustmentReason}
        </p>
      ) : null}
      {proposal ? (
        <section
          aria-label="Proposed payment change"
          className="mt-3 border-y border-line py-3"
        >
          <p className="text-sm font-semibold">
            Proposed amount: {paymentMoney(proposal.amountCents)}
          </p>
          <p className="mt-1 text-sm text-muted">{proposal.reason}</p>
          <p className="mt-1 text-sm text-muted">
            The current amount stays {paymentMoney(proposal.previousCents)}{" "}
            unless the player agrees.
          </p>
          {canRespond ? (
            <PaymentAdjustmentResponse
              paymentId={payment.id}
              proposalId={proposal.id}
            />
          ) : (
            <p className="mt-2 text-sm text-muted">
              Waiting for the player’s response.
            </p>
          )}
        </section>
      ) : null}
      {payment.adjustmentHistory?.length ? (
        <details className="mt-2 text-sm">
          <summary className="cursor-pointer py-2">Adjustment history</summary>
          <ul className="flex flex-col gap-2">
            {payment.adjustmentHistory.map((entry, index) => (
              <li key={`${entry.changedAt}-${index}`} className="text-muted">
                {paymentMoney(entry.previousCents)} →{" "}
                {paymentMoney(entry.amountCents)} · {entry.decision} ·{" "}
                {entry.reason}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </>
  );
}
