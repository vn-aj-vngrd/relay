import { ButtonLink } from "@/components/ui/button";
import type { expenses, paymentAccounts, playerPayments } from "@/db/schema";
import { isActiveCollection } from "./collection-lifecycle";
import { PaymentBreakdown, PaymentSplitType } from "./payment-breakdown";
import { EditExpenseForm, PaymentChoiceForm } from "./payment-management-forms";
import { PaymentSwitchForm } from "./payment-switch-form";

export function PaymentSettings({
  session,
  collections: allCollections,
  payments,
  isHost,
  revision,
}: {
  session: {
    id: string;
    status: string;
    playerPriceCents: number | null;
    paymentCollectionRequested?: boolean;
    bookingTotalCents: number | null;
    hostId: string;
  };
  collections: {
    expense: typeof expenses.$inferSelect;
    account: typeof paymentAccounts.$inferSelect | null;
  }[];
  payments: {
    payment: Pick<typeof playerPayments.$inferSelect, "expenseId">;
  }[];
  isHost: boolean;
  revision?: string;
}) {
  const collections = allCollections.filter(({ expense }) =>
    isActiveCollection(expense)
  );
  const history = allCollections.filter(
    ({ expense }) => !isActiveCollection(expense)
  );
  const previous = history.toSorted(
    (a, b) => Number(b.expense.archivedAt) - Number(a.expense.archivedAt)
  )[0];
  const open = session.status !== "cancelled";
  return (
    <section
      id="player-payment"
      aria-labelledby="player-payment-heading"
      className="mt-7 flex w-full min-w-0 flex-col gap-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id="player-payment-heading" className="text-lg font-bold">
          Payment settings
        </h2>
        <ButtonLink href={`/games/${session.id}/payments`} variant="secondary">
          View payments
        </ButtonLink>
      </div>
      {!open ? (
        <p className="text-sm text-muted">
          This game was cancelled. Payments are read-only.
        </p>
      ) : null}
      {collections.length > 1 ? (
        <p className="text-sm text-muted">
          This game has older, separate payments. Each keeps its own amounts and
          proof.
        </p>
      ) : null}
      {open && isHost && collections.length && revision ? (
        <PaymentSwitchForm sessionId={session.id} revision={revision} />
      ) : null}
      {!collections.length ? (
        open && isHost ? (
          <PaymentChoiceForm
            sessionId={session.id}
            price={session.playerPriceCents}
            collectionRequested={session.paymentCollectionRequested}
            bookingTotalCents={session.bookingTotalCents}
            revision={revision}
            hasHistory={history.length > 0}
            completed={session.status === "completed"}
            previousDefaults={
              previous
                ? {
                    label: previous.expense.label,
                    total: String(previous.expense.totalCents / 100),
                    items: JSON.stringify(previous.expense.items),
                    contributionMode: previous.expense.contributionMode,
                    fixedRate:
                      previous.expense.fixedRateCents == null
                        ? ""
                        : String(previous.expense.fixedRateCents / 100),
                    method: previous.account?.method ?? "GCash",
                    details: previous.account?.details ?? "",
                  }
                : undefined
            }
          />
        ) : (
          <p className="text-sm text-muted">
            {session.playerPriceCents === 0
              ? "Free game. No payment needed."
              : "The host hasn’t set up payment yet."}
          </p>
        )
      ) : null}
      {history.length ? (
        <section className="border-t border-line pt-4">
          <h3 className="font-semibold">Previous collections</h3>
          <p className="mt-2 text-sm text-muted">
            {history.length} closed. Expenses, payment records, and proof are
            retained in Payments. Outstanding requests are cancelled; Relay does
            not issue refunds.
          </p>
        </section>
      ) : null}
      {collections.map(({ expense, account }) => (
        <article key={expense.id} className="flex min-w-0 flex-col gap-6">
          {collections.length > 1 ? (
            <h3 className="border-t border-line pt-6 font-semibold">
              {expense.label}
            </h3>
          ) : null}
          {open && isHost ? (
            <EditExpenseForm
              sessionId={session.id}
              expenseId={expense.id}
              contributionReadOnly={
                collections.length > 1 ||
                payments.some(({ payment }) =>
                  collections.some(
                    ({ expense }) => expense.id === payment.expenseId
                  )
                )
              }
              totalReadOnly={payments.some(
                ({ payment }) => payment.expenseId === expense.id
              )}
              defaults={{
                label: expense.label,
                total: String(expense.totalCents / 100),
                items: JSON.stringify(expense.items ?? []),
                contributionMode: expense.contributionMode ?? "split",
                fixedRate:
                  expense.fixedRateCents == null
                    ? ""
                    : String(expense.fixedRateCents / 100),
                method: account?.method ?? "GCash",
                details: account?.details ?? "",
              }}
            />
          ) : (
            <div className="grid min-w-0 gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <PaymentSplitType expense={expense} />
                <PaymentBreakdown expense={expense} />
              </div>
              <div>
                <h3 className="font-semibold">Payment details</h3>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted">
                  {account?.method}
                  {"\n"}
                  {account?.details}
                </p>
              </div>
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
