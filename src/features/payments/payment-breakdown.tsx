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

export function PaymentSplitType({
  expense,
}: {
  expense: Pick<
    typeof expenses.$inferSelect,
    "contributionMode" | "fixedRateCents"
  >;
}) {
  return (
    <p className="text-sm text-muted">
      {expense.contributionMode === "fixed"
        ? `${paymentMoney(expense.fixedRateCents ?? 0)} per player · Fixed amount`
        : "Split equally"}
    </p>
  );
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
    <div className="flex flex-col gap-2 text-sm">
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
    </div>
  );
}

export function PaymentCollectionProgress({
  expenseTotalCents,
  payments,
}: {
  expenseTotalCents: number;
  payments: Pick<
    typeof playerPayments.$inferSelect,
    "amountCents" | "status"
  >[];
}) {
  const included = payments.filter((payment) => payment.status !== "excluded");
  const assigned = included.reduce(
    (sum, payment) => sum + payment.amountCents,
    0
  );
  const paid = included.reduce(
    (sum, payment) =>
      sum + (payment.status === "confirmed" ? payment.amountCents : 0),
    0
  );
  const remaining = assigned - paid;
  const difference = assigned - expenseTotalCents;
  return (
    <section aria-label="Payment progress" className="space-y-3 text-sm">
      <dl className="space-y-2">
        <div className="flex justify-between gap-4 text-muted">
          <dt>Player total</dt>
          <dd className="score shrink-0">{paymentMoney(assigned)}</dd>
        </div>
        <div className="flex justify-between gap-4 text-muted">
          <dt>Paid</dt>
          <dd className="score shrink-0">{paymentMoney(paid)}</dd>
        </div>
        <div
          className={`flex justify-between gap-4 border-t border-line pt-3 font-semibold ${remaining === 0 && assigned > 0 ? "text-success" : ""}`}
        >
          <dt>Left to pay</dt>
          <dd className="score shrink-0">{paymentMoney(remaining)}</dd>
        </div>
      </dl>
      <p className="text-xs text-muted">
        {!included.length
          ? "No player shares assigned yet."
          : assigned === 0
            ? "No payment due."
            : remaining === 0
              ? "All player payments confirmed."
              : "Only confirmed payments count as paid."}
      </p>
      {included.length > 0 && difference !== 0 ? (
        <p className="text-xs text-muted">
          {difference < 0
            ? `Host covers ${paymentMoney(-difference)} beyond player shares.`
            : `Player shares are ${paymentMoney(difference)} above expenses.`}
        </p>
      ) : null}
    </section>
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
