import type { expenses, playerPayments } from "@/db/schema";
import { archivedPaymentLabel } from "./collection-lifecycle";
import {
  PaymentAdjustmentDetails,
  PaymentBreakdown,
  paymentMoney,
} from "./payment-breakdown";

export function PaymentHistory({
  collections,
  payments,
}: {
  collections: Array<{
    expense: typeof expenses.$inferSelect;
    receiptUrl?: string | null;
  }>;
  payments: Array<{
    payment: typeof playerPayments.$inferSelect;
    name?: string;
    proofUrl?: string | null;
  }>;
}) {
  if (!collections.length) return null;
  return (
    <section
      aria-labelledby="payment-history-heading"
      className="mt-8 border-t border-line pt-6"
    >
      <h2 id="payment-history-heading" className="text-lg font-semibold">
        Payment history
      </h2>
      <p className="mt-2 text-sm text-muted">
        These collections closed when the game became Free. Outstanding requests
        are cancelled. Previous payments and proof are retained; coordinate any
        refund with the host. Relay does not issue refunds.
      </p>
      <div className="mt-4 divide-y divide-line">
        {collections.map(({ expense, receiptUrl }) => (
          <details key={expense.id} className="py-4">
            <summary className="min-h-9 cursor-pointer text-sm font-semibold">
              {expense.label} · Closed · {paymentMoney(expense.totalCents)}{" "}
              expenses
            </summary>
            <div className="flex flex-col gap-4 pt-4">
              <PaymentBreakdown expense={expense} />
              {receiptUrl ? (
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-primary"
                >
                  View retained host receipt
                </a>
              ) : null}
              <ul className="divide-y divide-line">
                {payments
                  .filter(({ payment }) => payment.expenseId === expense.id)
                  .map(({ payment, name, proofUrl }) => (
                    <li key={payment.id} className="py-3">
                      <p className="text-sm font-semibold">
                        {name ?? "Your payment"} · Previously recorded{" "}
                        {paymentMoney(payment.amountCents)}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {archivedPaymentLabel(payment)}
                      </p>
                      <PaymentAdjustmentDetails
                        payment={payment}
                        canRespond={false}
                      />
                      {proofUrl ? (
                        <a
                          href={proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex min-h-9 items-center text-sm font-semibold text-primary"
                        >
                          View retained payment proof
                        </a>
                      ) : null}
                    </li>
                  ))}
              </ul>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
